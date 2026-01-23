import { motion } from 'framer-motion';
import { Star, User, Music } from 'lucide-react';
import type { Performance } from '@/types/karaoke';
import { useLanguage } from '@/i18n/LanguageContext';

interface RankingCardProps {
  performance: Performance;
  position: number;
  isFirst?: boolean;
}

export function RankingCard({ performance, position, isFirst }: RankingCardProps) {
  const { t } = useLanguage();
  const score = Number(performance.nota_media);

  const getMedalColor = () => {
    switch (position) {
      case 1: return 'text-accent neon-text-gold';
      case 2: return 'text-gray-300';
      case 3: return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  const getMedalBg = () => {
    switch (position) {
      case 1: return 'bg-accent/20 border-accent/50';
      case 2: return 'bg-gray-400/20 border-gray-400/50';
      case 3: return 'bg-amber-600/20 border-amber-600/50';
      default: return 'bg-muted/50 border-muted';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: position * 0.1 }} className={`glass-card p-4 flex items-center gap-4 ${isFirst ? 'neon-border-pink' : ''}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black font-display border ${getMedalBg()} ${getMedalColor()}`}>
        {position}
      </div>
      <div className="flex-1 min-w-0">
        {isFirst && <p className="text-accent text-xs uppercase tracking-widest font-bold mb-1">{t('ranking.karaokeKing')}</p>}
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-primary" />
          <h3 className={`font-bold font-display truncate ${isFirst ? 'text-xl neon-text-gold' : 'text-lg'}`}>{performance.cantor}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Music className="w-3 h-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground truncate">{performance.musica}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 justify-end">
          <Star className="w-5 h-5 text-accent" fill="currentColor" />
          <span className={`text-2xl font-black font-display ${isFirst ? 'neon-text-gold' : ''}`}>{score.toFixed(1)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{performance.total_votos} {t('score.votes')}</p>
      </div>
    </motion.div>
  );
}
