import { motion, AnimatePresence } from 'framer-motion';
import { Users, Play, X, Music, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WaitlistEntry } from '@/hooks/useWaitlist';
import { useLanguage } from '@/i18n/LanguageContext';

interface HostWaitlistPanelProps {
  entries: WaitlistEntry[];
  loading: boolean;
  historyEntries?: WaitlistEntry[];
  historyLoading?: boolean;
  onSelectEntry: (entry: WaitlistEntry) => void;
  onRemoveEntry: (entryId: string) => void;
  onMovePriority: (entryId: string, direction: 'up' | 'down') => void;
  currentSinger?: string | null;
}

export function HostWaitlistPanel({ 
  entries, 
  loading, 
  historyEntries = [],
  historyLoading = false,
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
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelectEntry(nextInQueue)}
          className="w-full p-3 rounded-lg bg-primary/20 border border-primary/30 hover:bg-primary/30 transition-colors text-left group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-primary font-medium mb-1">{t('waitlist.next')}</p>
            <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="font-bold text-lg">{nextInQueue.singer_name}</p>
          <p className="text-sm text-muted-foreground truncate">{nextInQueue.song_title}</p>
        </motion.button>
      )}

      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="queue">{t('waitlist.queueTab')}</TabsTrigger>
          <TabsTrigger value="history">{t('waitlist.historyTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-3">
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
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0 max-w-[140px]">
                        <p className="font-medium text-sm truncate">
                          {entry.singer_name}
                          {entry.times_sung > 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">({entry.times_sung}x)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 break-words">{entry.song_title}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => onMovePriority(entry.id, 'up')}
                          disabled={index === 0}
                          title={t('waitlist.moveUp')}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => onMovePriority(entry.id, 'down')}
                          disabled={index === entries.length - 1}
                          title={t('waitlist.moveDown')}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-primary hover:text-primary"
                          onClick={() => onSelectEntry(entry)}
                          title={t('waitlist.select')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => onRemoveEntry(entry.id)}
                          title={t('waitlist.remove')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          {historyLoading ? (
            <div className="text-center py-4 text-muted-foreground">{t('waitlist.loading')}</div>
          ) : historyEntries.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t('waitlist.noHistory')}</p>
            </div>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="space-y-2 pr-2">
                {historyEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-background/40"
                  >
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{entry.singer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{entry.song_title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
