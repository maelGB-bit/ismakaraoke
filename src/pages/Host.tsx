import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Square, SkipForward, Trophy, Video, Mic2, LogOut, Menu, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { YouTubeSearch } from '@/components/YouTubeSearch';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { ConfettiEffect } from '@/components/ConfettiEffect';
import { HostAuth, useHostAuth } from '@/components/HostAuth';
import { supabase } from '@/integrations/supabase/client';
import { useActivePerformance, useRanking } from '@/hooks/usePerformance';
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

  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleResetEvent = async () => {
    try {
      // Delete all votes first
      await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // Delete all performances
      await supabase.from('performances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      setPerformance(null);
      setCantor('');
      setMusica('');
      setYoutubeUrl('');
      setLoadedUrl(null);
      setLastHighScore(0);
      
      toast({
        title: '🗑️ Evento resetado!',
        description: 'Todos os dados foram apagados',
      });
    } catch (error) {
      console.error('Error resetting event:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível resetar o evento',
        variant: 'destructive',
      });
    }
    setShowResetDialog(false);
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
        <header className="text-center mb-6 relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
              >
                <Menu className="mr-2 h-4 w-4" />
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/ranking')}>
                <Trophy className="mr-2 h-4 w-4" />
                Ver Ranking
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowResetDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Resetar Evento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <h1 className="text-3xl lg:text-4xl font-black font-display neon-text-pink flex items-center justify-center gap-3">
            <Mic2 className="w-8 h-8 lg:w-10 lg:h-10" />
            KARAOKÊ VOTING
          </h1>
          <p className="text-muted-foreground text-sm">Painel do Organizador</p>
        </header>

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resetar Evento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja apagar TODOS os dados do evento? Esta ação não pode ser desfeita.
                Todas as performances e votos serão permanentemente deletados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetEvent} className="bg-destructive hover:bg-destructive/90">
                Sim, Resetar Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Main Content - Video with Side Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-140px)]">
          {/* Left Column - Config & Video */}
          <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
            {/* Configuration - Compact */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4"
            >
              <h2 className="text-lg font-bold font-display mb-3 flex items-center gap-2">
                <Video className="w-4 h-4 text-secondary" />
                Configurar Rodada
              </h2>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <Label htmlFor="cantor" className="text-xs">Nome do Cantor</Label>
                  <Input
                    id="cantor"
                    value={cantor}
                    onChange={(e) => setCantor(e.target.value)}
                    placeholder="Ex: João Silva"
                    disabled={isRoundActive}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="musica" className="text-xs">Música</Label>
                  <Input
                    id="musica"
                    value={musica}
                    onChange={(e) => setMusica(e.target.value)}
                    placeholder="Ex: Evidências"
                    disabled={isRoundActive}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>

              {/* YouTube Search */}
              <div className="space-y-2">
                <Label className="text-xs">Buscar Vídeo no YouTube</Label>
                <YouTubeSearch
                  onSelectVideo={(url, title) => {
                    setYoutubeUrl(url);
                    setLoadedUrl(url);
                    if (title && !musica) {
                      const cleanTitle = title
                        .replace(/\(.*?(karaoke|versão|version|lyrics|lyric|instrumental).*?\)/gi, '')
                        .replace(/\[.*?(karaoke|versão|version|lyrics|lyric|instrumental).*?\]/gi, '')
                        .replace(/karaoke|versão karaokê/gi, '')
                        .trim();
                      setMusica(cleanTitle.substring(0, 50));
                    }
                  }}
                  disabled={isRoundActive}
                />
              </div>

              {/* Manual URL input */}
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <Label htmlFor="youtube" className="text-xs">Ou cole a URL diretamente</Label>
                  <Input
                    id="youtube"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <Button
                  onClick={handleLoadVideo}
                  variant="secondary"
                  size="sm"
                  className="mt-5"
                >
                  Carregar
                </Button>
              </div>
            </motion.div>

            {/* YouTube Player - Flexible Height */}
            <div className="flex-1 min-h-0">
              <YouTubePlayer url={loadedUrl} />
            </div>

            {/* Control Buttons - Compact */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleStartRound}
                disabled={isRoundActive || isCreating}
                size="sm"
                className="flex-1 bg-neon-green hover:bg-neon-green/90 text-background font-bold"
              >
                <Play className="mr-1 h-4 w-4" />
                Iniciar
              </Button>

              <Button
                onClick={handleEndRound}
                disabled={!isRoundActive}
                size="sm"
                variant="destructive"
                className="flex-1 font-bold"
              >
                <Square className="mr-1 h-4 w-4" />
                Encerrar
              </Button>

              <Button
                onClick={handleNextRound}
                disabled={isRoundActive}
                size="sm"
                variant="outline"
                className="flex-1 font-bold"
              >
                <SkipForward className="mr-1 h-4 w-4" />
                Próxima
              </Button>
            </div>
          </div>

          {/* Right Column - Score & QR Code - Compact */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-auto">
            <ScoreDisplay
              score={performance ? Number(performance.nota_media) : 0}
              totalVotes={performance?.total_votos || 0}
              cantor={performance?.cantor || cantor}
              musica={performance?.musica || musica}
            />

            <QRCodeDisplay />

            {!isRoundActive && (
              <div className="glass-card p-4 text-center">
                <p className="text-muted-foreground text-sm">
                  {performance?.status === 'encerrada'
                    ? '✅ Rodada encerrada'
                    : '⏳ Inicie uma rodada para liberar a votação'}
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
