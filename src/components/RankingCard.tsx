import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Music, User, ThumbsUp } from 'lucide-react';
import type { Performance } from '@/types/karaoke';

interface RankingCardProps {
  performance: Performance;
  position: number;
  isFirst?: boolean;
}

const positionEmojis = ['🥇', '🥈', '🥉'];

export function RankingCard({ performance, position, isFirst }: RankingCardProps) {
  const getPositionIcon = () => {
    if (position === 1) return <Trophy className="w-8 h-8 text-accent" />;
    if (position === 2) return <Medal className="w-7 h-7 text-secondary" />;
    if (position === 3) return <Award className="w-6 h-6 text-neon-pink" />;
    return null;
  };

  const getCardStyle = () => {
    if (position === 1) return 'neon-border-gold border-2';
    if (position === 2) return 'neon-border-cyan border';
    if (position === 3) return 'neon-border-pink border';
    return 'border border-border';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: position * 0.1 }}
      className={`glass-card p-6 ${getCardStyle()} ${isFirst ? 'scale-105' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-16 text-center">
          {position <= 3 ? (
            <div className="flex flex-col items-center">
              <span className="text-4xl">{positionEmojis[position - 1]}</span>
              {getPositionIcon()}
            </div>
          ) : (
            <span className="text-3xl font-bold font-display text-muted-foreground">
              {position}.
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {isFirst && (
            <p className="text-accent text-xs uppercase tracking-widest font-bold mb-1">
              👑 König/Königin des Karaoke
            </p>
          )}
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-primary" />
            <h3 className={`font-bold font-display truncate ${isFirst ? 'text-xl neon-text-gold' : 'text-lg'}`}>
              {performance.cantor}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Music className="w-4 h-4" />
            <p className="truncate">{performance.musica}</p>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className={`text-3xl font-black font-display ${isFirst ? 'neon-text-gold' : position === 2 ? 'neon-text-cyan' : position === 3 ? 'neon-text-pink' : 'text-foreground'}`}>
            {Number(performance.nota_media).toFixed(1)}
          </p>
          <div className="flex items-center justify-end gap-1 text-muted-foreground text-sm">
            <ThumbsUp className="w-3 h-3" />
            <span>{performance.total_votos} Stimmen</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
