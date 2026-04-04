import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Search, Loader2, Play, ArrowLeft, Music, Link, AlertCircle, ExternalLink, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ParticipantWaitlist } from '@/components/ParticipantWaitlist';
import { ParticipantRegistrationModal } from '@/components/ParticipantRegistrationModal';
import { ConsentTermsModal } from '@/components/ConsentTermsModal';
import { VotingPreferenceToggle } from '@/components/VotingPreferenceToggle';
import { LeaveButton } from '@/components/LeaveButton';
import { YouTubePreview } from '@/components/YouTubePreview';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { InstanceNotFound } from '@/components/InstanceNotFound';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWaitlist } from '@/hooks/useWaitlist';
import { useActivePerformance } from '@/hooks/usePerformance';
import { useUserProfile, UserProfile } from '@/hooks/useUserProfile';
import { useEventSettings } from '@/hooks/useEventSettings';
import { useInstanceByCode } from '@/hooks/useInstanceByCode';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useParticipant } from '@/hooks/useParticipant';
import { useLanguage } from '@/i18n/LanguageContext';
import { decodeHtmlEntities } from '@/lib/htmlUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
}

export default function Inscricao() {
  const navigate = useNavigate();
  const { instanceCode } = useParams<{ instanceCode?: string }>();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // If instanceCode is provided, look up the instance
  const { instance, loading: instanceLoading, error: instanceError } = useInstanceByCode(instanceCode);
  const instanceId = instance?.id || null;
  
  // Device ID and participant registration (same as Vote page)
  const deviceId = useDeviceId();
  const { participant, loading: participantLoading, registerParticipant } = useParticipant(instanceId, deviceId);
  
  const { addToWaitlist, updateSong, entries: waitlistEntries, loading: waitlistLoading } = useWaitlist(instanceId);
  const { performance } = useActivePerformance(instanceId);
  const { profile, loading: profileLoading, saveProfile, updateVotingPreference, acceptTerms } = useUserProfile();
  const { isRegistrationOpen, loading: settingsLoading } = useEventSettings(instanceId);
  
  // Consent modal state - show for first-time users who haven't accepted terms
  const [showConsentModal, setShowConsentModal] = useState(false);
  // Current voting preference for this submission
  const [currentAllowVoting, setCurrentAllowVoting] = useState(true);
  
  const [singerName, setSingerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [showQueuePositionDialog, setShowQueuePositionDialog] = useState(false);

  // Set singer name from participant when loaded
  useEffect(() => {
    if (participant && !singerName) {
      setSingerName(participant.name);
    }
  }, [participant?.name]); // Only depend on participant.name

  // Initialize voting preference from profile
  useEffect(() => {
    if (profile?.allowVoting !== undefined) {
      setCurrentAllowVoting(profile.allowVoting);
    }
  }, [profile?.allowVoting]);

  // Handle registration completion - save to localStorage for other features
  const handleRegistrationComplete = async (name: string, phone: string, email: string): Promise<{ success: boolean; error?: string }> => {
    const result = await registerParticipant(name, phone, email);
    
    if (result.success) {
      // Also save to localStorage for profile features
      saveProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
      });
      // Set singer name after registration
      setSingerName(name.trim());
    }
    
    return result;
  };

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const [manualSongTitle, setManualSongTitle] = useState('');

  const handleManualUrl = () => {
    if (!singerName.trim()) {
      toast({
        title: t('signup.enterName'),
        variant: 'destructive',
      });
      return;
    }
    
    const videoId = extractVideoId(manualUrl.trim());
    if (!videoId) {
      toast({
        title: t('signup.invalidUrl'),
        variant: 'destructive',
      });
      return;
    }
    
    if (!manualSongTitle.trim()) {
      toast({
        title: t('signup.enterSongTitle'),
        variant: 'destructive',
      });
      return;
    }
    
    const video: YouTubeVideo = {
      id: videoId,
      title: manualSongTitle.trim(),
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      channelTitle: 'YouTube',
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
    
    setSelectedVideo(video);
    setManualUrl('');
    setManualSongTitle('');
    setSearchError('');
    setShowConfirmDialog(true);
  };

  const YT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

  const getSearchCache = (query: string): YouTubeVideo[] | null => {
    try {
      const key = `yt_search_${query.toLowerCase().trim()}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw) as { data: YouTubeVideo[]; ts: number };
      if (Date.now() - ts > YT_CACHE_TTL_MS) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  };

  const setSearchCache = (query: string, data: YouTubeVideo[]) => {
    try {
      const key = `yt_search_${query.toLowerCase().trim()}`;
      localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
      // localStorage cheio ou indisponível — ignora silenciosamente
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: t('signup.enterSong'),
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setVideos([]);
    setSelectedVideo(null);
    setSearchError('');

    const query = searchQuery.trim();

    // Verifica cache antes de chamar a API
    const cached = getSearchCache(query);
    if (cached) {
      setVideos(cached);
      setIsSearching(false);
      if (cached.length === 0) {
        toast({
          title: t('signup.noVideoFound'),
          description: t('signup.tryOtherTerms'),
        });
      }
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query },
      });

      if (error) throw new Error(error.message);

      setVideos(data.videos || []);

      if (data.error) {
        setSearchError(data.error);
        setShowManualInput(true);
      } else if (data.videos?.length > 0) {
        setSearchCache(query, data.videos);
      }

      if (data.videos?.length === 0 && !data.error) {
        toast({
          title: t('signup.noVideoFound'),
          description: t('signup.tryOtherTerms'),
        });
      }
    } catch (error) {
      console.error('Error searching YouTube:', error);
      setSearchError(t('signup.cantSearchVideos'));
      setShowManualInput(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };


  const handleSelectVideo = (video: YouTubeVideo) => {
    if (!singerName.trim()) {
      toast({
        title: t('signup.enterName'),
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedVideo(video);
    
    // If user hasn't accepted terms yet, show consent modal first
    // Check explicitly for true (undefined or false should show consent)
    if (profile?.termsAccepted !== true) {
      setShowConsentModal(true);
    } else {
      // User already accepted terms, show confirmation dialog directly
      setShowConfirmDialog(true);
    }
  };

  const handleConsentAccept = (allowVoting: boolean) => {
    // Save terms acceptance and voting preference
    // Create or update profile with terms accepted
    const updatedProfile = {
      name: participant?.name || singerName.trim(),
      phone: participant?.phone,
      email: participant?.email,
      termsAccepted: true,
      allowVoting
    };
    saveProfile(updatedProfile);
    
    setCurrentAllowVoting(allowVoting);
    setShowConsentModal(false);
    // Now show the confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleVotingPreferenceChange = (allowVoting: boolean) => {
    setCurrentAllowVoting(allowVoting);
    updateVotingPreference(allowVoting);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedVideo) return;

    setIsSubmitting(true);
    setShowConfirmDialog(false);

    // Pass the current voting preference
    const success = await addToWaitlist(
      singerName.trim(),
      selectedVideo.url,
      decodeHtmlEntities(selectedVideo.title),
      undefined,
      false, // insertFirst = false
      currentAllowVoting
    );

    setIsSubmitting(false);

    if (success) {
      // Reset form
      setSearchQuery('');
      setVideos([]);
      setSelectedVideo(null);

      // Calcula posição na fila (entradas waiting após o insert)
      const waitingCount = waitlistEntries.filter(e => e.status === 'waiting').length;
      // A nova entrada já foi inserida; waitlistEntries pode ainda não ter atualizado (realtime)
      // então soma 1 para garantir que pelo menos posição 1 é exibida
      const position = waitingCount > 0 ? waitingCount : 1;
      setQueuePosition(position);
      setShowQueuePositionDialog(true);
    }
  };

  // Instance not found (only when instanceCode was provided)
  if (instanceCode && instanceError) {
    return <InstanceNotFound instanceCode={instanceCode} error={instanceError} />;
  }

  if (profileLoading || instanceLoading || participantLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show registration modal if participant is not registered (same logic as Vote page)
  if (!participant && instanceId) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <ParticipantRegistrationModal
          open={true}
          onRegister={handleRegistrationComplete}
          instanceName={instance?.name}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg p-4 relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      
      {/* Consent Terms Modal - shown on first "Quero Cantar" before music selection confirmation */}
      <ConsentTermsModal
        open={showConsentModal}
        onAccept={handleConsentAccept}
        isSubmitting={false}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-display font-bold text-gradient">
              {t('signup.title')}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t('signup.subtitle')}
          </p>
          {participant && (
            <p className="text-sm text-primary">
              {t('signup.welcomeBack')}, {participant.name}!
            </p>
          )}
        </div>

        {/* Registration Closed Message */}
        {!isRegistrationOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 text-center border-destructive/50"
          >
            <Lock className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold text-destructive mb-2">
              {t('registration.closedByHost')}
            </h2>
            <p className="text-muted-foreground">
              {t('registration.closedMessage')}
            </p>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => navigate(instanceCode ? `/app/vote/${instanceCode}` : '/app/vote')}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('signup.goToVoting')}
              </Button>
              <Button
                onClick={() => navigate(instanceCode ? `/app/ranking/${instanceCode}` : '/app/ranking')}
                variant="outline"
                className="flex-1"
              >
                {t('signup.showRanking')}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Form - only show if registration is open */}
        {isRegistrationOpen && (
          <div className="glass-card p-6 space-y-6">
            {/* Singer Name */}
            <div className="space-y-2">
              <Label htmlFor="singer-name" className="text-lg flex items-center gap-2">
                <Mic className="h-4 w-4" />
                {t('signup.yourName')}
              </Label>
              <Input
                id="singer-name"
                value={singerName}
                onChange={(e) => setSingerName(e.target.value)}
                placeholder={t('signup.namePlaceholder')}
                className="text-lg"
                disabled={!!profile}
              />
          </div>

          {/* Song Search */}
          <div className="space-y-2">
            <Label className="text-lg flex items-center gap-2">
              <Search className="h-4 w-4" />
              {t('signup.searchSong')} <span className="text-muted-foreground text-xs font-normal">(música, cantor ou gênero)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('signup.songPlaceholder')}
                className="flex-1"
                disabled={isSearching}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                variant="secondary"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('signup.search')
                )}
              </Button>
            </div>
            {searchError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/40 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-amber-500/20">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-amber-600 dark:text-amber-400">
                      {t('signup.searchUnavailable')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('signup.searchUnavailableHint')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Manual URL Input - Only shows when search fails */}
          {showManualInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{t('signup.orPasteUrl')}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-lg flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  {t('signup.pasteUrl')}
                </Label>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground flex-1">
                    {t('signup.karaokeHint')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => window.open('https://www.youtube.com/results?search_query=karaoke', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    YouTube
                  </Button>
                </div>
                <Input
                  value={manualSongTitle}
                  onChange={(e) => setManualSongTitle(e.target.value)}
                  placeholder={t('signup.songTitlePlaceholder')}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Input
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder={t('signup.urlPlaceholder')}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleManualUrl}
                    disabled={!manualUrl.trim() || !manualSongTitle.trim()}
                    variant="secondary"
                  >
                    {t('signup.load')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}


          {/* Video Results */}
          {videos.length > 0 && (
            <ScrollArea className="h-[250px] rounded-lg border border-border bg-background/50">
              <div className="p-2 space-y-2">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleSelectVideo(video)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left group ${
                      selectedVideo?.id === video.id
                        ? 'bg-primary/20 border border-primary/50'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-24 h-14 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                        <Play className="h-5 w-5 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2 text-foreground">
                        {decodeHtmlEntities(video.title)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {video.channelTitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          
          {isSubmitting && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Queue Position Dialog - shown after successful registration */}
          <AlertDialog open={showQueuePositionDialog} onOpenChange={setShowQueuePositionDialog}>
            <AlertDialogContent className="max-w-sm text-center">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl">🎤 Você está na fila!</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 pt-2">
                    <p className="text-4xl font-bold text-primary">#{queuePosition}</p>
                    <p className="text-base text-muted-foreground">
                      {queuePosition === 1
                        ? 'Você é o próximo a cantar!'
                        : `Você está na posição ${queuePosition} da fila de espera.`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Acompanhe a fila em tempo real na página de votação.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="justify-center">
                <AlertDialogAction
                  onClick={() => {
                    setShowQueuePositionDialog(false);
                    navigate(instanceCode ? `/app/vote/${instanceCode}` : '/app/vote');
                  }}
                >
                  Ver fila
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Confirmation Dialog with Preview */}
          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>{t('signup.confirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4">
                    <p>{t('signup.confirmQuestion')}</p>
                    {selectedVideo && (
                      <div className="space-y-3">
                        <p className="font-medium text-sm text-foreground">
                          {decodeHtmlEntities(selectedVideo.title)}
                        </p>
                        <YouTubePreview 
                          videoId={selectedVideo.id} 
                          maxDuration={30}
                        />
                      </div>
                    )}
                    
                    {/* Voting Preference Toggle - shown for returning users who already accepted terms */}
                    {profile?.termsAccepted === true && (
                      <div className="pt-2 border-t border-border">
                        <VotingPreferenceToggle
                          allowVoting={currentAllowVoting}
                          onChange={handleVotingPreferenceChange}
                        />
                      </div>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('signup.confirmNo')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmSubmit}>
                  {t('signup.confirmYes')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        )}

        {/* Waitlist */}
        <ParticipantWaitlist
          entries={waitlistEntries}
          loading={waitlistLoading}
          currentSingerName={performance?.cantor}
          userProfile={profile}
          onChangeSong={updateSong}
        />

        {/* Navigation */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              onClick={() => navigate(instanceCode ? `/app/vote/${instanceCode}` : '/app/vote')}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('signup.goToVoting')}
            </Button>
            <Button
              onClick={() => navigate(instanceCode ? `/app/ranking/${instanceCode}` : '/app/ranking')}
              variant="outline"
              className="flex-1"
            >
              {t('signup.showRanking')}
            </Button>
          </div>
          
          {/* Leave Button */}
          <LeaveButton />
        </div>
        
        {/* Footer Promotional Message */}
        <div className="text-center mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground">
            Quer levar o sistema Mamute Karaokê para seu evento, casa ou estabelecimento?{' '}
            <a 
              href="https://www.mamutekaraoke.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Acesse o site www.mamutekaraoke.com.br
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
