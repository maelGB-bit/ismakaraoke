import { motion } from 'framer-motion';

interface ScoreDisplayProps {
  score: number;
  totalVotes: number;
  cantor: string;
  musica: string;
}

export function ScoreDisplay({ score, totalVotes, cantor, musica }: ScoreDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-8 text-center"
    >
      <div className="mb-4">
        <p className="text-muted-foreground text-sm uppercase tracking-widest mb-1">Cantando agora</p>
        <h2 className="text-3xl font-bold font-display neon-text-cyan">{cantor || 'Aguardando...'}</h2>
        <p className="text-xl text-foreground/80 mt-1">{musica || 'Sem música'}</p>
      </div>

      <div className="my-8">
        <p className="text-muted-foreground text-sm uppercase tracking-widest mb-2">Nota Média</p>
        <motion.div
          key={score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="score-display"
        >
          {score.toFixed(1)}
        </motion.div>
      </div>

      <div className="flex justify-center gap-8">
        <div className="text-center">
          <p className="text-4xl font-bold font-display neon-text-gold">{totalVotes}</p>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">Votos</p>
        </div>
      </div>
    </motion.div>
  );
}
