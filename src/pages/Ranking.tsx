import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RankingCard } from '@/components/RankingCard';
import { useRanking } from '@/hooks/usePerformance';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Ranking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { performances, loading } = useRanking();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      // Delete all votes first (due to FK constraint)
      await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Delete all performances
      await supabase.from('performances').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast({
        title: '🆕 Novo evento iniciado!',
        description: 'Todos os dados foram limpos',
      });

      navigate('/host');
    } catch (error) {
      console.error('Error resetting:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível resetar os dados',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <header className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <Trophy className="w-16 h-16 mx-auto text-accent mb-4" />
          </motion.div>
          <h1 className="text-4xl lg:text-5xl font-black font-display neon-text-gold">
            RANKING DA NOITE
          </h1>
          <p className="text-muted-foreground mt-2">
            As melhores performances do karaokê
          </p>
        </header>

        {/* Ranking List */}
        <div className="space-y-4 mb-8">
          {loading ? (
            <div className="glass-card p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Carregando ranking...</p>
            </div>
          ) : performances.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-8 text-center"
            >
              <p className="text-muted-foreground text-lg">
                Nenhuma apresentação encerrada ainda.
              </p>
              <p className="text-muted-foreground mt-2">
                As apresentações aparecerão aqui quando as rodadas forem finalizadas.
              </p>
            </motion.div>
          ) : (
            performances.map((perf, index) => (
              <RankingCard
                key={perf.id}
                performance={perf}
                position={index + 1}
                isFirst={index === 0}
              />
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => navigate('/host')}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Voltar ao Host
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="lg"
                className="flex-1"
                disabled={isResetting || performances.length === 0}
              >
                {isResetting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-5 w-5" />
                )}
                Novo Evento / Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card border-destructive">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">
                  Iniciar Novo Evento?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá apagar todas as apresentações e votos da noite.
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Sim, resetar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    </div>
  );
}
