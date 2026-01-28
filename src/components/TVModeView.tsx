import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Music, User, Star, X, Users, Play, TrendingUp, TrendingDown, Maximize, Minimize, Edit, Search, Link, Loader2, Clock, UserCheck, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { decodeHtmlEntities } from '@/lib/htmlUtils';
import type { Performance } from '@/types/karaoke';
import type { WaitlistEntry } from '@/hooks/useWaitlist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useEventSettings } from '@/hooks/useEventSettings';

interface TVModeViewProps {
  performance: Performance | null;
  nextInQueue: WaitlistEntry | null;
  youtubeUrl: string | null;
  queueCount: number;
  onExit: () => void;
  onSelectNext: () => void;
  onChangeVideo?: (newUrl: string, newSongTitle?: string) => Promise<void>;
}

function extractVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

interface VoteEffect {
  id: number;
  isPositive: boolean;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
}

export function TVModeView({ performance, nextInQueue, youtubeUrl, queueCount, onExit, onSelectNext, onChangeVideo }: TVModeViewProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isRegistrationOpen, toggleRegistration } = useEventSettings();
  const isActive = performance?.status === 'ativa';
  const score = performance ? Number(performance.nota_media) : 0;
  const totalVotes = performance?.total_votos || 0;
  const videoId = youtubeUrl ? extractVideoId(youtubeUrl) : null;
  
  // Loading states for buttons
  const [isExiting, setIsExiting] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isTogglingRegistration, setIsTogglingRegistration] = useState(false);
  
  // Calculate estimated end time (4 min per song + 1 min break)
  const estimatedEndTime = useMemo(() => {
    const SONG_DURATION_MINUTES = 4;
    const BREAK_MINUTES = 1;
    const totalMinutes = queueCount * (SONG_DURATION_MINUTES + BREAK_MINUTES);
    const endTime = new Date(Date.now() + totalMinutes * 60 * 1000);
    return endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [queueCount]);

  const handleToggleRegistration = async () => {
    if (isTogglingRegistration) return;
    setIsTogglingRegistration(true);
    const success = await toggleRegistration();
    if (success) {
      toast({
        title: isRegistrationOpen ? t('registration.closedSuccess') : t('registration.opened'),
      });
    }
    setIsTogglingRegistration(false);
  };
  
  // Change video dialog state
  const [changeVideoOpen, setChangeVideoOpen] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newSongTitle, setNewSongTitle] = useState('');
  
  // YouTube search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isChangingVideo, setIsChangingVideo] = useState(false);
  
  // Autoplay state - starts paused when loading next singer
  const [shouldAutoplay, setShouldAutoplay] = useState(true);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track vote changes for effects
  const [voteEffects, setVoteEffects] = useState<VoteEffect[]>([]);
  const [prevVotes, setPrevVotes] = useState(0);
  const [prevScore, setPrevScore] = useState(0);
  const effectIdRef = useRef(0);

  // Fullscreen handlers
  const enterFullscreen = useCallback(async () => {
    try {
      if (containerRef.current && document.fullscreenEnabled) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.log('Fullscreen not available:', err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.log('Error exiting fullscreen:', err);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Auto-enter fullscreen on mount
  useEffect(() => {
    enterFullscreen();
    
    // Listen for fullscreen changes (e.g., user pressing ESC)
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Exit fullscreen on unmount
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [enterFullscreen]);

  const handleExit = async () => {
    if (isExiting) return;
    setIsExiting(true);
    await onExit();
  };

  const handleSelectNext = async () => {
    if (isLoadingNext || !nextInQueue) return;
    setIsLoadingNext(true);
    setShouldAutoplay(false); // Load video paused
    await onSelectNext();
    setIsLoadingNext(false);
  };

  const handleChangeVideo = async (url?: string, songTitle?: string) => {
    const videoUrl = url || newVideoUrl.trim();
    if (!onChangeVideo || !videoUrl) return;
    setIsChangingVideo(true);
    try {
      await onChangeVideo(videoUrl, songTitle);
      setNewVideoUrl('');
      setNewSongTitle('');
      setSearchQuery('');
      setSearchResults([]);
      setChangeVideoOpen(false);
      setShouldAutoplay(false); // Load new video paused
    } finally {
      setIsChangingVideo(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: searchQuery.trim() },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setSearchResults(data.videos || []);

      if (data.videos?.length === 0) {
        toast({ title: t('youtube.noVideoFound'), description: t('youtube.tryOtherTerms') });
      }
    } catch (error) {
      console.error('Error searching YouTube:', error);
      toast({ title: t('youtube.searchError'), description: t('youtube.cantSearchVideos'), variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };


  const handleSelectSearchResult = (video: YouTubeVideo) => {
    handleChangeVideo(video.url, decodeHtmlEntities(video.title));
  };

  useEffect(() => {
    // Detect new vote
    if (totalVotes > prevVotes && prevVotes > 0) {
      const isPositive = score >= prevScore;
      const newEffect: VoteEffect = {
        id: effectIdRef.current++,
        isPositive
      };
      setVoteEffects(prev => [...prev, newEffect]);
      
      // Remove effect after animation
      setTimeout(() => {
        setVoteEffects(prev => prev.filter(e => e.id !== newEffect.id));
      }, 1500);
    }
    
    setPrevVotes(totalVotes);
    setPrevScore(score);
  }, [totalVotes, score, prevVotes, prevScore]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
    >
      {/* Control Buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
        {/* Change Video Button */}
        {isActive && onChangeVideo && (
          <Dialog open={changeVideoOpen} onOpenChange={setChangeVideoOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                title={t('tv.changeVideo')}
              >
                <Edit className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg" container={containerRef.current}>
              <DialogHeader>
                <DialogTitle>{t('tv.changeVideoTitle')}</DialogTitle>
                <DialogDescription>{t('tv.changeVideoDesc')}</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="search" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="search" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    {t('tv.searchTab')}
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    {t('tv.urlTab')}
                  </TabsTrigger>
                </TabsList>
                
                {/* Search Tab */}
                <TabsContent value="search" className="space-y-3 mt-4">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        onKeyDown={handleSearchKeyDown} 
                        placeholder={t('youtube.searchPlaceholder')} 
                        className="pl-10" 
                        disabled={isSearching || isChangingVideo} 
                      />
                    </div>
                    <Button onClick={handleSearch} disabled={isSearching || isChangingVideo} variant="secondary">
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : t('youtube.search')}
                    </Button>
                  </div>

                  {searchResults.length > 0 && (
                    <ScrollArea className="h-[250px] rounded-lg border border-border bg-background/50">
                      <div className="p-2 space-y-2">
                        {searchResults.map((video) => (
                          <button 
                            key={video.id} 
                            onClick={() => handleSelectSearchResult(video)} 
                            disabled={isChangingVideo} 
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left group disabled:opacity-50"
                          >
                            <div className="relative flex-shrink-0">
                              <img src={video.thumbnail} alt={video.title} className="w-24 h-14 object-cover rounded-md" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <Play className="h-5 w-5 text-white fill-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-2 text-foreground">{decodeHtmlEntities(video.title)}</p>
                              <p className="text-xs text-muted-foreground mt-1 truncate">{video.channelTitle}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
                
                {/* URL Tab */}
                <TabsContent value="url" className="space-y-3 mt-4">
                  <Input
                    value={newSongTitle}
                    onChange={(e) => setNewSongTitle(e.target.value)}
                    placeholder={t('signup.songTitlePlaceholder')}
                    disabled={isChangingVideo}
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="flex-1"
                      disabled={isChangingVideo}
                    />
                    <Button 
                      onClick={() => handleChangeVideo(undefined, newSongTitle.trim() || undefined)} 
                      disabled={isChangingVideo || !newVideoUrl.trim() || !newSongTitle.trim()}
                    >
                      {isChangingVideo ? (
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        t('tv.save')
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('tv.urlHint')}
                  </p>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Fullscreen Toggle */}
        <Button
          onClick={toggleFullscreen}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          title={isFullscreen ? t('tv.exitFullscreen') : t('tv.enterFullscreen')}
        >
          {isFullscreen ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </Button>
        
        {/* Exit Button */}
        <Button
          onClick={handleExit}
          variant="ghost"
          size="icon"
          disabled={isExiting}
          className="text-muted-foreground hover:text-foreground"
        >
          {isExiting ? (
            <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <X className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Top Bar - Two rows for better responsiveness */}
      <div className="bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
        {/* Row 1: Singer Info (Primary - Large & Prominent) */}
        <div className="flex flex-wrap items-center justify-center gap-3 p-2 border-b border-border/30">
          {/* Now Singing - Main highlight */}
          {isActive && performance && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 px-4 py-2 glass-card"
            >
              <Mic2 className="w-5 h-5 text-primary animate-pulse flex-shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                <span className="text-lg font-black font-display neon-text-cyan truncate">
                  {performance.cantor}
                </span>
                <span className="hidden sm:block text-muted-foreground">•</span>
                <div className="flex items-center gap-1 min-w-0">
                  <Music className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span className="text-sm text-foreground/80 truncate">
                    {performance.musica}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Score Panel - Prominent with enhanced vote effects */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 px-4 py-2 glass-card relative overflow-visible"
          >
            <Star className="w-5 h-5 text-accent fill-accent flex-shrink-0" />
            <span className={`text-2xl font-black font-display ${
              score >= 9 ? 'neon-text-gold' : score >= 7 ? 'neon-text-cyan' : 'text-foreground'
            }`}>
              {score.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground border-l border-border/50 pl-3 ml-1">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{totalVotes} {t('tv.votes')}</span>
            </div>
            
            {/* Vote Effects - More visible */}
            <AnimatePresence>
              {voteEffects.map((effect) => (
                <motion.div
                  key={effect.id}
                  initial={{ opacity: 0, scale: 0.3, y: 10 }}
                  animate={{ opacity: 1, scale: 1.2, y: -40 }}
                  exit={{ opacity: 0, scale: 0.5, y: -60 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${
                    effect.isPositive 
                      ? 'bg-neon-green/30 text-neon-green border-2 border-neon-green' 
                      : 'bg-destructive/30 text-destructive border-2 border-destructive'
                  }`}
                >
                  {effect.isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  +1
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Next in Queue - Prominent button */}
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={handleSelectNext}
            disabled={!nextInQueue || isLoadingNext}
            className="flex items-center gap-2 px-4 py-2 glass-card hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('tv.nextUp')}:
            </span>
            {isLoadingNext ? (
              <>
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground">{t('waitlist.loading')}</span>
              </>
            ) : nextInQueue ? (
              <>
                <span className="text-base font-bold font-display neon-text-gold truncate max-w-[150px]">
                  {nextInQueue.singer_name}
                </span>
                <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </motion.button>
        </div>

        {/* Row 2: Coordinator Controls (Secondary - Smaller) */}
        <div className="flex flex-wrap items-center justify-center gap-2 px-2 py-1.5 text-muted-foreground">
          {/* Queue Stats */}
          <div className="flex items-center gap-1 text-xs">
            <Users className="w-3 h-3" />
            <span className="font-medium text-foreground">{queueCount}</span>
            <span>{t('tv.queueCount')}</span>
          </div>

          {queueCount > 0 && (
            <>
              <span className="text-xs">•</span>
              <div className="flex items-center gap-1 text-xs">
                <Clock className="w-3 h-3" />
                <span>{t('tv.estimatedEnd')}:</span>
                <span className="font-medium text-foreground">{estimatedEndTime}</span>
              </div>
            </>
          )}

          <span className="text-xs">•</span>

          {/* Registration Toggle */}
          <button
            onClick={handleToggleRegistration}
            disabled={isTogglingRegistration}
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors disabled:opacity-50 ${
              isRegistrationOpen 
                ? 'hover:bg-destructive/10 text-foreground' 
                : 'hover:bg-primary/10'
            }`}
          >
            {isTogglingRegistration ? (
              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isRegistrationOpen ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
            <span>{isRegistrationOpen ? t('registration.closeBtn') : t('registration.openBtn')}</span>
          </button>
        </div>
      </div>

      {/* Video Area - Full Space */}
      <div className="flex-1 p-2">
        <div className="w-full h-full rounded-lg overflow-hidden neon-border-cyan border">
          {videoId ? (
            <iframe
              key={`${videoId}-${shouldAutoplay}`}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=${shouldAutoplay ? 1 : 0}&rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video player"
            />
          ) : (
            <div className="w-full h-full bg-muted/50 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Mic2 className="w-24 h-24 mx-auto mb-4 animate-pulse" />
                <p className="text-2xl">{t('tv.waitingPerformance')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-muted-foreground text-xs py-1"
      >
        {t('tv.exitHint')}
      </motion.p>
    </motion.div>
  );
}
