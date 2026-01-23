import { motion, AnimatePresence } from 'framer-motion';
import { Users, Music, Star, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WaitlistEntry } from '@/hooks/useWaitlist';
import { UserProfile } from '@/hooks/useUserProfile';
import { useLanguage } from '@/i18n/LanguageContext';

interface ParticipantWaitlistProps {
  entries: WaitlistEntry[];
  loading: boolean;
  currentSingerName?: string | null;
  userProfile?: UserProfile | null;
  highlightName?: string; // Keep for backwards compatibility
}

export function ParticipantWaitlist({ entries, loading, currentSingerName, userProfile, highlightName }: ParticipantWaitlistProps) {
  const { t } = useLanguage();

  // Normalize user's name for comparison
  const normalizedUserName = userProfile?.name?.toLowerCase().trim();
  
  // Function to check if an entry belongs to the user (either as singer or registered by user)
  const isUserEntry = (entry: WaitlistEntry) => {
    const singerName = entry.singer_name.toLowerCase().trim();
    const registeredBy = entry.registered_by?.toLowerCase().trim();
    
    return singerName === normalizedUserName || registeredBy === normalizedUserName;
  };

  // Find if user is currently singing or next
  const isCurrentlySinging = currentSingerName?.toLowerCase().trim() === normalizedUserName;
  
  // Check if someone the user registered is currently singing
  const registeredPersonSinging = currentSingerName && entries.some(e => 
    e.singer_name.toLowerCase().trim() === currentSingerName.toLowerCase().trim() && 
    e.registered_by?.toLowerCase().trim() === normalizedUserName
  );

  // Find user's position in queue (either as singer or registered someone)
  const userEntryIndex = entries.findIndex(e => isUserEntry(e));
  const isNext = userEntryIndex === 0 && !currentSingerName;
  
  // Count how many people are ahead of the user's first entry
  const peopleAhead = userEntryIndex > 0 ? userEntryIndex : 0;

  // For backwards compatibility with highlightName prop
  const effectiveHighlightName = highlightName?.toLowerCase().trim();

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold">{t('waitlist.title')}</h3>
        <span className="ml-auto text-sm text-muted-foreground">{entries.length} {t('waitlist.inQueue')}</span>
      </div>

      {/* Notification if user is up next or currently singing */}
      <AnimatePresence>
        {(isCurrentlySinging || registeredPersonSinging) && (
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
        {isNext && !isCurrentlySinging && !registeredPersonSinging && (
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
        {userEntryIndex > 0 && normalizedUserName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center"
          >
            <p className="text-sm">
              <span className="font-bold text-primary">{peopleAhead}</span>
              {' '}{t('waitlist.peopleAhead')}
            </p>
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
              const isUserHighlighted = normalizedUserName && isUserEntry(entry);
              const isLegacyHighlighted = effectiveHighlightName && 
                entry.singer_name.toLowerCase().trim() === effectiveHighlightName;
              const isHighlighted = isUserHighlighted || isLegacyHighlighted;
              
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
                      {entry.registered_by && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({t('waitlist.registeredBy')} {entry.registered_by})
                        </span>
                      )}
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
