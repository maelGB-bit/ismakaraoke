import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, CheckCircle, Trophy, AlertCircle, Clock, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoteSlider } from '@/components/VoteSlider';
import { ParticipantWaitlist } from '@/components/ParticipantWaitlist';
import { LeaveButton } from '@/components/LeaveButton';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { InstanceNotFound } from '@/components/InstanceNotFound';
import { useActivePerformance } from '@/hooks/usePerformance';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useWaitlist } from '@/hooks/useWaitlist';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useInstanceByCode } from '@/hooks/useInstanceByCode';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Vote() {
  const navigate = useNavigate();
  const { instanceCode } = useParams<{ instanceCode?: string }>();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // If instanceCode is provided, look up the instance
  const { instance, loading: instanceLoading, error: instanceError } = useInstanceByCode(instanceCode);
  const instanceId = instance?.id || null;
  
  const { performance, loading } = useActivePerformance(instanceId);
  const { entries: waitlistEntries, loading: waitlistLoading } = useWaitlist(instanceId);
  const { profile: userProfile } = useUserProfile();
  const deviceId = useDeviceId();

  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingVote, setCheckingVote] = useState(true);
  
  // Use ref to track video changes without causing stale closure issues
  const lastVideoChangedAtRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef(true);

  // Check if user already voted for current performance
  const checkExistingVote = async () => {
    if (!performance?.id || !deviceId) {
      setCheckingVote(false);
      return;
    }
    
    const { data } = await supabase
      .from('votes')
      .select('id')
      .eq('performance_id', performance.id)
      .eq('device_id', deviceId)
      .maybeSingle();

    setHasVoted(!!data);
    setCheckingVote(false);
  };

  useEffect(() => {
    if (!performance?.id || !deviceId) {
      setCheckingVote(false);
      return;
    }

    // Reset refs when performance changes (new singer)
    isFirstLoadRef.current = true;
    lastVideoChangedAtRef.current = null;
    
    setCheckingVote(true);
    checkExistingVote();
  }, [performance?.id, deviceId]);

  // Detect when host changes the video/song and reset voting (realtime)
  useEffect(() => {
    if (!performance) return;
    
    const videoChangedAt = performance.video_changed_at;
    
    // On first load for this performance, just record the initial value
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      lastVideoChangedAtRef.current = videoChangedAt || null;
      return;
    }
    
    // Check if video was changed by host (same performance, different video)
    if (videoChangedAt && videoChangedAt !== lastVideoChangedAtRef.current) {
      // Video was changed by host - re-check vote status (votes were deleted) and notify user
      console.log('Video changed detected:', lastVideoChangedAtRef.current, '->', videoChangedAt);
      lastVideoChangedAtRef.current = videoChangedAt;
      checkExistingVote();
      toast({
        title: t('vote.songChanged'),
        description: t('vote.songChangedDesc'),
      });
    }
  }, [performance?.video_changed_at, toast, t]);

  const handleSubmitVote = async (nota: number) => {
    if (!performance?.id || !deviceId) return;

    if (performance.status !== 'ativa') {
      toast({
        title: t('vote.votingEndedToast'),
        description: t('vote.roundAlreadyEnded'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('votes').insert({
        performance_id: performance.id,
        nota,
        device_id: deviceId,
        karaoke_instance_id: instanceId,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: t('vote.duplicateVote'),
            description: t('vote.alreadyVoted'),
            variant: 'destructive',
          });
          setHasVoted(true);
        } else {
          throw error;
        }
      } else {
        setHasVoted(true);
        toast({
          title: t('vote.voteRegistered'),
          description: `${t('vote.youGave')} ${nota} ${t('vote.for')} ${performance.cantor}`,
        });
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: t('host.error'),
        description: t('vote.cantRegisterVote'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instance not found (only when instanceCode was provided)
  if (instanceCode && instanceError) {
    return <InstanceNotFound instanceCode={instanceCode} error={instanceError} />;
  }

  // Loading state
  if (loading || checkingVote || instanceLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center">
          <div className="animate-pulse-slow">
            <Mic2 className="w-16 h-16 mx-auto text-primary mb-4" />
          </div>
          <p className="text-muted-foreground">{t('vote.loading')}</p>
        </div>
      </div>
    );
  }

  // No active performance
  if (!performance) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center max-w-md w-full"
        >
          <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold font-display mb-2">{t('vote.waiting')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('vote.noActiveVoting')}
          </p>
          <div className="flex flex-col gap-3 mb-6">
            <Button onClick={() => navigate(instanceCode ? `/inscricao/${instanceCode}` : '/inscricao')} className="w-full">
              <Music className="mr-2 h-4 w-4" />
              {t('vote.wantToSing')}
            </Button>
            <Button onClick={() => navigate(instanceCode ? `/ranking/${instanceCode}` : '/ranking')} variant="outline" className="w-full">
              <Trophy className="mr-2 h-4 w-4" />
              {t('vote.showRanking')}
            </Button>
            <LeaveButton />
          </div>
          
          {/* Waitlist when no active performance */}
          <ParticipantWaitlist 
            entries={waitlistEntries} 
            loading={waitlistLoading}
            currentSingerName={null}
            userProfile={userProfile}
          />
        </motion.div>
      </div>
    );
  }

  // Round is closed
  if (performance.status === 'encerrada') {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center max-w-md w-full"
        >
          <AlertCircle className="w-16 h-16 mx-auto text-accent mb-4" />
          <h1 className="text-2xl font-bold font-display mb-2">{t('vote.votingEnded')}</h1>
          <p className="text-muted-foreground mb-2">
            {t('vote.votingEndedDesc')}
          </p>
          <p className="text-lg mb-6">
            <span className="font-bold">{performance.cantor}</span> - {performance.musica}
          </p>
          <div className="text-4xl font-black font-display neon-text-gold mb-6">
            {t('vote.finalScore')}: {Number(performance.nota_media).toFixed(1)}
          </div>
          <Button onClick={() => navigate(instanceCode ? `/ranking/${instanceCode}` : '/ranking')} className="w-full mb-6">
            <Trophy className="mr-2 h-4 w-4" />
            {t('vote.showNightRanking')}
          </Button>
          
          {/* Waitlist when round closed */}
          <ParticipantWaitlist 
            entries={waitlistEntries} 
            loading={waitlistLoading}
            currentSingerName={null}
            userProfile={userProfile}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col p-4 relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <h1 className="text-3xl font-black font-display neon-text-pink flex items-center justify-center gap-2">
          <Mic2 className="w-8 h-8" />
          {t('vote.voteNow')}
        </h1>
      </motion.header>

      {/* Performance Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 mb-6 text-center"
      >
        <p className="text-muted-foreground text-sm uppercase tracking-widest mb-1">
          {t('vote.nowSinging')}
        </p>
        <h2 className="text-2xl font-bold font-display neon-text-cyan mb-1">
          {performance.cantor}
        </h2>
        <p className="text-lg text-foreground/80">{performance.musica}</p>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {hasVoted ? (
            <motion.div
              key="voted"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="glass-card p-8 text-center max-w-md w-full mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <CheckCircle className="w-20 h-20 mx-auto text-neon-green mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold font-display neon-text-gold mb-2">
                {t('vote.voteCounted')}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t('vote.thankYou')}
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate(instanceCode ? `/inscricao/${instanceCode}` : '/inscricao')}
                  className="w-full"
                >
                  <Music className="mr-2 h-4 w-4" />
                  {t('vote.wantToSing')}
                </Button>
                <Button
                  onClick={() => navigate(instanceCode ? `/ranking/${instanceCode}` : '/ranking')}
                  variant="outline"
                  className="w-full"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  {t('vote.showNightRanking')}
                </Button>
                <LeaveButton />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="voting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <VoteSlider onSubmit={handleSubmitVote} isSubmitting={isSubmitting} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waitlist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ParticipantWaitlist 
            entries={waitlistEntries} 
            loading={waitlistLoading}
            currentSingerName={performance?.cantor}
            userProfile={userProfile}
          />
        </motion.div>
      </div>
    </div>
  );
}
