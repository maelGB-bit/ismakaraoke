import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Trophy, Video, Mic2, LogOut, Menu, Trash2, Monitor, Home, Edit, Lock, Unlock, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { YouTubeSearch } from '@/components/YouTubeSearch';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { ConfettiEffect } from '@/components/ConfettiEffect';
import { HostWaitlistPanel } from '@/components/HostWaitlistPanel';
import { HostAuth, useHostAuth } from '@/components/HostAuth';
import { TVModeView } from '@/components/TVModeView';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NoInstanceAssigned } from '@/components/NoInstanceAssigned';
import { SubscriptionExpired } from '@/components/SubscriptionExpired';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { supabase } from '@/integrations/supabase/client';
import { useActivePerformance, useRanking } from '@/hooks/usePerformance';
import { useWaitlist } from '@/hooks/useWaitlist';
import { useEventSettings } from '@/hooks/useEventSettings';
import { useKaraokeInstance } from '@/hooks/useKaraokeInstance';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Performance } from '@/types/karaoke';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

function HostContent() {
  const navigate = useNavigate();
  const { instanceCode } = useParams<{ instanceCode?: string }>();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { logout, user } = useHostAuth();
  
  console.log('[HostContent] Rendering with user:', user?.id, user?.email, 'instanceCode:', instanceCode);
  
  // Check if user is admin (for accessing any instance by code)
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(!!instanceCode);
  
  useEffect(() => {
    const checkAdmin = async () => {
      if (!instanceCode) {
        setAdminLoading(false);
        return;
      }
      
      const { data } = await supabase.rpc('is_admin');
      setIsAdmin(!!data);
      setAdminLoading(false);
    };
    
    checkAdmin();
  }, [instanceCode]);
  
  // Get the coordinator's karaoke instance OR admin-specified instance by code
  const { instance, loading: instanceLoading, isExpired } = useKaraokeInstance({
    coordinatorId: instanceCode ? undefined : user?.id, // If we have instanceCode, don't use user ID
    instanceCode: instanceCode // Pass instanceCode for admin access
  });
  
  console.log('[HostContent] Instance:', { instance, instanceLoading, isExpired, userId: user?.id, instanceCode, isAdmin });
  
  const instanceId = instance?.id || null;
  
  const { performance, setPerformance } = useActivePerformance(instanceId);
  const { performances: ranking } = useRanking(instanceId);
  const {
    entries: waitlistEntries,
    historyEntries,
    loading: waitlistLoading,
    historyLoading,
    markAsDone,
    removeFromWaitlist,
    movePriority,
    getNextInQueue,
    addToWaitlist,
  } = useWaitlist(instanceId);

  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  const { isRegistrationOpen, toggleRegistration } = useEventSettings(instanceId);
  
  const [cantor, setCantor] = useState('');
  const [musica, setMusica] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastHighScore, setLastHighScore] = useState(0);
  const [currentWaitlistEntryId, setCurrentWaitlistEntryId] = useState<string | null>(null);
  const [showTVMode, setShowTVMode] = useState(false);
  const [isTogglingRegistration, setIsTogglingRegistration] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [insertFirst, setInsertFirst] = useState(true); // Toggle: first in queue or fair order
  const [showManualInput, setShowManualInput] = useState(false); // Show manual URL input when search fails

  // Check if user needs to change password
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [checkingPasswordStatus, setCheckingPasswordStatus] = useState(true);

  useEffect(() => {
    const checkPasswordStatusAndUpdateAccess = async () => {
      if (!user?.email) {
        setCheckingPasswordStatus(false);
        return;
      }

      try {
        // Update last_access_at timestamp
        await supabase
          .from('coordinator_requests')
          .update({ last_access_at: new Date().toISOString() })
          .eq('email', user.email)
          .eq('status', 'approved');

        const { data, error } = await supabase
          .from('coordinator_requests')
          .select('must_change_password')
          .eq('email', user.email)
          .eq('status', 'approved')
          .maybeSingle();

        if (!error && data?.must_change_password) {
          setMustChangePassword(true);
        }
      } catch (err) {
        console.error('Error checking password status:', err);
      } finally {
        setCheckingPasswordStatus(false);
      }
    };

    checkPasswordStatusAndUpdateAccess();
  }, [user?.email]);

  const highestScore = ranking.length > 0 ? Math.max(...ranking.map(p => Number(p.nota_media))) : 0;

  // Effect for confetti on high scores - MUST be before conditional returns
  useEffect(() => {
    if (performance && performance.status === 'ativa') {
      const currentScore = Number(performance.nota_media);
      if (currentScore > highestScore && currentScore > lastHighScore && performance.total_votos >= 3) {
        setShowConfetti(true);
        setLastHighScore(currentScore);
        setTimeout(() => setShowConfetti(false), 100);
      }
    }
  }, [performance?.nota_media, highestScore, lastHighScore]);

  // ============ CONDITIONAL RETURNS START HERE ============
  // All hooks MUST be declared above this line
  
  // Show loading while checking for instance or password status
  if (instanceLoading || checkingPasswordStatus) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }

  // Show password change modal if required
  if (mustChangePassword) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <Mic2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Bem-vindo!</h1>
          <p className="text-muted-foreground">Por favor, altere sua senha temporária para continuar.</p>
        </div>
        <ChangePasswordModal 
          open={true} 
          onPasswordChanged={() => {
            setMustChangePassword(false);
          }} 
        />
      </div>
    );
  }

  // If coordinator has no instance assigned, show message
  if (!instance) {
    return <NoInstanceAssigned onLogout={logout} userEmail={user?.email} />;
  }

  // If subscription expired, show renewal page
  if (isExpired) {
    return <SubscriptionExpired coordinatorName={user?.email?.split('@')[0]} />;
  }

  // ============ HANDLER FUNCTIONS (after conditional returns is OK) ============

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

  const handleLoadVideo = () => {
    setLoadedUrl(youtubeUrl);
  };

  const handleStartRound = async () => {
    if (!cantor.trim() || !musica.trim()) {
      toast({ title: t('host.requiredFields'), description: t('host.fillFields'), variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      // End any active performances for this instance
      if (instanceId) {
        await supabase.from('performances').update({ status: 'encerrada' }).eq('status', 'ativa').eq('karaoke_instance_id', instanceId);
      }
      const { data, error } = await supabase.from('performances').insert({ 
        cantor: cantor.trim(), 
        musica: musica.trim(), 
        youtube_url: loadedUrl, 
        status: 'ativa',
        karaoke_instance_id: instanceId,
      }).select().single();
      if (error) throw error;
      setPerformance(data as Performance);
      setLastHighScore(0);
      toast({ title: t('host.roundStarted'), description: t('host.votingOpen') });
    } catch (error) {
      console.error('Error starting round:', error);
      toast({ title: t('host.error'), description: t('host.cantStartRound'), variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndRound = async () => {
    if (!performance) return;
    try {
      const { error } = await supabase.from('performances').update({ status: 'encerrada' }).eq('id', performance.id);
      if (error) throw error;
      const finalScore = Number(performance.nota_media);
      if (finalScore >= 9.0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 100);
      }
      if (currentWaitlistEntryId && performance.cantor) {
        await markAsDone(currentWaitlistEntryId, performance.cantor);
        setCurrentWaitlistEntryId(null);
      }
      toast({ title: t('host.roundEndedMsg'), description: `${t('host.finalScore')}: ${finalScore.toFixed(1)}` });
      setPerformance({ ...performance, status: 'encerrada' });
      const nextInQueue = getNextInQueue();
      if (nextInQueue) {
        toast({ title: t('host.nextInQueue'), description: `${nextInQueue.singer_name} - ${nextInQueue.song_title}` });
      }
    } catch (error) {
      console.error('Error ending round:', error);
      toast({ title: t('host.error'), description: t('host.cantEndRound'), variant: 'destructive' });
    }
  };

  const handleNextRound = () => {
    setCantor('');
    setMusica('');
    setYoutubeUrl('');
    setLoadedUrl(null);
    setPerformance(null);
    setLastHighScore(0);
    setCurrentWaitlistEntryId(null);
  };

  const handleSelectFromWaitlist = (entry: { id: string; singer_name: string; youtube_url: string; song_title: string }) => {
    setCantor(entry.singer_name);
    setMusica(entry.song_title);
    setYoutubeUrl(entry.youtube_url);
    setLoadedUrl(entry.youtube_url);
    setCurrentWaitlistEntryId(entry.id);
    toast({ title: t('host.singerSelected'), description: `${entry.singer_name} - ${entry.song_title}` });
  };

  const handleVideoSelectedFromSearch = async (url: string, title?: string) => {
    const cleanTitle = title 
      ? title.replace(/\(.*?(karaoke|versão|version|lyrics|lyric|instrumental).*?\)/gi, '')
             .replace(/\[.*?(karaoke|versão|version|lyrics|lyric|instrumental).*?\]/gi, '')
             .replace(/karaoke|versão karaokê/gi, '')
             .trim()
             .substring(0, 50)
      : '';
    
    setYoutubeUrl(url);
    setLoadedUrl(url);
    if (cleanTitle && !musica) {
      setMusica(cleanTitle);
    }
    
    // If singer name is filled, add to waitlist based on toggle
    if (cantor.trim()) {
      const songTitle = cleanTitle || musica || title || 'Música';
      const success = await addToWaitlist(cantor.trim(), url, songTitle, undefined, insertFirst);
      if (success) {
        toast({ 
          title: insertFirst ? t('host.addedFirst') : t('waitlist.addedToQueue'), 
          description: `${cantor.trim()} - ${songTitle}` 
        });
        // Clear form for next entry
        setCantor('');
        setMusica('');
        setYoutubeUrl('');
        setLoadedUrl(null);
      }
    }
  };

  const handleSearchError = () => {
    setShowManualInput(true);
  };


  const handleResetEvent = async () => {
    if (!instanceId) {
      toast({ title: t('host.error'), description: 'No instance selected', variant: 'destructive' });
      setShowResetDialog(false);
      return;
    }
    
    try {
      // Delete only data for THIS specific instance
      await supabase.from('votes').delete().eq('karaoke_instance_id', instanceId);
      await supabase.from('performances').delete().eq('karaoke_instance_id', instanceId);
      await supabase.from('waitlist').delete().eq('karaoke_instance_id', instanceId);
      setPerformance(null);
      setCantor('');
      setMusica('');
      setYoutubeUrl('');
      setLoadedUrl(null);
      setLastHighScore(0);
      setCurrentWaitlistEntryId(null);
      toast({ title: t('host.eventReset'), description: t('host.allDataDeleted') });
    } catch (error) {
      console.error('Error resetting event:', error);
      toast({ title: t('host.error'), description: t('host.cantResetEvent'), variant: 'destructive' });
    }
    setShowResetDialog(false);
  };

  const isRoundActive = performance?.status === 'ativa';
  
  // Get the TRUE next in queue - skip current singer if one is loaded
  const getTrueNextInQueue = () => {
    const allWaiting = waitlistEntries.filter(e => e.status === 'waiting');
    if (currentWaitlistEntryId) {
      // Skip current entry being performed
      const filtered = allWaiting.filter(e => e.id !== currentWaitlistEntryId);
      return filtered[0] || null;
    }
    return allWaiting[0] || null;
  };
  
  const trueNextInQueue = getTrueNextInQueue();

  const handleEnterTVMode = async () => {
    // If there's a singer loaded but round not started, auto-start
    if (cantor.trim() && musica.trim() && !isRoundActive) {
      setIsCreating(true);
      try {
        if (instanceId) {
          await supabase.from('performances').update({ status: 'encerrada' }).eq('status', 'ativa').eq('karaoke_instance_id', instanceId);
        }
        const { data, error } = await supabase.from('performances').insert({ 
          cantor: cantor.trim(), 
          musica: musica.trim(), 
          youtube_url: loadedUrl, 
          status: 'ativa',
          karaoke_instance_id: instanceId,
        }).select().single();
        if (error) throw error;
        setPerformance(data as Performance);
        setLastHighScore(0);
        toast({ title: t('host.roundStarted'), description: t('host.votingOpen') });
      } catch (error) {
        console.error('Error starting round:', error);
        toast({ title: t('host.error'), description: t('host.cantStartRound'), variant: 'destructive' });
      } finally {
        setIsCreating(false);
      }
    }
    setShowTVMode(true);
  };

  const handleTVSelectNext = async () => {
    const next = getTrueNextInQueue();
    if (!next) return;
    
    // Capture current state before updating
    const previousEntryId = currentWaitlistEntryId;
    const previousPerformance = performance;
    const wasActive = isRoundActive;
    
    // Update UI state immediately (optimistic update for instant feedback)
    setCantor(next.singer_name);
    setMusica(next.song_title);
    setYoutubeUrl(next.youtube_url);
    setLoadedUrl(next.youtube_url);
    setCurrentWaitlistEntryId(next.id);
    setLastHighScore(0);
    
    // Run cleanup in background (non-blocking) - don't wait for these
    if (wasActive && previousPerformance) {
      (async () => {
        try {
          await supabase.from('performances').update({ status: 'encerrada' }).eq('id', previousPerformance.id);
          if (previousEntryId && previousPerformance.cantor) {
            await markAsDone(previousEntryId, previousPerformance.cantor);
          }
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      })();
    }
    
    // Start new performance immediately
    try {
      const { data, error } = await supabase.from('performances').insert({ 
        cantor: next.singer_name, 
        musica: next.song_title, 
        youtube_url: next.youtube_url, 
        status: 'ativa',
        karaoke_instance_id: instanceId,
      }).select().single();
      
      if (!error && data) {
        setPerformance(data as Performance);
        toast({ title: t('host.singerSelected'), description: `${next.singer_name} - ${next.song_title}` });
      }
    } catch (error) {
      console.error('Error starting next round:', error);
    }
  };

  const handleChangeVideo = async (newUrl: string, newSongTitle?: string) => {
    setYoutubeUrl(newUrl);
    setLoadedUrl(newUrl);
    
    // Update database if performance is active
    if (performance?.id) {
      try {
        // Build update object with video_changed_at timestamp to notify voters
        const updateData: { youtube_url: string; musica?: string; video_changed_at: string } = { 
          youtube_url: newUrl,
          video_changed_at: new Date().toISOString()
        };
        if (newSongTitle) {
          updateData.musica = newSongTitle;
          setMusica(newSongTitle);
        }
        
        // Delete all votes for this performance first (reset for new song)
        const { error: votesError } = await supabase
          .from('votes')
          .delete()
          .eq('performance_id', performance.id);
        
        if (votesError) {
          console.error('Error deleting votes:', votesError);
        }
        
        // Update performance with new URL, song title, reset stats, and video_changed_at
        const { error: perfError } = await supabase
          .from('performances')
          .update({ 
            ...updateData, 
            total_votos: 0, 
            nota_media: 0 
          })
          .eq('id', performance.id);
        
        if (perfError) throw perfError;
        
        // Also update waitlist entry if exists
        if (currentWaitlistEntryId) {
          const waitlistUpdate: { youtube_url: string; song_title?: string } = { youtube_url: newUrl };
          if (newSongTitle) {
            waitlistUpdate.song_title = newSongTitle;
          }
          await supabase
            .from('waitlist')
            .update(waitlistUpdate)
            .eq('id', currentWaitlistEntryId);
        }
        
        toast({ title: t('tv.videoUpdated'), description: newSongTitle ? `🎵 ${newSongTitle}` : undefined });
      } catch (error) {
        console.error('Error updating video:', error);
        toast({ title: t('host.error'), description: t('tv.cantUpdateVideo'), variant: 'destructive' });
      }
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4 lg:p-8">
      {/* TV Mode Overlay */}
      <AnimatePresence>
        {showTVMode && (
          <TVModeView
            performance={performance}
            nextInQueue={trueNextInQueue}
            youtubeUrl={loadedUrl}
            queueCount={waitlistEntries.filter(e => e.status === 'waiting').length}
            instanceId={instanceId}
            onExit={async () => {
              // End voting when exiting TV mode
              if (isRoundActive && performance) {
                await handleEndRound();
              }
              setShowTVMode(false);
            }}
            onSelectNext={handleTVSelectNext}
            onChangeVideo={handleChangeVideo}
          />
        )}
      </AnimatePresence>

      <ConfettiEffect trigger={showConfetti} />
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <header className="mb-6">
          {/* Top bar with actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            {/* License time remaining - visible on screen */}
            {instance?.expires_at && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card/50 border border-border/50">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Licença:</span>
                <span className="text-sm font-medium">
                  {(() => {
                    const now = new Date();
                    const expires = new Date(instance.expires_at);
                    const diff = expires.getTime() - now.getTime();
                    
                    if (diff <= 0) return <span className="text-destructive">Expirada</span>;
                    
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    
                    if (days > 0) {
                      return <span className={days <= 1 ? 'text-yellow-500' : 'text-green-500'}>{days}d {hours}h</span>;
                    } else if (hours > 0) {
                      return <span className={hours <= 3 ? 'text-yellow-500' : 'text-green-500'}>{hours}h {minutes}min</span>;
                    } else {
                      return <span className="text-destructive">{minutes}min</span>;
                    }
                  })()}
                </span>
              </div>
            )}
            
            {/* Right side actions */}
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <Button
                onClick={handleToggleRegistration}
                variant="outline"
                size="sm"
                disabled={isTogglingRegistration}
                className={isRegistrationOpen 
                  ? "text-destructive border-destructive/50 hover:bg-destructive/10" 
                  : "text-primary border-primary/50 hover:bg-primary/10"
                }
              >
                {isTogglingRegistration ? (
                  <div className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isRegistrationOpen ? (
                  <Lock className="mr-2 h-4 w-4" />
                ) : (
                  <Unlock className="mr-2 h-4 w-4" />
                )}
                {isRegistrationOpen ? t('registration.closeBtn') : t('registration.openBtn')}
              </Button>
              <Button
                onClick={handleEnterTVMode}
                variant="outline"
                size="sm"
                className="text-primary border-primary/50 hover:bg-primary/10"
              >
                <Monitor className="mr-2 h-4 w-4" />
                {t('tv.modeButton')}
              </Button>
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Menu className="mr-2 h-4 w-4" />{t('host.menu')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => navigate('/')}><Home className="mr-2 h-4 w-4" />{t('host.backToHome')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/ranking')}><Trophy className="mr-2 h-4 w-4" />{t('host.showRanking')}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowResetDialog(true)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />{t('host.resetEvent')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('host.logout')}
              </Button>
            </div>
          </div>
          {/* Title */}
          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-black font-display neon-text-pink flex items-center justify-center gap-3"><Mic2 className="w-8 h-8 lg:w-10 lg:h-10" />{instance?.name || t('host.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('host.subtitle')} • {instance?.instance_code}</p>
          </div>
        </header>

        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('host.resetEventTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('host.resetEventDesc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('host.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetEvent} className="bg-destructive hover:bg-destructive/90">{t('host.yesReset')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-4">
              <h2 className="text-lg font-bold font-display mb-3 flex items-center gap-2"><Video className="w-4 h-4 text-secondary" />{t('host.configureRound')}</h2>
              
              {/* Singer name and queue position toggle */}
              <div className="grid grid-cols-1 gap-3 mb-3">
                <div>
                  <Label htmlFor="cantor" className="text-xs">{t('host.singerName')}</Label>
                  <Input id="cantor" value={cantor} onChange={(e) => setCantor(e.target.value)} placeholder={t('host.singerPlaceholder')} disabled={isRoundActive} className="mt-1 h-8 text-sm" />
                </div>
                
                {/* Queue position selection - only show when singer name is filled */}
                {cantor.trim() && (
                  <div className="p-3 rounded-md bg-muted/50 border border-border">
                    <span className="text-xs font-medium mb-2 block">{t('host.queuePosition')}</span>
                    <RadioGroup
                      value={insertFirst ? 'first' : 'fair'}
                      onValueChange={(value) => setInsertFirst(value === 'first')}
                      disabled={isRoundActive}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="first" id="position-first" />
                        <Label htmlFor="position-first" className="text-sm font-normal cursor-pointer">
                          🎤 {t('host.insertFirst')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fair" id="position-fair" />
                        <Label htmlFor="position-fair" className="text-sm font-normal cursor-pointer">
                          ⚖️ {t('host.insertFair')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>
              
              {/* YouTube Search */}
              <div className="space-y-2">
                <Label className="text-xs">{t('host.searchYoutube')}</Label>
                <YouTubeSearch onSelectVideo={handleVideoSelectedFromSearch} disabled={isRoundActive} onSearchError={handleSearchError} />
              </div>
              
              {/* Manual input - hidden by default, shows on search error or toggle */}
              {showManualInput && (
                <div className="mt-3 p-3 rounded-md border border-amber-500/50 bg-amber-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-medium text-amber-500">{t('host.searchFailed')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="musica" className="text-xs">{t('host.song')}</Label>
                      <Input id="musica" value={musica} onChange={(e) => setMusica(e.target.value)} placeholder={t('host.songPlaceholder')} disabled={isRoundActive} className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label htmlFor="youtube" className="text-xs">{t('host.pasteUrl')}</Label>
                      <Input id="youtube" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-1 h-8 text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button onClick={() => setShowManualInput(false)} variant="ghost" size="sm" className="text-xs h-7">{t('host.hideManual')}</Button>
                    <Button onClick={handleLoadVideo} variant="secondary" size="sm" className="text-xs h-7">{t('host.load')}</Button>
                  </div>
                </div>
              )}
              
              {/* Show manual input toggle when search is working */}
              {!showManualInput && (
                <button
                  onClick={() => setShowManualInput(true)}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  disabled={isRoundActive}
                >
                  {t('host.showManualInput')}
                </button>
              )}
              
              {/* Video change button during active round */}
              {isRoundActive && loadedUrl && (
                <div className="mt-2 flex justify-end">
                  <Button 
                    onClick={() => {
                      const newUrl = prompt(t('tv.changeVideoDesc'));
                      if (newUrl) handleChangeVideo(newUrl);
                    }} 
                    variant="outline" 
                    size="sm"
                    title={t('tv.changeVideo')}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t('tv.changeVideo')}
                  </Button>
                </div>
              )}
            </motion.div>
            <div className="min-h-[300px]"><YouTubePlayer url={loadedUrl} /></div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleStartRound} disabled={isRoundActive || isCreating} size="sm" className="flex-1 bg-neon-green hover:bg-neon-green/90 text-background font-bold"><Play className="mr-1 h-4 w-4" />{t('host.startVoting')}</Button>
              <Button onClick={handleEndRound} disabled={!isRoundActive} size="sm" variant="destructive" className="flex-1 font-bold"><Square className="mr-1 h-4 w-4" />{t('host.endVoting')}</Button>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4">
            <ScoreDisplay score={performance ? Number(performance.nota_media) : 0} totalVotes={performance?.total_votos || 0} cantor={performance?.cantor || cantor} musica={performance?.musica || musica} />
            <HostWaitlistPanel
              entries={waitlistEntries}
              loading={waitlistLoading}
              historyEntries={historyEntries}
              historyLoading={historyLoading}
              onSelectEntry={handleSelectFromWaitlist}
              onRemoveEntry={removeFromWaitlist}
              onMovePriority={movePriority}
              currentSinger={isRoundActive ? performance?.cantor : null}
            />
            <QRCodeDisplay instanceCode={instance?.instance_code} />
            {!isRoundActive && (
              <div className="glass-card p-4 text-center">
                <p className="text-muted-foreground text-sm">{performance?.status === 'encerrada' ? t('host.roundEnded') : t('host.waitingStart')}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Host() {
  return <HostAuth><HostContent /></HostAuth>;
}
