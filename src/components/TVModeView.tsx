import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Music, User, Star, X, Users, Play, TrendingUp, TrendingDown, Maximize, Minimize, Edit, Search, Link, Loader2, Clock, UserCheck, Lock, Unlock, Film, VolumeX, Pencil, Check, List, ChevronDown, ChevronLeft, SkipForward, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InstructionVideoButtons } from '@/components/InstructionVideoButtons';
import { TVAddSingerDialog } from '@/components/TVAddSingerDialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEventSettings } from '@/hooks/useEventSettings';
import { InstructionVideo } from '@/hooks/useInstructionVideos';

interface TVModeViewProps {
  performance: Performance | null;
  nextInQueue: WaitlistEntry | null;
  youtubeUrl: string | null;
  queueCount: number;
  instanceId: string | null;
  onExit: () => void;
  onSelectNext: () => void;
  onSelectPrevious?: () => void;
  previousPerformer?: { cantor: string; musica: string } | null;
  onChangeVideo?: (newUrl: string, newSongTitle?: string) => Promise<void>;
  // Video instruction props
  currentInstructionVideo?: InstructionVideo | null;
  isPlayingInstructionVideo?: boolean;
  onPlayInstructionVideo?: (video: InstructionVideo) => void;
  onUpdateSingerName?: (entryId: string, newName: string) => Promise<boolean>;
  // Full waitlist for dropdown
  waitlistEntries?: WaitlistEntry[];
  // History entries for dropdown
  historyEntries?: WaitlistEntry[];
  // Jump to specific entry in the queue
  // action: 'next' = move to top of queue, 'now_end' = start now and end current, 'now_return' = start now and return current to queue
  onJumpToEntry?: (entry: WaitlistEntry, action: 'now_end' | 'now_return' | 'next') => Promise<void>;
  // Add singer to waitlist (for TV mode enrollment)
  onAddToWaitlist?: (singerName: string, youtubeUrl: string, songTitle: string, registeredBy?: string, insertFirst?: boolean) => Promise<boolean>;
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

export function TVModeView({ 
  performance, 
  nextInQueue, 
  youtubeUrl, 
  queueCount, 
  instanceId, 
  onExit, 
  onSelectNext, 
  onSelectPrevious,
  previousPerformer,
  onChangeVideo,
  currentInstructionVideo,
  isPlayingInstructionVideo = false,
  onPlayInstructionVideo,
  onUpdateSingerName,
  waitlistEntries = [],
  historyEntries = [],
  onJumpToEntry,
  onAddToWaitlist,
}: TVModeViewProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isRegistrationOpen, toggleRegistration } = useEventSettings(instanceId);
  const isActive = performance?.status === 'ativa';
  const score = performance ? Number(performance.nota_media) : 0;
  const totalVotes = performance?.total_votos || 0;
  
  // Determine which video to show
  const displayUrl = isPlayingInstructionVideo && currentInstructionVideo 
    ? currentInstructionVideo.youtube_url 
    : youtubeUrl;
  const videoId = displayUrl ? extractVideoId(displayUrl) : null;
  
  // Loading states for buttons
  const [isExiting, setIsExiting] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
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
  
  // Edit singer name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  
  // Jump to entry dialog state
  const [jumpDialogOpen, setJumpDialogOpen] = useState(false);
  const [selectedJumpEntry, setSelectedJumpEntry] = useState<WaitlistEntry | null>(null);
  const [isJumping, setIsJumping] = useState(false);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track vote changes for effects
  const [voteEffects, setVoteEffects] = useState<VoteEffect[]>([]);
  const [prevVotes, setPrevVotes] = useState(0);
  const [prevScore, setPrevScore] = useState(0);
  const effectIdRef = useRef(0);

  // Handle clicking on an entry in the dropdown to jump to it
  const handleEntryClick = (entry: WaitlistEntry) => {
    if (!onJumpToEntry) return;
    setSelectedJumpEntry(entry);
    setJumpDialogOpen(true);
  };

  const handleJumpConfirm = async (action: 'now_end' | 'now_return' | 'next') => {
    if (!selectedJumpEntry || !onJumpToEntry) return;
    setIsJumping(true);
    try {
      await onJumpToEntry(selectedJumpEntry, action);
      setJumpDialogOpen(false);
      setSelectedJumpEntry(null);
    } finally {
      setIsJumping(false);
    }
  };

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

  const handleSelectPrevious = async () => {
    if (isLoadingPrevious || !onSelectPrevious || !previousPerformer) return;
    setIsLoadingPrevious(true);
    setShouldAutoplay(false);
    await onSelectPrevious();
    setIsLoadingPrevious(false);
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
          {/* Instruction Video Indicator */}
          {isPlayingInstructionVideo && currentInstructionVideo && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 px-4 py-2 glass-card bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50"
            >
              <Film className="w-5 h-5 text-amber-500 animate-pulse flex-shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                <span className="text-lg font-black font-display text-amber-500">
                  Vídeo Explicativo
                </span>
                <span className="hidden sm:block text-muted-foreground">•</span>
                <span className="text-sm text-foreground/80 truncate">
                  {currentInstructionVideo.title}
                </span>
              </div>
            </motion.div>
          )}

