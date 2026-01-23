import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic2, Music, User, Star, X, Users, Play } from 'lucide-react';
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

export function TVModeView({ performance, nextInQueue, youtubeUrl, onExit, onSelectNext }: TVModeViewProps) {
  const { t } = useLanguage();
  const isActive = performance?.status === 'ativa';
  const score = performance ? Number(performance.nota_media) : 0;
  const totalVotes = performance?.total_votos || 0;
  const videoId = youtubeUrl ? extractVideoId(youtubeUrl) : null;

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
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Main Content - Video Focus Layout */}
      <div className="flex-1 flex p-4 gap-4">
        {/* Video Area - Main Focus */}
        <div className="flex-1 flex flex-col">
          {/* Now Singing Header */}
          {isActive && performance && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-3 flex items-center justify-center gap-4"
            >
              <Mic2 className="w-6 h-6 text-primary" />
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold font-display neon-text-cyan">
                  {performance.cantor}
                </span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-secondary" />
                <span className="text-xl text-foreground/80">
                  {performance.musica}
                </span>
              </div>
            </motion.div>
          )}

          {/* YouTube Video - Dominant */}
          <div className="flex-1 rounded-xl overflow-hidden neon-border-cyan border-2">
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

        {/* Right Sidebar - Score, Next, QR */}
        <div className="w-72 flex flex-col gap-3">
          {/* Score Panel */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 text-center"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {t('score.title')}
            </p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="w-8 h-8 text-accent fill-accent" />
              <span className={`text-5xl font-black font-display ${
                score >= 9 ? 'neon-text-gold' : score >= 7 ? 'neon-text-cyan' : 'text-foreground'
              }`}>
                {score.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">{totalVotes} {t('score.votes')}</span>
            </div>
          </motion.div>

          {/* Next in Queue - Clickable Button */}
          <motion.button
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={onSelectNext}
            disabled={!nextInQueue}
            className="glass-card p-4 text-left hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
                {t('tv.nextUp')}
              </h3>
              {nextInQueue && (
                <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            {nextInQueue ? (
              <div>
                <p className="text-lg font-bold font-display neon-text-gold mb-1 truncate">
                  {nextInQueue.singer_name}
                </p>
                <p className="text-sm text-foreground/70 line-clamp-2">
                  {nextInQueue.song_title}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('tv.noOneWaiting')}
              </p>
            )}
          </motion.button>

          {/* QR Codes */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-1"
          >
            <QRCodeDisplay />
          </motion.div>
        </div>
      </div>

      {/* Footer hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-muted-foreground text-xs py-2"
      >
        {t('tv.exitHint')}
      </motion.p>
    </motion.div>
  );
}
