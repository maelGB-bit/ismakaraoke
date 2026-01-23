import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Music, User, Star, X, Users, Play, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Performance } from '@/types/karaoke';
import type { WaitlistEntry } from '@/hooks/useWaitlist';

interface TVModeViewProps {
  performance: Performance | null;
  nextInQueue: WaitlistEntry | null;
  youtubeUrl: string | null;
  onExit: () => void;
  onSelectNext: () => void;
}

function extractVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

interface VoteEffect {
  id: number;
  isPositive: boolean;
}

export function TVModeView({ performance, nextInQueue, youtubeUrl, onExit, onSelectNext }: TVModeViewProps) {
  const { t } = useLanguage();
  const isActive = performance?.status === 'ativa';
  const score = performance ? Number(performance.nota_media) : 0;
  const totalVotes = performance?.total_votos || 0;
  const videoId = youtubeUrl ? extractVideoId(youtubeUrl) : null;
  
  // Track vote changes for effects
  const [voteEffects, setVoteEffects] = useState<VoteEffect[]>([]);
  const [prevVotes, setPrevVotes] = useState(0);
  const [prevScore, setPrevScore] = useState(0);
  const effectIdRef = useRef(0);

  useEffect(() => {
    // Detect new vote
    if (totalVotes > prevVotes && prevVotes > 0) {
      const isPositive = score >= prevScore;
      const newEffect: VoteEffect = {
        id: effectIdRef.current++,
        isPositive
      };
      setVoteEffects(prev => [...prev, newEffect]);
      
      // Remove effect after animation
      setTimeout(() => {
        setVoteEffects(prev => prev.filter(e => e.id !== newEffect.id));
      }, 1500);
    }
    
    setPrevVotes(totalVotes);
    setPrevScore(score);
  }, [totalVotes, score, prevVotes, prevScore]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
    >
      {/* Exit Button */}
      <Button
        onClick={onExit}
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground z-20"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Top Bar - Compact Info */}
      <div className="flex items-center gap-2 p-2 bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
        {/* Now Singing */}
        {isActive && performance && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 px-3 py-1 glass-card"
          >
            <Mic2 className="w-4 h-4 text-primary animate-pulse" />
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-primary" />
              <span className="text-sm font-bold font-display neon-text-cyan truncate max-w-[150px]">
                {performance.cantor}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">•</span>
            <div className="flex items-center gap-1">
              <Music className="w-3 h-3 text-secondary" />
              <span className="text-xs text-foreground/80 truncate max-w-[200px]">
                {performance.musica}
              </span>
            </div>
          </motion.div>
        )}

        {/* Score Panel - Compact */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 px-3 py-1 glass-card relative"
        >
          <Star className="w-4 h-4 text-accent fill-accent" />
          <span className={`text-xl font-black font-display ${
            score >= 9 ? 'neon-text-gold' : score >= 7 ? 'neon-text-cyan' : 'text-foreground'
          }`}>
            {score.toFixed(1)}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground border-l border-border/50 pl-2 ml-1">
            <Users className="w-3 h-3" />
            <span className="text-xs">{totalVotes}</span>
          </div>
          
          {/* Vote Effects */}
          <AnimatePresence>
            {voteEffects.map((effect) => (
              <motion.div
                key={effect.id}
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: -30 }}
                exit={{ opacity: 0, scale: 0.5, y: -50 }}
                transition={{ duration: 0.5 }}
                className={`absolute -top-1 right-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                  effect.isPositive 
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                    : 'bg-destructive/20 text-destructive border border-destructive/50'
                }`}
              >
                {effect.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                +1
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Next in Queue - Compact Button */}
        <motion.button
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={onSelectNext}
          disabled={!nextInQueue}
          className="flex items-center gap-2 px-3 py-1 glass-card hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {t('tv.nextUp')}:
          </span>
          {nextInQueue ? (
            <>
              <span className="text-sm font-bold font-display neon-text-gold truncate max-w-[120px]">
                {nextInQueue.singer_name}
              </span>
              <Play className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </motion.button>

        {/* QR Codes - Minimal */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="ml-auto"
        >
          <QRCodeDisplay compact />
        </motion.div>
      </div>

      {/* Video Area - Full Space */}
      <div className="flex-1 p-2">
        <div className="w-full h-full rounded-lg overflow-hidden neon-border-cyan border">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video player"
            />
          ) : (
            <div className="w-full h-full bg-muted/50 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Mic2 className="w-24 h-24 mx-auto mb-4 animate-pulse" />
                <p className="text-2xl">{t('tv.waitingPerformance')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-muted-foreground text-xs py-1"
      >
        {t('tv.exitHint')}
      </motion.p>
    </motion.div>
  );
}
