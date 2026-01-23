import { motion, AnimatePresence } from 'framer-motion';
import { Users, Music, Star, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WaitlistEntry } from '@/hooks/useWaitlist';
import { useLanguage } from '@/i18n/LanguageContext';

interface ParticipantWaitlistProps {
  entries: WaitlistEntry[];
  loading: boolean;
  currentSingerName?: string | null;
  highlightName?: string;
}

export function ParticipantWaitlist({ entries, loading, currentSingerName, highlightName }: ParticipantWaitlistProps) {
  const { t } = useLanguage();

  // Find if highlighted user is next or currently singing
  const normalizedHighlight = highlightName?.toLowerCase().trim();
  const isCurrentlySinging = currentSingerName?.toLowerCase().trim() === normalizedHighlight;
  const userPosition = entries.findIndex(e => e.singer_name.toLowerCase().trim() === normalizedHighlight);
  const isNext = userPosition === 0 && !currentSingerName;

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold">{t('waitlist.title')}</h3>
        <span className="ml-auto text-sm text-muted-foreground">{entries.length} {t('waitlist.inQueue')}</span>
      </div>

      {/* Notification if user is up next or currently singing */}
      <AnimatePresence>
        {isCurrentlySinging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-4 rounded-lg bg-neon-green/20 border-2 border-neon-green text-center"
          >
            <Star className="h-8 w-8 mx-auto text-neon-green mb-2 animate-pulse" />
            <p className="font-bold text-lg neon-text-gold">{t('waitlist.yourTurn')}</p>
            <p className="text-sm text-muted-foreground">{t('waitlist.goToStage')}</p>
          </motion.div>
        )}
        {isNext && !isCurrentlySinging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-4 rounded-lg bg-accent/20 border-2 border-accent text-center"
          >
            <Clock className="h-8 w-8 mx-auto text-accent mb-2" />
            <p className="font-bold text-lg neon-text-cyan">{t('waitlist.youAreNext')}</p>
            <p className="text-sm text-muted-foreground">{t('waitlist.prepareYourself')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-4 text-muted-foreground">{t('waitlist.loading')}</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>{t('waitlist.noSignups')}</p>
        </div>
      ) : (
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-2">
            {entries.map((entry, index) => {
              const isHighlighted = entry.singer_name.toLowerCase().trim() === normalizedHighlight;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    isHighlighted 
                      ? 'bg-primary/30 border border-primary' 
                      : 'bg-background/50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isHighlighted ? 'bg-primary text-primary-foreground' : 'bg-primary/20'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isHighlighted ? 'text-primary' : ''}`}>
                      {entry.singer_name}
                      {isHighlighted && <span className="ml-1">⭐</span>}
                      {entry.times_sung > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">({entry.times_sung}x)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{entry.song_title}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
