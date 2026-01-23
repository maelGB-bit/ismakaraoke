import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, CheckCircle, Trophy, AlertCircle, Clock, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoteSlider } from '@/components/VoteSlider';
import { useActivePerformance } from '@/hooks/usePerformance';
import { useDeviceId } from '@/hooks/useDeviceId';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Vote() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { performance, loading } = useActivePerformance();
  const deviceId = useDeviceId();

  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingVote, setCheckingVote] = useState(true);

  // Check if user already voted for current performance
  useEffect(() => {
    if (!performance?.id || !deviceId) {
      setCheckingVote(false);
      return;
    }

    const checkExistingVote = async () => {
      const { data } = await supabase
        .from('votes')
        .select('id')
        .eq('performance_id', performance.id)
        .eq('device_id', deviceId)
        .maybeSingle();

      setHasVoted(!!data);
      setCheckingVote(false);
    };

    setCheckingVote(true);
    checkExistingVote();
  }, [performance?.id, deviceId]);

  const handleSubmitVote = async (nota: number) => {
    if (!performance?.id || !deviceId) return;

    if (performance.status !== 'ativa') {
      toast({
        title: 'Abstimmung beendet',
        description: 'Diese Runde wurde bereits beendet',
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
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Doppelte Stimme',
            description: 'Du hast in dieser Runde bereits abgestimmt',
            variant: 'destructive',
          });
          setHasVoted(true);
        } else {
          throw error;
        }
      } else {
        setHasVoted(true);
        toast({
          title: '🎉 Stimme registriert!',
          description: `Du hast ${nota} für ${performance.cantor} gegeben`,
        });
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: 'Fehler',
        description: 'Stimme konnte nicht registriert werden',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading || checkingVote) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center">
          <div className="animate-pulse-slow">
            <Mic2 className="w-16 h-16 mx-auto text-primary mb-4" />
          </div>
          <p className="text-muted-foreground">Laden...</p>
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
          className="glass-card p-8 text-center max-w-md"
        >
          <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold font-display mb-2">Warten...</h1>
          <p className="text-muted-foreground mb-6">
            Keine aktive Abstimmung im Moment. Warte, bis der Organisator eine Runde startet.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/inscricao')} className="w-full">
              <Music className="mr-2 h-4 w-4" />
              Ich will singen
            </Button>
            <Button onClick={() => navigate('/ranking')} variant="outline" className="w-full">
              <Trophy className="mr-2 h-4 w-4" />
              Rangliste anzeigen
            </Button>
          </div>
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
          className="glass-card p-8 text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 mx-auto text-accent mb-4" />
          <h1 className="text-2xl font-bold font-display mb-2">Abstimmung beendet</h1>
          <p className="text-muted-foreground mb-2">
            Die Abstimmung für diesen Auftritt wurde beendet.
          </p>
          <p className="text-lg mb-6">
            <span className="font-bold">{performance.cantor}</span> - {performance.musica}
          </p>
          <div className="text-4xl font-black font-display neon-text-gold mb-6">
            Endnote: {Number(performance.nota_media).toFixed(1)}
          </div>
          <Button onClick={() => navigate('/ranking')} className="w-full">
            <Trophy className="mr-2 h-4 w-4" />
            Rangliste des Abends anzeigen
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col p-4">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <h1 className="text-3xl font-black font-display neon-text-pink flex items-center justify-center gap-2">
          <Mic2 className="w-8 h-8" />
          JETZT ABSTIMMEN
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
          Singt gerade
        </p>
        <h2 className="text-2xl font-bold font-display neon-text-cyan mb-1">
          {performance.cantor}
        </h2>
        <p className="text-lg text-foreground/80">{performance.musica}</p>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {hasVoted ? (
            <motion.div
              key="voted"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="glass-card p-8 text-center max-w-md w-full"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <CheckCircle className="w-20 h-20 mx-auto text-neon-green mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold font-display neon-text-gold mb-2">
                Stimme gezählt!
              </h2>
              <p className="text-muted-foreground mb-6">
                Danke fürs Mitmachen 🎉
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate('/inscricao')}
                  className="w-full"
                >
                  <Music className="mr-2 h-4 w-4" />
                  Ich will singen
                </Button>
                <Button
                  onClick={() => navigate('/ranking')}
                  variant="outline"
                  className="w-full"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Rangliste des Abends anzeigen
                </Button>
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
      </div>
    </div>
  );
}
