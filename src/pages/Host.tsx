import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Trophy, Video, Mic2, LogOut, Menu, Trash2, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { YouTubeSearch } from '@/components/YouTubeSearch';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { ConfettiEffect } from '@/components/ConfettiEffect';
import { HostWaitlistPanel } from '@/components/HostWaitlistPanel';
import { HostAuth, useHostAuth } from '@/components/HostAuth';
import { TVModeView } from '@/components/TVModeView';
import { supabase } from '@/integrations/supabase/client';
import { useActivePerformance, useRanking } from '@/hooks/usePerformance';
import { useWaitlist } from '@/hooks/useWaitlist';
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
  const { toast } = useToast();
  const { t } = useLanguage();
  const { logout } = useHostAuth();
  const { performance, setPerformance } = useActivePerformance();
  const { performances: ranking } = useRanking();
  const {
    entries: waitlistEntries,
    historyEntries,
    loading: waitlistLoading,
    historyLoading,
    markAsDone,
    removeFromWaitlist,
    movePriority,
    getNextInQueue,
  } = useWaitlist();

  const [cantor, setCantor] = useState('');
  const [musica, setMusica] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastHighScore, setLastHighScore] = useState(0);
  const [currentWaitlistEntryId, setCurrentWaitlistEntryId] = useState<string | null>(null);
  const [showTVMode, setShowTVMode] = useState(false);
  const highestScore = ranking.length > 0 ? Math.max(...ranking.map(p => Number(p.nota_media))) : 0;

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
      await supabase.from('performances').update({ status: 'encerrada' }).eq('status', 'ativa');
      const { data, error } = await supabase.from('performances').insert({ cantor: cantor.trim(), musica: musica.trim(), youtube_url: loadedUrl, status: 'ativa' }).select().single();
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

  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleResetEvent = async () => {
    try {
      await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('performances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('waitlist').delete().neq('id', '00000000-0000-0000-0000-000000000000');
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
        await supabase.from('performances').update({ status: 'encerrada' }).eq('status', 'ativa');
        const { data, error } = await supabase.from('performances').insert({ 
          cantor: cantor.trim(), 
          musica: musica.trim(), 
          youtube_url: loadedUrl, 
          status: 'ativa' 
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
    
    // End current round if active
    if (isRoundActive && performance) {
      try {
        await supabase.from('performances').update({ status: 'encerrada' }).eq('id', performance.id);
        if (currentWaitlistEntryId && performance.cantor) {
          await markAsDone(currentWaitlistEntryId, performance.cantor);
        }
      } catch (error) {
        console.error('Error ending round:', error);
      }
    }
    
    // Load and start next singer
    setCantor(next.singer_name);
    setMusica(next.song_title);
    setYoutubeUrl(next.youtube_url);
    setLoadedUrl(next.youtube_url);
    setCurrentWaitlistEntryId(next.id);
    
    try {
      const { data, error } = await supabase.from('performances').insert({ 
        cantor: next.singer_name, 
        musica: next.song_title, 
        youtube_url: next.youtube_url, 
        status: 'ativa' 
      }).select().single();
      if (error) throw error;
      setPerformance(data as Performance);
      setLastHighScore(0);
      toast({ title: t('host.singerSelected'), description: `${next.singer_name} - ${next.song_title}` });
    } catch (error) {
      console.error('Error starting next round:', error);
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
            onExit={async () => {
              // End voting when exiting TV mode
              if (isRoundActive && performance) {
                await handleEndRound();
              }
              setShowTVMode(false);
            }}
            onSelectNext={handleTVSelectNext}
          />
        )}
      </AnimatePresence>

      <ConfettiEffect trigger={showConfetti} />
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <header className="text-center mb-6 relative">
          <div className="absolute right-0 top-0 flex gap-2">
            <Button
              onClick={handleEnterTVMode}
              variant="outline"
              size="sm"
              className="text-primary border-primary/50 hover:bg-primary/10"
            >
              <Monitor className="mr-2 h-4 w-4" />
              {t('tv.modeButton')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Menu className="mr-2 h-4 w-4" />{t('host.menu')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/ranking')}><Trophy className="mr-2 h-4 w-4" />{t('host.showRanking')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowResetDialog(true)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />{t('host.resetEvent')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}><LogOut className="mr-2 h-4 w-4" />{t('host.logout')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black font-display neon-text-pink flex items-center justify-center gap-3"><Mic2 className="w-8 h-8 lg:w-10 lg:h-10" />{t('host.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('host.subtitle')}</p>
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
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <Label htmlFor="cantor" className="text-xs">{t('host.singerName')}</Label>
                  <Input id="cantor" value={cantor} onChange={(e) => setCantor(e.target.value)} placeholder={t('host.singerPlaceholder')} disabled={isRoundActive} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label htmlFor="musica" className="text-xs">{t('host.song')}</Label>
                  <Input id="musica" value={musica} onChange={(e) => setMusica(e.target.value)} placeholder={t('host.songPlaceholder')} disabled={isRoundActive} className="mt-1 h-8 text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t('host.searchYoutube')}</Label>
                <YouTubeSearch onSelectVideo={(url, title) => { setYoutubeUrl(url); setLoadedUrl(url); if (title && !musica) { const cleanTitle = title.replace(/\(.*?(karaoke|versão|version|lyrics|lyric|instrumental).*?\)/gi, '').replace(/\[.*?(karaoke|versão|version|lyrics|lyric|instrumental).*?\]/gi, '').replace(/karaoke|versão karaokê/gi, '').trim(); setMusica(cleanTitle.substring(0, 50)); } }} disabled={isRoundActive} />
              </div>
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <Label htmlFor="youtube" className="text-xs">{t('host.pasteUrl')}</Label>
                  <Input id="youtube" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-1 h-8 text-sm" />
                </div>
                <Button onClick={handleLoadVideo} variant="secondary" size="sm" className="mt-5">{t('host.load')}</Button>
              </div>
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
            <QRCodeDisplay />
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
