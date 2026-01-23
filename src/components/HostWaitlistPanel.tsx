import { motion, AnimatePresence } from 'framer-motion';
import { Users, Play, X, Music, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WaitlistEntry } from '@/hooks/useWaitlist';
import { useLanguage } from '@/i18n/LanguageContext';

interface HostWaitlistPanelProps {
  entries: WaitlistEntry[];
  loading: boolean;
  onSelectEntry: (entry: WaitlistEntry) => void;
  onRemoveEntry: (entryId: string) => void;
  onMovePriority: (entryId: string, direction: 'up' | 'down') => void;
  currentSinger?: string | null;
}

export function HostWaitlistPanel({ 
  entries, 
  loading, 
  onSelectEntry, 
  onRemoveEntry,
  onMovePriority,
  currentSinger 
}: HostWaitlistPanelProps) {
  const { t } = useLanguage();
  const nextInQueue = entries.length > 0 ? entries[0] : null;

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold">{t('waitlist.title')}</h3>
        <span className="ml-auto text-sm text-muted-foreground">{entries.length} {t('waitlist.inQueue')}</span>
      </div>

      {nextInQueue && !currentSinger && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-primary/20 border border-primary/30"
        >
          <p className="text-xs text-primary font-medium mb-1">{t('waitlist.next')}</p>
          <p className="font-bold text-lg">{nextInQueue.singer_name}</p>
          <p className="text-sm text-muted-foreground truncate">{nextInQueue.song_title}</p>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-4 text-muted-foreground">{t('waitlist.loading')}</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>{t('waitlist.noSignups')}</p>
        </div>
      ) : (
        <ScrollArea className="h-[250px]">
          <div className="space-y-2 pr-2">
            <AnimatePresence>
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors group"
                >
                  {/* Drag handle indicator */}
                  <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                  
                  {/* Position number */}
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>

                  {/* Singer info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {entry.singer_name}
                      {entry.times_sung > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">({entry.times_sung}x)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{entry.song_title}</p>
                  </div>

                  {/* Priority controls */}
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={() => onMovePriority(entry.id, 'up')}
                      disabled={index === 0}
                      title={t('waitlist.moveUp')}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={() => onMovePriority(entry.id, 'down')}
                      disabled={index === entries.length - 1}
                      title={t('waitlist.moveDown')}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => onSelectEntry(entry)}
                      title={t('waitlist.select')}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onRemoveEntry(entry.id)}
                      title={t('waitlist.remove')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
