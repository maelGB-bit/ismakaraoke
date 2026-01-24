import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Music, User, Star, X, Users, Play, TrendingUp, TrendingDown, Maximize, Minimize, Edit, Search, Link, Loader2 } from 'lucide-react';
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

interface TVModeViewProps {
  performance: Performance | null;
  nextInQueue: WaitlistEntry | null;
  youtubeUrl: string | null;
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

export function TVModeView({ performance, nextInQueue, youtubeUrl, onExit, onSelectNext, onChangeVideo }: TVModeViewProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const isActive = performance?.status === 'ativa';
  const score = performance ? Number(performance.nota_media) : 0;
  const totalVotes = performance?.total_votos || 0;
  const videoId = youtubeUrl ? extractVideoId(youtubeUrl) : null;
  
  // Loading states for buttons
  const [isExiting, setIsExiting] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  
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

      {/* Top Bar - Compact Info */}
      <div className="flex items-center gap-2 p-2 bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
        {/* Now Singing */}
        {isActive && performance && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 px-3 py-1 glass-card"
          >
            <Mic2 className="w-4 h-4 text-primary animate-pulse" />
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-primary" />
              <span className="text-sm font-bold font-display neon-text-cyan truncate max-w-[150px]">
                {performance.cantor}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">•</span>
            <div className="flex items-center gap-1">
              <Music className="w-3 h-3 text-secondary" />
              <span className="text-xs text-foreground/80 truncate max-w-[200px]">
                {performance.musica}
              </span>
            </div>
          </motion.div>
        )}

        {/* Score Panel - Compact */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 px-3 py-1 glass-card relative"
        >
          <Star className="w-4 h-4 text-accent fill-accent" />
          <span className={`text-xl font-black font-display ${
            score >= 9 ? 'neon-text-gold' : score >= 7 ? 'neon-text-cyan' : 'text-foreground'
          }`}>
            {score.toFixed(1)}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground border-l border-border/50 pl-2 ml-1">
            <Users className="w-3 h-3" />
            <span className="text-xs">{totalVotes}</span>
          </div>
          
          {/* Vote Effects */}
          <AnimatePresence>
            {voteEffects.map((effect) => (
              <motion.div
                key={effect.id}
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: -30 }}
                exit={{ opacity: 0, scale: 0.5, y: -50 }}
                transition={{ duration: 0.5 }}
                className={`absolute -top-1 right-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                  effect.isPositive 
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                    : 'bg-destructive/20 text-destructive border border-destructive/50'
                }`}
              >
                {effect.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                +1
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Next in Queue - Compact Button */}
        <motion.button
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={handleSelectNext}
          disabled={!nextInQueue || isLoadingNext}
          className="flex items-center gap-2 px-3 py-1 glass-card hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
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
              <span className="text-sm font-bold font-display neon-text-gold truncate max-w-[120px]">
                {nextInQueue.singer_name}
              </span>
              <Play className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </motion.button>

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
