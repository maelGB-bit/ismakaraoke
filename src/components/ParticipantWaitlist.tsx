import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Users, Music, Star, Clock, VolumeX, Bell, Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { WaitlistEntry } from '@/hooks/useWaitlist';
import { UserProfile } from '@/hooks/useUserProfile';
import { useLanguage } from '@/i18n/LanguageContext';

interface ParticipantWaitlistProps {
  entries: WaitlistEntry[];
  loading: boolean;
  currentSingerName?: string | null;
  userProfile?: UserProfile | null;
  highlightName?: string; // Keep for backwards compatibility
  onChangeSong?: (entryId: string, songTitle: string, youtubeUrl: string) => Promise<boolean>;
}

/** Toca um bip de alerta usando Web Audio API */
function playAlertBeep(times = 2) {
  try {
    const ctx = new AudioContext();
    let startAt = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.3);
      osc.start(startAt);
      osc.stop(startAt + 0.3);
      startAt += 0.45;
    }
    // Fechar contexto após os bips
    setTimeout(() => ctx.close(), (times * 0.45 + 0.5) * 1000);
  } catch {
    // Navegador sem suporte — ignora silenciosamente
  }
}

export function ParticipantWaitlist({ entries, loading, currentSingerName, userProfile, highlightName, onChangeSong }: ParticipantWaitlistProps) {
  const { t } = useLanguage();
  const prevIndexRef = useRef<number>(-99);

  // Song change dialog
  const [changeSongEntry, setChangeSongEntry] = useState<WaitlistEntry | null>(null);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongUrl, setNewSongUrl] = useState('');
  const [isSavingSong, setIsSavingSong] = useState(false);

  const handleOpenChangeSong = (entry: WaitlistEntry) => {
    setChangeSongEntry(entry);
    setNewSongTitle(entry.song_title);
    setNewSongUrl(entry.youtube_url);
  };

  const handleSaveSong = async () => {
    if (!changeSongEntry || !onChangeSong || !newSongTitle.trim() || !newSongUrl.trim()) return;
    setIsSavingSong(true);
    const ok = await onChangeSong(changeSongEntry.id, newSongTitle, newSongUrl);
    setIsSavingSong(false);
    if (ok) {
      setChangeSongEntry(null);
      setNewSongTitle('');
      setNewSongUrl('');
    }
  };

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

  // Alerta sonoro quando posição cai para 1 ou 2
  useEffect(() => {
    const prev = prevIndexRef.current;
    // Só alerta se o usuário está na fila e houve mudança real de posição
    if (userEntryIndex >= 0 && normalizedUserName && prev !== userEntryIndex) {
      // Posição 0 = próximo (2 bips), posição 1 = 2 à frente (1 bip)
      if (userEntryIndex === 0 && prev > 0) {
        playAlertBeep(2);
      } else if (userEntryIndex === 1 && prev > 1) {
        playAlertBeep(1);
      }
    }
    prevIndexRef.current = userEntryIndex;
  }, [userEntryIndex, normalizedUserName]);

  return (
    <>
    {/* Change Song Dialog */}
    <Dialog open={!!changeSongEntry} onOpenChange={(open) => { if (!open) setChangeSongEntry(null); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" /> Mudar música
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-sm">Título da música</Label>
            <Input
              value={newSongTitle}
              onChange={e => setNewSongTitle(e.target.value)}
              placeholder="Ex: Evidências - Chitãozinho & Xororó"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">URL do YouTube (karaokê)</Label>
            <Input
              value={newSongUrl}
              onChange={e => setNewSongUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="mt-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Sua posição na fila não muda — apenas a música é atualizada.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setChangeSongEntry(null)} disabled={isSavingSong}>
            Cancelar
          </Button>
          <Button onClick={handleSaveSong} disabled={isSavingSong || !newSongTitle.trim() || !newSongUrl.trim()}>
            {isSavingSong ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
        {userEntryIndex === 1 && normalizedUserName && (
          <motion.div
            key="almost-next"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-4 rounded-lg bg-yellow-500/20 border-2 border-yellow-500 text-center"
          >
            <Bell className="h-7 w-7 mx-auto text-yellow-500 mb-1 animate-bounce" />
            <p className="font-bold text-base text-yellow-600 dark:text-yellow-400">Quase sua vez!</p>
            <p className="text-sm text-muted-foreground">Só 1 pessoa na sua frente — prepare-se!</p>
          </motion.div>
        )}
        {userEntryIndex > 1 && normalizedUserName && (
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
                    <p className={`font-medium text-sm truncate flex items-center gap-1 ${isHighlighted ? 'text-primary' : ''}`}>
                      {entry.singer_name}
                      {isHighlighted && <span>⭐</span>}
                      {entry.allow_voting === false && (
                        <span title="Sem votação">
                          <VolumeX className="h-3 w-3 text-orange-500 flex-shrink-0" />
                        </span>
                      )}
                      {entry.registered_by && (
                        <span className="text-xs text-muted-foreground">
                          ({t('waitlist.registeredBy')} {entry.registered_by})
                        </span>
                      )}
                      {entry.times_sung > 0 && (
                        <span className="text-xs text-muted-foreground">({entry.times_sung}x)</span>
                      )}
                    </p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground truncate flex-1">{entry.song_title}</p>
                      {isHighlighted && onChangeSong && (
                        <button
                          onClick={() => handleOpenChangeSong(entry)}
                          className="shrink-0 p-0.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                          title="Mudar música"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
    </>
  );
}
