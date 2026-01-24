import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Search, Loader2, Play, ArrowLeft, Music, UserPlus, Link, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ParticipantWaitlist } from '@/components/ParticipantWaitlist';
import { UserRegistrationModal } from '@/components/UserRegistrationModal';
import { LeaveButton } from '@/components/LeaveButton';
import { YouTubePreview } from '@/components/YouTubePreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWaitlist } from '@/hooks/useWaitlist';
import { useActivePerformance } from '@/hooks/usePerformance';
import { useUserProfile, UserProfile } from '@/hooks/useUserProfile';
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
  const { toast } = useToast();
  const { t } = useLanguage();
  const { addToWaitlist, entries: waitlistEntries, loading: waitlistLoading } = useWaitlist();
  const { performance } = useActivePerformance();
  const { profile, loading: profileLoading, saveProfile } = useUserProfile();
  
  const [singerName, setSingerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registerForOther, setRegisterForOther] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Set singer name from profile when loaded
  useEffect(() => {
    if (profile && !registerForOther) {
      setSingerName(profile.name);
    }
  }, [profile, registerForOther]);

  // Show registration if no profile
  useEffect(() => {
    if (!profileLoading && !profile) {
      setShowRegistration(true);
    }
  }, [profileLoading, profile]);

  const handleRegistrationComplete = (newProfile: UserProfile) => {
    saveProfile(newProfile);
    setSingerName(newProfile.name);
    setShowRegistration(false);
  };

  const handleRegisterForOtherChange = (checked: boolean) => {
    setRegisterForOther(checked);
    if (checked) {
      setSingerName('');
    } else if (profile) {
      setSingerName(profile.name);
    }
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
    toast({
      title: t('signup.videoLoaded'),
    });
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

    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: searchQuery.trim() },
      });

      if (error) throw new Error(error.message);
      
      setVideos(data.videos || []);

      if (data.error) {
        setSearchError(data.error);
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
    setSelectedVideo(video);
  };

  const handleRequestConfirmation = () => {
    if (!singerName.trim()) {
      toast({
        title: t('signup.enterName'),
        variant: 'destructive',
      });
      return;
    }

    if (!selectedVideo) {
      toast({
        title: t('signup.selectSong'),
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedVideo) return;
    
    setIsSubmitting(true);
    setShowConfirmDialog(false);

    // If registering for someone else, pass the current user's name as registeredBy
    const registeredBy = registerForOther && profile ? profile.name : undefined;

    const success = await addToWaitlist(
      singerName.trim(),
      selectedVideo.url,
      decodeHtmlEntities(selectedVideo.title),
      registeredBy
    );

    setIsSubmitting(false);

    if (success) {
      // Reset form
      if (registerForOther) {
        setSingerName('');
        setRegisterForOther(false);
        if (profile) setSingerName(profile.name);
      }
      setSearchQuery('');
      setVideos([]);
      setSelectedVideo(null);
      
      // Navigate to voting page
      navigate('/vote');
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg p-4">
      {showRegistration && (
        <UserRegistrationModal onComplete={handleRegistrationComplete} />
      )}

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
          {profile && (
            <p className="text-sm text-primary">
              {t('signup.welcomeBack')}, {profile.name}!
            </p>
          )}
        </div>

        {/* Form */}
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
              disabled={!registerForOther && !!profile}
            />
          </div>

          {/* Register for another person */}
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-accent/20 border border-accent/30">
            <Checkbox
              id="register-other"
              checked={registerForOther}
              onCheckedChange={handleRegisterForOtherChange}
            />
            <Label 
              htmlFor="register-other" 
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <UserPlus className="h-4 w-4" />
              {t('signup.registerOther')}
            </Label>
          </div>

          {registerForOther && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-muted-foreground"
            >
              {t('signup.registerOtherHint')}
            </motion.p>
          )}

          {/* Manual URL Input */}
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

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{t('signup.orSearch')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Song Search */}
          <div className="space-y-2">
            <Label className="text-lg flex items-center gap-2">
              <Search className="h-4 w-4" />
              {t('signup.searchSong')}
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
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-xs">{searchError}</p>
              </motion.div>
            )}
          </div>

          {/* Selected Video */}
          {selectedVideo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-lg bg-primary/10 border border-primary/30"
            >
              <p className="text-sm text-muted-foreground mb-1">{t('signup.selectedSong')}</p>
              <div className="flex items-center gap-3">
                <img
                  src={selectedVideo.thumbnail}
                  alt={selectedVideo.title}
                  className="w-20 h-12 object-cover rounded"
                />
                <p className="font-medium text-sm line-clamp-2 flex-1">
                  {decodeHtmlEntities(selectedVideo.title)}
                </p>
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

          {/* Submit Button - only show if video is selected */}
          {selectedVideo && !isSubmitting && (
            <Button
              onClick={handleRequestConfirmation}
              disabled={!singerName.trim() || !selectedVideo}
              size="lg"
              className="w-full text-lg"
            >
              <Mic className="mr-2 h-5 w-5" />
              {t('signup.wantToSing')}
            </Button>
          )}
          
          {isSubmitting && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

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

        {/* Waitlist */}
        <ParticipantWaitlist 
          entries={waitlistEntries} 
          loading={waitlistLoading}
          currentSingerName={performance?.cantor}
          userProfile={profile}
        />

        {/* Navigation */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/vote')}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('signup.goToVoting')}
            </Button>
            <Button
              onClick={() => navigate('/ranking')}
              variant="outline"
              className="flex-1"
            >
              {t('signup.showRanking')}
            </Button>
          </div>
          
          {/* Leave Button */}
          <LeaveButton />
        </div>
      </motion.div>
    </div>
  );
}
