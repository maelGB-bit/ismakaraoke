import { motion } from 'framer-motion';
import { Mic2, Music, User, Star, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Performance } from '@/types/karaoke';
import type { WaitlistEntry } from '@/hooks/useWaitlist';

interface TVModeViewProps {
  performance: Performance | null;
  nextInQueue: WaitlistEntry | null;
  onExit: () => void;
}

export function TVModeView({ performance, nextInQueue, onExit }: TVModeViewProps) {
  const { t } = useLanguage();
  const isActive = performance?.status === 'ativa';
  const score = performance ? Number(performance.nota_media) : 0;
  const totalVotes = performance?.total_votos || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 gradient-bg flex flex-col p-8 overflow-hidden"
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

      {/* Header */}
      <motion.header
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl lg:text-6xl font-black font-display neon-text-pink flex items-center justify-center gap-4">
          <Mic2 className="w-12 h-12 lg:w-16 lg:h-16" />
          {t('host.title')}
        </h1>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Now Singing - Center/Main */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass-card p-8 flex flex-col items-center justify-center"
        >
          <p className="text-xl text-muted-foreground uppercase tracking-widest mb-4">
            {isActive ? t('tv.nowSinging') : t('tv.waiting')}
          </p>
          
          {isActive && performance ? (
            <>
              <motion.div
                key={performance.cantor}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <User className="w-10 h-10 text-primary" />
                  <h2 className="text-5xl lg:text-7xl font-black font-display neon-text-cyan">
                    {performance.cantor}
                  </h2>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Music className="w-8 h-8 text-secondary" />
                  <p className="text-2xl lg:text-3xl text-foreground/80">
                    {performance.musica}
                  </p>
                </div>
              </motion.div>

              {/* Score */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-10 text-center"
              >
                <div className="flex items-center justify-center gap-4 mb-2">
                  <Star className="w-12 h-12 text-accent fill-accent" />
                  <span className={`text-8xl lg:text-9xl font-black font-display ${
                    score >= 9 ? 'neon-text-gold' : score >= 7 ? 'neon-text-cyan' : 'text-foreground'
                  }`}>
                    {score.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Users className="w-5 h-5" />
                  <span className="text-xl">{totalVotes} {t('score.votes')}</span>
                </div>
              </motion.div>
            </>
          ) : (
            <div className="text-center">
              <Mic2 className="w-24 h-24 mx-auto text-muted-foreground/30 mb-4 animate-pulse" />
              <p className="text-2xl text-muted-foreground">
                {t('tv.waitingPerformance')}
              </p>
            </div>
          )}
        </motion.div>

        {/* Right Panel: Next + QR */}
        <div className="flex flex-col gap-6">
          {/* Next in Queue */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 flex-1"
          >
            <h3 className="text-lg uppercase tracking-widest text-muted-foreground mb-4 text-center">
              {t('tv.nextUp')}
            </h3>
            {nextInQueue ? (
              <div className="text-center">
                <p className="text-3xl lg:text-4xl font-bold font-display neon-text-gold mb-2">
                  {nextInQueue.singer_name}
                </p>
                <p className="text-lg text-foreground/70 line-clamp-2">
                  {nextInQueue.song_title}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xl text-muted-foreground">
                  {t('tv.noOneWaiting')}
                </p>
              </div>
            )}
          </motion.div>

          {/* QR Codes */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
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
        className="text-center text-muted-foreground text-sm mt-6"
      >
        {t('tv.exitHint')}
      </motion.p>
    </motion.div>
  );
}
