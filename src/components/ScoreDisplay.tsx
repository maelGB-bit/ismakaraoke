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
      className="glass-card p-4 text-center"
    >
      <div className="mb-2">
        <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Singt gerade</p>
        <h2 className="text-xl font-bold font-display neon-text-cyan truncate">{cantor || 'Warten...'}</h2>
        <p className="text-sm text-foreground/80 truncate">{musica || 'Kein Lied'}</p>
      </div>

      <div className="my-4">
        <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Durchschnittsnote</p>
        <motion.div
          key={score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="text-5xl font-black font-display neon-text-pink"
        >
          {score.toFixed(1)}
        </motion.div>
      </div>

      <div className="flex justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold font-display neon-text-gold">{totalVotes}</p>
          <p className="text-muted-foreground text-xs uppercase tracking-widest">Stimmen</p>
        </div>
      </div>
    </motion.div>
  );
}