          {/* Now Singing - Main highlight (hide when playing instruction video) */}
          {!isPlayingInstructionVideo && isActive && performance && (
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

          {/* Score Panel - Show "Apresentação sem votação" when voting is disabled */}
          {performance?.allow_voting === false ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 px-6 py-3 glass-card bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-2 border-orange-500/30"
            >
              <VolumeX className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <span className="text-xl md:text-2xl font-bold font-display text-orange-400">
                Apresentação sem votação
              </span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 px-6 py-3 glass-card relative overflow-visible bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-primary/30"
            >
              <Star className="w-8 h-8 text-accent fill-accent flex-shrink-0 animate-pulse" />
              <span className={`text-5xl md:text-6xl font-black font-display drop-shadow-lg ${
                score >= 9 ? 'neon-text-gold' : score >= 7 ? 'neon-text-cyan' : 'text-foreground'
              }`}>
                {score.toFixed(1)}
              </span>
              <div className="flex items-center gap-2 text-muted-foreground border-l-2 border-border/50 pl-4 ml-2">
                <Users className="w-6 h-6" />
                <span className="text-xl font-bold">{totalVotes}</span>
                <span className="text-sm">{t('tv.votes')}</span>
              </div>
            
            {/* Logo - Larger in top bar */}
            <div className="flex items-center border-l-2 border-border/50 pl-4 ml-2">
              <img 
                src="/img/mamute-logo.png" 
                alt="Mamute Karaokê" 
                className="h-16 md:h-20 object-contain"
              />
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
          )}

          {/* Previous Performer - Go back button */}
          {onSelectPrevious && previousPerformer && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2 px-4 py-2 glass-card"
            >
              <button
                onClick={handleSelectPrevious}
                disabled={isLoadingPrevious}
                className="flex items-center gap-2 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group rounded px-2 py-1"
                title="Voltar ao cantor anterior"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Anterior:
                </span>
                {isLoadingPrevious ? (
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-sm font-medium text-foreground/80 truncate max-w-[120px]">
                    {previousPerformer.cantor}
                  </span>
                )}
              </button>
            </motion.div>
          )}

