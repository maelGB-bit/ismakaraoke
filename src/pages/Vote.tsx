import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, CheckCircle, Trophy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoteSlider } from '@/components/VoteSlider';
import { usePerformanceById } from '@/hooks/usePerformance';
import { useDeviceId } from '@/hooks/useDeviceId';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Vote() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const rodadaId = searchParams.get('rodada');
  const { performance, loading } = usePerformanceById(rodadaId);
  const deviceId = useDeviceId();

  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingVote, setCheckingVote] = useState(true);

  // Check if user already voted
  useEffect(() => {
    if (!rodadaId || !deviceId) return;

    const checkExistingVote = async () => {
      const { data } = await supabase
        .from('votes')
        .select('id')
        .eq('performance_id', rodadaId)
        .eq('device_id', deviceId)
        .maybeSingle();

      if (data) {
        setHasVoted(true);
      }
      setCheckingVote(false);
    };

    checkExistingVote();
  }, [rodadaId, deviceId]);

  const handleSubmitVote = async (nota: number) => {
    if (!rodadaId || !deviceId || !performance) return;

    if (performance.status !== 'ativa') {
      toast({
        title: 'Votação encerrada',
        description: 'Esta rodada já foi encerrada',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('votes').insert({
        performance_id: rodadaId,
        nota,
        device_id: deviceId,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Voto duplicado',
            description: 'Você já votou nesta rodada',
            variant: 'destructive',
          });
          setHasVoted(true);
        } else {
          throw error;
        }
      } else {
        setHasVoted(true);
        toast({
          title: '🎉 Voto registrado!',
          description: `Você deu nota ${nota} para ${performance.cantor}`,
        });
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar seu voto',
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
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // No round ID provided
  if (!rodadaId) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold font-display mb-2">Link inválido</h1>
          <p className="text-muted-foreground mb-6">
            Escaneie o QR Code exibido no telão para votar.
          </p>
          <Button onClick={() => navigate('/ranking')} variant="outline">
            <Trophy className="mr-2 h-4 w-4" />
            Ver Ranking
          </Button>
        </div>
      </div>
    );
  }

  // Performance not found
  if (!performance) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold font-display mb-2">Rodada não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            Esta rodada pode ter sido removida ou o link está incorreto.
          </p>
          <Button onClick={() => navigate('/ranking')} variant="outline">
            <Trophy className="mr-2 h-4 w-4" />
            Ver Ranking
          </Button>
        </div>
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
          <h1 className="text-2xl font-bold font-display mb-2">Votação Encerrada</h1>
          <p className="text-muted-foreground mb-2">
            A votação para esta apresentação foi finalizada.
          </p>
          <p className="text-lg mb-6">
            <span className="font-bold">{performance.cantor}</span> - {performance.musica}
          </p>
          <div className="text-4xl font-black font-display neon-text-gold mb-6">
            Nota Final: {Number(performance.nota_media).toFixed(1)}
          </div>
          <Button onClick={() => navigate('/ranking')} className="w-full">
            <Trophy className="mr-2 h-4 w-4" />
            Ver Ranking da Noite
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
          VOTE AGORA
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
          Cantando agora
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
                Voto Computado!
              </h2>
              <p className="text-muted-foreground mb-6">
                Obrigado por participar 🎉
              </p>
              <Button
                onClick={() => navigate('/ranking')}
                variant="outline"
                className="w-full"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Ver Ranking da Noite
              </Button>
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
