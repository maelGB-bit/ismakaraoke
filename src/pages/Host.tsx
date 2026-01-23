import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Square, SkipForward, Trophy, Video, Mic2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { ConfettiEffect } from '@/components/ConfettiEffect';
import { HostAuth, useHostAuth } from '@/components/HostAuth';
import { supabase } from '@/integrations/supabase/client';
import { useActivePerformance, useRanking } from '@/hooks/usePerformance';
import type { Performance } from '@/types/karaoke';
import { useToast } from '@/hooks/use-toast';

function HostContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useHostAuth();
  const { performance, setPerformance } = useActivePerformance();
  const { performances: ranking } = useRanking();

  const [cantor, setCantor] = useState('');
  const [musica, setMusica] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastHighScore, setLastHighScore] = useState(0);

  // Track highest score of the night
  const highestScore = ranking.length > 0 ? Math.max(...ranking.map(p => Number(p.nota_media))) : 0;

  // Check for confetti trigger
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
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome do cantor e da música',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Close any active performance first
      await supabase
        .from('performances')
        .update({ status: 'encerrada' })
        .eq('status', 'ativa');

      // Create new performance
      const { data, error } = await supabase
        .from('performances')
        .insert({
          cantor: cantor.trim(),
          musica: musica.trim(),
          youtube_url: loadedUrl,
          status: 'ativa',
        })
        .select()
        .single();

      if (error) throw error;

      setPerformance(data as Performance);
      setLastHighScore(0);
      toast({
        title: '🎤 Rodada iniciada!',
        description: 'A votação está aberta',
      });
    } catch (error) {
      console.error('Error starting round:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a rodada',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndRound = async () => {
    if (!performance) return;

    try {
      const { error } = await supabase
        .from('performances')
        .update({ status: 'encerrada' })
        .eq('id', performance.id);

      if (error) throw error;

      const finalScore = Number(performance.nota_media);
      if (finalScore >= 9.0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 100);
      }

      toast({
        title: '✅ Rodada encerrada!',
        description: `Nota final: ${finalScore.toFixed(1)}`,
      });

      setPerformance({ ...performance, status: 'encerrada' });
    } catch (error) {
      console.error('Error ending round:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível encerrar a rodada',
        variant: 'destructive',
      });
    }
  };

  const handleNextRound = () => {
    setCantor('');
    setMusica('');
    setYoutubeUrl('');
    setLoadedUrl(null);
    setPerformance(null);
    setLastHighScore(0);
  };

  const isRoundActive = performance?.status === 'ativa';

  return (
    <div className="min-h-screen gradient-bg p-4 lg:p-8">
      <ConfettiEffect trigger={showConfetti} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <header className="text-center mb-8 relative">
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
          <h1 className="text-4xl lg:text-5xl font-black font-display neon-text-pink flex items-center justify-center gap-3">
            <Mic2 className="w-10 h-10 lg:w-12 lg:h-12" />
            KARAOKÊ VOTING
          </h1>
          <p className="text-muted-foreground mt-2">Painel do Organizador</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configuration */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6"
            >
              <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-secondary" />
                Configurar Rodada
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="cantor">Nome do Cantor</Label>
                  <Input
                    id="cantor"
                    value={cantor}
                    onChange={(e) => setCantor(e.target.value)}
                    placeholder="Ex: João Silva"
                    disabled={isRoundActive}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="musica">Música</Label>
                  <Input
                    id="musica"
                    value={musica}
                    onChange={(e) => setMusica(e.target.value)}
                    placeholder="Ex: Evidências"
                    disabled={isRoundActive}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="youtube">URL do YouTube</Label>
                  <Input
                    id="youtube"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleLoadVideo}
                  variant="secondary"
                  className="mt-7"
                >
                  Carregar
                </Button>
              </div>
            </motion.div>

            {/* YouTube Player */}
            <YouTubePlayer url={loadedUrl} />

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleStartRound}
                disabled={isRoundActive || isCreating}
                size="lg"
                className="flex-1 bg-neon-green hover:bg-neon-green/90 text-background font-bold"
              >
                <Play className="mr-2 h-5 w-5" />
                Iniciar Rodada
              </Button>

              <Button
                onClick={handleEndRound}
                disabled={!isRoundActive}
                size="lg"
                variant="destructive"
                className="flex-1 font-bold"
              >
                <Square className="mr-2 h-5 w-5" />
                Encerrar Rodada
              </Button>

              <Button
                onClick={handleNextRound}
                disabled={isRoundActive}
                size="lg"
                variant="outline"
                className="flex-1 font-bold"
              >
                <SkipForward className="mr-2 h-5 w-5" />
                Próxima Rodada
              </Button>

              <Button
                onClick={() => navigate('/ranking')}
                size="lg"
                variant="outline"
                className="flex-1 font-bold border-accent text-accent hover:bg-accent hover:text-background"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Ver Ranking
              </Button>
            </div>
          </div>

          {/* Right Column - Score & QR Code */}
          <div className="space-y-6">
            <ScoreDisplay
              score={performance ? Number(performance.nota_media) : 0}
              totalVotes={performance?.total_votos || 0}
              cantor={performance?.cantor || cantor}
              musica={performance?.musica || musica}
            />

            {performance?.id && isRoundActive && (
              <QRCodeDisplay performanceId={performance.id} />
            )}

            {!isRoundActive && (
              <div className="glass-card p-6 text-center">
                <p className="text-muted-foreground">
                  {performance?.status === 'encerrada'
                    ? '✅ Rodada encerrada. Clique em "Próxima Rodada" para continuar.'
                    : '⏳ Configure e inicie uma rodada para liberar a votação'}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Host() {
  return (
    <HostAuth>
      <HostContent />
    </HostAuth>
  );
}
