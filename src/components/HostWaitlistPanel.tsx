import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Play, X, Music, ChevronUp, ChevronDown, VolumeX, Pencil, Check, SkipForward, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WaitlistEntry, QueueDisplayInfo } from '@/hooks/useWaitlist';
import { QueueEntryIndicators } from '@/components/QueueEntryIndicators';
import { useLanguage } from '@/i18n/LanguageContext';

interface HostWaitlistPanelProps {
  entries: WaitlistEntry[];
  loading: boolean;
  historyEntries?: WaitlistEntry[];
  historyLoading?: boolean;
  onSelectEntry: (entry: WaitlistEntry) => void;
  onRemoveEntry: (entryId: string) => void;
  onMovePriority: (entryId: string, direction: 'up' | 'down') => void;
  onUpdateSingerName?: (entryId: string, newName: string) => Promise<boolean>;
  onRecoverFromHistory?: (entry: WaitlistEntry, action: 'now_end' | 'now_return' | 'next') => Promise<void>;
  currentSinger?: string | null;
  getDisplayInfo?: (entry: WaitlistEntry) => QueueDisplayInfo;
}

export function HostWaitlistPanel({ 
  entries, 
  loading, 
  historyEntries = [],
  historyLoading = false,
  onSelectEntry, 
  onRemoveEntry,
  onMovePriority,
  onUpdateSingerName,
  onRecoverFromHistory,
  currentSinger,
  getDisplayInfo,
}: HostWaitlistPanelProps) {
  const { t } = useLanguage();
  const nextInQueue = entries.length > 0 ? entries[0] : null;
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // Recovery dialog state
  const [recoverDialogOpen, setRecoverDialogOpen] = useState(false);
  const [selectedRecoverEntry, setSelectedRecoverEntry] = useState<WaitlistEntry | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const handleStartEdit = (entry: WaitlistEntry) => {
    setEditingId(entry.id);
    setEditingName(entry.singer_name);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim() || !onUpdateSingerName) return;
    const success = await onUpdateSingerName(editingId, editingName);
    if (success) {
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    else if (e.key === 'Escape') handleCancelEdit();
  };

  const handleHistoryClick = (entry: WaitlistEntry) => {
    if (!onRecoverFromHistory) return;
    setSelectedRecoverEntry(entry);
    setRecoverDialogOpen(true);
  };

  const handleRecoverConfirm = async (action: 'now_end' | 'now_return' | 'next') => {
    if (!selectedRecoverEntry || !onRecoverFromHistory) return;
    setIsRecovering(true);
    try {
      await onRecoverFromHistory(selectedRecoverEntry, action);
      setRecoverDialogOpen(false);
      setSelectedRecoverEntry(null);
    } finally {
      setIsRecovering(false);
    }
  };

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
          {getDisplayInfo && (
            <div className="mt-1">
              <QueueEntryIndicators info={getDisplayInfo(nextInQueue)} />
            </div>
          )}
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
                  {entries.map((entry, index) => {
                    const info = getDisplayInfo?.(entry);
                    return (
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
                          {editingId === entry.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="h-6 text-sm py-0 px-1"
                                autoFocus
                              />
                              <Button size="icon" variant="ghost" className="h-5 w-5 text-green-500 hover:text-green-600" onClick={handleSaveEdit}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground" onClick={handleCancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="font-medium text-sm truncate flex items-center gap-1">
                                {entry.singer_name}
                                {entry.allow_voting === false && (
                                  <span title="Sem votação">
                                    <VolumeX className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2 break-words">{entry.song_title}</p>
                              {info && <QueueEntryIndicators info={info} compact />}
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {onUpdateSingerName && editingId !== entry.id && (
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStartEdit(entry)} title={t('waitlist.editName')}>
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onMovePriority(entry.id, 'up')} disabled={index === 0} title={t('waitlist.moveUp')}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onMovePriority(entry.id, 'down')} disabled={index === entries.length - 1} title={t('waitlist.moveDown')}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-primary hover:text-primary" onClick={() => onSelectEntry(entry)} title={t('waitlist.select')}>
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onRemoveEntry(entry.id)} title={t('waitlist.remove')}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
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
              {onRecoverFromHistory && (
                <div className="px-2 py-1 text-xs text-muted-foreground bg-muted/50 rounded mb-2">
                  Clique para recuperar uma música
                </div>
              )}
              <div className="space-y-2 pr-2">
                {historyEntries.map((entry, index) => {
                  const info = getDisplayInfo?.(entry);
                  return (
                    <button
                      key={entry.id}
                      onClick={() => handleHistoryClick(entry)}
                      disabled={!onRecoverFromHistory}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg bg-background/40 text-left transition-colors ${
                        onRecoverFromHistory ? 'hover:bg-background/60 cursor-pointer group' : 'cursor-default'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{entry.singer_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{entry.song_title}</p>
                        {info && <QueueEntryIndicators info={info} compact />}
                      </div>
                      {onRecoverFromHistory && (
                        <RotateCcw className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Recover from History Dialog */}
      <AlertDialog open={recoverDialogOpen} onOpenChange={setRecoverDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              Recuperar música
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {selectedRecoverEntry && (
                  <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="font-medium text-foreground">{selectedRecoverEntry.singer_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedRecoverEntry.song_title}</p>
                  </div>
                )}
                <p className="mt-3">O que deseja fazer?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Button onClick={() => handleRecoverConfirm('next')} disabled={isRecovering} variant="outline" size="lg" className="w-full h-12 text-base">
              {isRecovering ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <SkipForward className="h-5 w-5 mr-2" />}
              Será o próximo
            </Button>
            <div className="w-full flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              <span>ou cantar agora</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="w-full grid grid-cols-2 gap-3">
              <Button onClick={() => handleRecoverConfirm('now_return')} disabled={isRecovering} variant="secondary" size="lg" className="flex flex-col items-center gap-1 h-auto py-4">
                {isRecovering ? <Loader2 className="h-6 w-6 animate-spin" /> : <Play className="h-6 w-6" />}
                <span className="text-sm font-medium">Cantar agora</span>
                <span className="text-xs text-muted-foreground">atual volta à fila</span>
              </Button>
              <Button onClick={() => handleRecoverConfirm('now_end')} disabled={isRecovering} size="lg" className="flex flex-col items-center gap-1 h-auto py-4">
                {isRecovering ? <Loader2 className="h-6 w-6 animate-spin" /> : <Play className="h-6 w-6" />}
                <span className="text-sm font-medium">Cantar agora</span>
                <span className="text-xs text-muted-foreground/70">encerrar atual</span>
              </Button>
            </div>
            <AlertDialogCancel disabled={isRecovering} className="w-full h-11 text-base mt-2">Cancelar</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