          {/* Next in Queue - Prominent button */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 px-4 py-2 glass-card"
          >
            {isEditingName && nextInQueue ? (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('tv.nextUp')}:
                </span>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onUpdateSingerName && nextInQueue) {
                      onUpdateSingerName(nextInQueue.id, editingName).then(() => {
                        setIsEditingName(false);
                      });
                    } else if (e.key === 'Escape') {
                      setIsEditingName(false);
                    }
                  }}
                  className="h-8 w-32 text-sm"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-primary"
                  onClick={() => {
                    if (onUpdateSingerName && nextInQueue) {
                      onUpdateSingerName(nextInQueue.id, editingName).then(() => {
                        setIsEditingName(false);
                      });
                    }
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setIsEditingName(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={handleSelectNext}
                disabled={!nextInQueue || isLoadingNext}
                className="flex items-center gap-2 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group rounded px-2 py-1"
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
              </button>
            )}
            
            {/* Edit name button */}
            {onUpdateSingerName && nextInQueue && !isEditingName && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  setEditingName(nextInQueue.singer_name);
                  setIsEditingName(true);
                }}
                title={t('waitlist.editName')}
              >
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
          </motion.div>
        </div>

        {/* Row 2: Coordinator Controls (Secondary - Smaller) */}
        <div className="flex flex-wrap items-center justify-center gap-2 px-2 py-1.5 text-muted-foreground">
          {/* Queue Stats with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-xs hover:bg-accent/50 px-2 py-0.5 rounded transition-colors">
                <List className="w-3 h-3" />
                <span className="font-medium text-foreground">{queueCount}</span>
                <span>{t('tv.queueCount')}</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="center" 
              className="w-80 bg-popover border border-border shadow-lg z-[100]"
              container={containerRef.current}
            >
              <Tabs defaultValue="queue" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="queue" className="text-xs flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Fila ({queueCount})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Histórico ({historyEntries.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="queue" className="mt-0">
                  <ScrollArea className="h-64">
                    {waitlistEntries.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum cantor na fila</p>
                      </div>
                    ) : (
                      <div className="p-1">
                        {onJumpToEntry && (
                          <div className="px-2 py-1 text-xs text-muted-foreground bg-muted/50 rounded mb-1">
                            Clique para pular para um cantor
                          </div>
                        )}
                        {waitlistEntries.map((entry, index) => (
                          <button 
                            key={entry.id} 
                            className={`w-full flex items-center gap-2 py-2 px-2 rounded text-left ${onJumpToEntry ? 'cursor-pointer hover:bg-accent/50' : 'cursor-default'}`}
                            onClick={() => onJumpToEntry && handleEntryClick(entry)}
                          >
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {entry.singer_name}
                                {entry.times_sung > 0 && (
                                  <span className="ml-1 text-xs text-muted-foreground">({entry.times_sung}x)</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{entry.song_title}</p>
                            </div>
                            {onJumpToEntry && (
                              <SkipForward className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="history" className="mt-0">
                  <ScrollArea className="h-64">
                    {historyEntries.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum cantor cantou ainda</p>
                      </div>
                    ) : (
                      <div className="p-1">
                        {onJumpToEntry && (
                          <div className="px-2 py-1 text-xs text-muted-foreground bg-muted/50 rounded mb-1">
                            Clique para recuperar uma música
                          </div>
                        )}
                        {historyEntries.map((entry) => (
                          <button 
                            key={entry.id} 
                            className={`w-full flex items-center gap-2 py-2 px-2 rounded text-left ${onJumpToEntry ? 'cursor-pointer hover:bg-accent/50 hover:opacity-100' : 'cursor-default'} opacity-70`}
                            onClick={() => onJumpToEntry && handleEntryClick(entry)}
                          >
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                              <UserCheck className="w-3 h-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {entry.singer_name}
                                {entry.times_sung > 1 && (
                                  <span className="ml-1 text-xs text-muted-foreground">({entry.times_sung}x)</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{entry.song_title}</p>
                            </div>
                            {onJumpToEntry && (
                              <Play className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </DropdownMenuContent>
          </DropdownMenu>

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

          {/* Instruction Video Buttons */}
          {onPlayInstructionVideo && !isPlayingInstructionVideo && (
            <>
              <span className="text-xs">•</span>
              <InstructionVideoButtons
                onPlayVideo={onPlayInstructionVideo}
                disabled={false}
                currentPlayingId={currentInstructionVideo?.id}
                size="sm"
                variant="ghost"
                className="text-xs"
              />
            </>
          )}


          {/* Add Singer Button */}
          {onAddToWaitlist && (
            <>
              <span className="text-xs">•</span>
              <TVAddSingerDialog 
                onAddToWaitlist={onAddToWaitlist}
                container={containerRef.current}
              />
            </>
          )}

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

      {/* Score Panel - Hide when playing instruction video */}
      {isPlayingInstructionVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/30"
        >
          <Film className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-amber-500 font-medium">
            Votação pausada durante o vídeo explicativo
          </span>
        </motion.div>
      )}

      {/* Video Area - Full Space */}
      <div className="flex-1 p-2">
        <div className="w-full h-full rounded-lg overflow-hidden neon-border-cyan border">
          {videoId ? (
            <iframe
              key={`${videoId}-${shouldAutoplay}`}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=${shouldAutoplay ? 1 : 0}&rel=0&fs=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
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

      {/* Jump to Entry Confirmation Dialog */}
      <AlertDialog open={jumpDialogOpen} onOpenChange={setJumpDialogOpen}>
        <AlertDialogContent className="z-[200] sm:max-w-md" container={containerRef.current}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Pular para cantor
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {selectedJumpEntry && (
                  <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="font-medium text-foreground">{selectedJumpEntry.singer_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedJumpEntry.song_title}</p>
                  </div>
                )}
                <p className="mt-3">O que deseja fazer?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            {/* Option 1: Set as next */}
            <Button
              onClick={() => handleJumpConfirm('next')}
              disabled={isJumping}
              variant="outline"
              size="lg"
              className="w-full h-12 text-base"
            >
              {isJumping ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <SkipForward className="h-5 w-5 mr-2" />
              )}
              Será o próximo
            </Button>
            
            {/* Divider */}
            <div className="w-full flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              <span>ou cantar agora</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            
            {/* Option 2: Sing now options */}
            <div className="w-full grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleJumpConfirm('now_return')}
                disabled={isJumping}
                variant="secondary"
                size="lg"
                className="flex flex-col items-center gap-1 h-auto py-4"
              >
                {isJumping ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
                <span className="text-sm font-medium">Cantar agora</span>
                <span className="text-xs text-muted-foreground">atual volta à fila</span>
              </Button>
              <Button
                onClick={() => handleJumpConfirm('now_end')}
                disabled={isJumping}
                size="lg"
                className="flex flex-col items-center gap-1 h-auto py-4"
              >
                {isJumping ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
                <span className="text-sm font-medium">Cantar agora</span>
                <span className="text-xs text-muted-foreground/70">encerrar atual</span>
              </Button>
            </div>
            
            <AlertDialogCancel disabled={isJumping} className="w-full h-11 text-base mt-2">Cancelar</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </motion.div>
  );
}
