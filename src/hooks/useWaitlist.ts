import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  buildProFairOrder,
  getQueueItemDisplayInfo,
  type SingerStats,
  type QueueItem,
} from '@/lib/fairQueueAlgorithm';

export interface WaitlistEntry {
  id: string;
  singer_name: string;
  youtube_url: string;
  song_title: string;
  times_sung: number;
  status: string;
  created_at: string;
  priority: number;
  registered_by?: string;
  allow_voting?: boolean;
}

/** Informações de exibição calculadas para cada item da fila */
export interface QueueDisplayInfo {
  songsSung: number;
  isNewSinger: boolean;
  waitMinutes: number;
  isCoordinatorOverride: boolean;
}

function normalizeSingerName(name: string) {
  return name.trim().toLowerCase();
}

export function useWaitlist(instanceId?: string | null) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [historyEntries, setHistoryEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [singerHistories, setSingerHistories] = useState<Map<string, SingerStats>>(new Map());
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  /**
   * lastSingerId: nome normalizado do último cantor que terminou de cantar.
   * Usado pelo algoritmo de anti-repetição adaptativo.
   */
  const lastSingerIdRef = useRef<string | null>(null);

  // ─── Fetch singer history from performances table ───
  // Filtra apenas performances da sessão atual (após session_started_at)
  const fetchSingerHistories = useCallback(async (): Promise<Map<string, SingerStats>> => {
    const histories = new Map<string, SingerStats>();
    if (!instanceId) return histories;

    // Buscar session_started_at para delimitar a sessão atual
    const { data: settingsData } = await supabase
      .from('event_settings')
      .select('session_started_at')
      .eq('karaoke_instance_id', instanceId)
      .maybeSingle();

    const sessionStartedAtValue = settingsData?.session_started_at || null;
    setSessionStartedAt(sessionStartedAtValue ? new Date(sessionStartedAtValue) : null);

    // Buscar performances encerradas da sessão atual
    let query = supabase
      .from('performances')
      .select('cantor, created_at')
      .eq('karaoke_instance_id', instanceId)
      .eq('status', 'encerrada');

    if (sessionStartedAtValue) {
      query = query.gte('created_at', sessionStartedAtValue);
    }

    const { data: performances } = await query;

    // Buscar performance ativa (cantando agora) para lastSingerId
    const { data: activePerf } = await supabase
      .from('performances')
      .select('cantor, created_at')
      .eq('karaoke_instance_id', instanceId)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!performances) return histories;

    for (const perf of performances) {
      const singerKey = normalizeSingerName(perf.cantor);
      const perfDate = new Date(perf.created_at);
      const existing = histories.get(singerKey);

      if (existing) {
        existing.songsSung++;
        if (!existing.lastSungAt || perfDate > existing.lastSungAt) {
          existing.lastSungAt = perfDate;
        }
      } else {
        histories.set(singerKey, { songsSung: 1, lastSungAt: perfDate });
      }
    }

    // Priorizar performance ativa como lastSingerId (quem está cantando agora)
    if (activePerf && activePerf.length > 0) {
      lastSingerIdRef.current = normalizeSingerName(activePerf[0].cantor);
    } else {
      // Fallback: último cantor que terminou de cantar
      let mostRecent: { key: string; date: Date } | null = null;
      for (const [key, stats] of histories) {
        if (stats.lastSungAt && (!mostRecent || stats.lastSungAt > mostRecent.date)) {
          mostRecent = { key, date: stats.lastSungAt };
        }
      }
      if (mostRecent) {
        lastSingerIdRef.current = mostRecent.key;
      }
    }

    return histories;
  }, [instanceId]);

  // ─── Apply PRO fair order ───
  // SEMPRE aplica o algoritmo justo para manter a fila atualizada em tempo real
  const applyProFairOrder = useCallback(async (
    waitingEntries: WaitlistEntry[],
  ) => {
    if (waitingEntries.length === 0) return waitingEntries;

    // Buscar histórico completo de performances (inclui performance ativa)
    const histories = await fetchSingerHistories();
    setSingerHistories(histories);

    // Aplicar algoritmo PRO adaptativo
    const fair = buildProFairOrder(
      waitingEntries,
      histories,
      lastSingerIdRef.current,
    );

    // Persistir prioridades sequenciais no banco (apenas se mudou)
    const needsUpdate = fair.some((e, idx) => e.priority !== idx);
    if (needsUpdate) {
      await Promise.all(
        fair.map((e, idx) =>
          supabase.from('waitlist').update({ priority: idx }).eq('id', e.id),
        ),
      );
    }

    return fair.map((e, idx) => ({ ...e, priority: idx }));
  }, [fetchSingerHistories]);

  // ─── Fetch waiting entries ───
  const fetchWaitingEntries = useCallback(async () => {
    if (!instanceId) {
      console.log('[useWaitlist] No instanceId provided, skipping fetch');
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      console.log('[useWaitlist] Fetching waitlist for instanceId:', instanceId);
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('status', 'waiting')
        .eq('karaoke_instance_id', instanceId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      const waiting = (data as WaitlistEntry[]) || [];
      console.log('[useWaitlist] Fetched', waiting.length, 'entries for instance', instanceId);
      const fair = await applyProFairOrder(waiting);
      setEntries(fair);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    } finally {
      setLoading(false);
    }
  }, [instanceId, applyProFairOrder]);

  // ─── Fetch history ───
  const fetchHistory = useCallback(async () => {
    if (!instanceId) {
      setHistoryEntries([]);
      setHistoryLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('status', 'done')
        .eq('karaoke_instance_id', instanceId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistoryEntries((data as WaitlistEntry[]) || []);
    } catch (error) {
      console.error('Error fetching waitlist history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [instanceId]);

  const fetchEntries = useCallback(async () => {
    await Promise.all([fetchWaitingEntries(), fetchHistory()]);
  }, [fetchWaitingEntries, fetchHistory]);

  // ─── Realtime subscription ───
  useEffect(() => {
    fetchEntries();

    const channelName = instanceId ? `waitlist-perf-${instanceId}` : 'waitlist-perf-changes';
    const tableFilter = instanceId ? { filter: `karaoke_instance_id=eq.${instanceId}` } : {};
    const channel = supabase
      .channel(channelName)
      // ── waitlist changes ──
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waitlist', ...tableFilter }, () => fetchEntries())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'waitlist', ...tableFilter }, () => fetchEntries())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'waitlist', ...tableFilter }, () => fetchEntries())
      // ── performances changes (rebalanceia fila quando performance muda) ──
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'performances', ...tableFilter }, () => fetchWaitingEntries())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'performances', ...tableFilter }, () => fetchWaitingEntries())
      .subscribe((status) => {
        console.log('Waitlist+Performances realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instanceId, fetchEntries]);

  // ─── Rate limiting ───
  const RATE_LIMIT_KEY = 'waitlist_last_submission';
  const RATE_LIMIT_MS = 60000; // 1 minuto

  // ─── addToWaitlist ───
  const addToWaitlist = async (
    singerName: string,
    youtubeUrl: string,
    songTitle: string,
    registeredBy?: string,
    insertFirst = false,
    allowVoting = true,
  ) => {
    try {
      // Verificar se inscrição está aberta (pular para inserções do coordenador)
      if (!insertFirst && instanceId) {
        const { data: settings } = await supabase
          .from('event_settings')
          .select('registration_open')
          .eq('karaoke_instance_id', instanceId)
          .maybeSingle();

        if (settings && settings.registration_open === false) {
          toast({
            title: t('registration.closed'),
            description: t('registration.closedMessage'),
            variant: 'destructive',
          });
          return false;
        }
      }

      // Rate limiting (coordenador ignora)
      if (!insertFirst) {
        const lastSubmission = localStorage.getItem(RATE_LIMIT_KEY);
        if (lastSubmission) {
          const timeSince = Date.now() - parseInt(lastSubmission, 10);
          if (timeSince < RATE_LIMIT_MS) {
            const waitSeconds = Math.ceil((RATE_LIMIT_MS - timeSince) / 1000);
            toast({
              title: t('signup.waitMoment'),
              description: `${t('signup.waitSeconds')} ${waitSeconds}s`,
              variant: 'destructive',
            });
            return false;
          }
        }
      }

      // Buscar times_sung baseado no histórico da sessão atual (performances)
      let timesSung = 0;
      if (instanceId) {
        // Buscar session_started_at
        const { data: settingsData } = await supabase
          .from('event_settings')
          .select('session_started_at')
          .eq('karaoke_instance_id', instanceId)
          .maybeSingle();

        const sessionStartedAt = settingsData?.session_started_at || null;

        let perfQuery = supabase
          .from('performances')
          .select('id')
          .eq('karaoke_instance_id', instanceId)
          .eq('status', 'encerrada')
          .ilike('cantor', singerName.trim());

        if (sessionStartedAt) {
          perfQuery = perfQuery.gte('created_at', sessionStartedAt);
        }

        const { data: perfCount } = await perfQuery;
        timesSung = perfCount?.length || 0;
      }

      // Se insertFirst, usar prioridade negativa para override do coordenador
      let priorityToUse = 999999;

      if (insertFirst) {
        let query = supabase
          .from('waitlist')
          .select('priority')
          .eq('status', 'waiting')
          .order('priority', { ascending: true })
          .limit(1);

        if (instanceId) {
          query = query.eq('karaoke_instance_id', instanceId);
        }

        const { data: minPriorityEntry } = await query;
        const currentMin = minPriorityEntry?.[0]?.priority ?? 0;
        priorityToUse = currentMin - 1;
      }

      const insertData = {
        singer_name: singerName.trim(),
        youtube_url: youtubeUrl,
        song_title: songTitle,
        times_sung: timesSung,
        priority: priorityToUse,
        status: 'waiting',
        registered_by: registeredBy?.trim() || null,
        karaoke_instance_id: instanceId || null,
        allow_voting: allowVoting,
      };

      const { error } = await supabase.from('waitlist').insert(insertData);
      if (error) throw error;

      if (!insertFirst) {
        localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
      }
      // Sempre rebalancear com algoritmo PRO
      await fetchWaitingEntries();

      toast({ title: t('signup.signupConfirmed'), description: t('signup.addedToQueue') });
      return true;
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast({ title: t('host.error'), description: t('signup.cantAddToList'), variant: 'destructive' });
      return false;
    }
  };

  // ─── markAsSinging ───
  const markAsSinging = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update({ status: 'singing' })
        .eq('id', entryId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating waitlist entry:', error);
    }
  };

  // ─── markAsDone ───
  const markAsDone = async (entryId: string, singerName: string) => {
    try {
      const { error: updateError } = await supabase
        .from('waitlist')
        .update({ status: 'done' })
        .eq('id', entryId);
      if (updateError) throw updateError;

      // Atualizar lastSingerId para anti-repetição
      lastSingerIdRef.current = normalizeSingerName(singerName);

      // Incrementar times_sung para todas as entradas deste cantor na instância
      let query = supabase
        .from('waitlist')
        .select('id, times_sung, priority')
        .ilike('singer_name', singerName.trim())
        .eq('status', 'waiting');

      if (instanceId) {
        query = query.eq('karaoke_instance_id', instanceId);
      }

      const { data: waitingEntries } = await query;

      if (waitingEntries && waitingEntries.length > 0) {
        for (const entry of waitingEntries) {
          await supabase
            .from('waitlist')
            .update({
              times_sung: entry.times_sung + 1,
              priority: 999999, // Reset para forçar rebalance
            })
            .eq('id', entry.id);
        }
      }

      // Forçar rebalance com algoritmo PRO após alguém cantar
      await fetchWaitingEntries();
      await fetchHistory();
    } catch (error) {
      console.error('Error marking as done:', error);
    }
  };

  // ─── removeFromWaitlist ───
  const removeFromWaitlist = async (entryId: string) => {
    try {
      const { error } = await supabase.from('waitlist').delete().eq('id', entryId);
      if (error) throw error;
    } catch (error) {
      console.error('Error removing from waitlist:', error);
    }
  };

  // ─── movePriority (override manual do coordenador) ───
  const movePriority = async (entryId: string, direction: 'up' | 'down') => {
    try {
      const currentIndex = entries.findIndex(e => e.id === entryId);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= entries.length) return;

      const reordered = [...entries];
      const [moved] = reordered.splice(currentIndex, 1);
      reordered.splice(targetIndex, 0, moved);

      await Promise.all(
        reordered.map((e, idx) =>
          supabase.from('waitlist').update({ priority: idx }).eq('id', e.id),
        ),
      );

      setEntries(reordered.map((e, idx) => ({ ...e, priority: idx })));
    } catch (error) {
      console.error('Error moving priority:', error);
    }
  };

  // ─── updateSingerName ───
  const updateSingerName = async (entryId: string, newName: string, updateAll = true) => {
    try {
      const currentEntry = entries.find(e => e.id === entryId);
      const oldName = currentEntry?.singer_name;

      if (updateAll && oldName && instanceId) {
        const { error } = await supabase
          .from('waitlist')
          .update({ singer_name: newName.trim() })
          .eq('karaoke_instance_id', instanceId)
          .eq('status', 'waiting')
          .ilike('singer_name', oldName);

        if (error) throw error;

        setEntries(prev =>
          prev.map(e =>
            e.singer_name.toLowerCase() === oldName.toLowerCase()
              ? { ...e, singer_name: newName.trim() }
              : e,
          ),
        );
      } else {
        const { error } = await supabase
          .from('waitlist')
          .update({ singer_name: newName.trim() })
          .eq('id', entryId);

        if (error) throw error;

        setEntries(prev =>
          prev.map(e =>
            e.id === entryId ? { ...e, singer_name: newName.trim() } : e,
          ),
        );
      }

      toast({ title: t('waitlist.nameUpdated') });
      return true;
    } catch (error) {
      console.error('Error updating singer name:', error);
      toast({ title: t('host.error'), variant: 'destructive' });
      return false;
    }
  };

  // ─── updateSong ─── (participante muda a própria música, sem alterar prioridade)
  const updateSong = async (entryId: string, songTitle: string, youtubeUrl: string) => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update({ song_title: songTitle.trim(), youtube_url: youtubeUrl.trim() })
        .eq('id', entryId);

      if (error) throw error;

      setEntries(prev =>
        prev.map(e =>
          e.id === entryId
            ? { ...e, song_title: songTitle.trim(), youtube_url: youtubeUrl.trim() }
            : e,
        ),
      );

      toast({ title: 'Música atualizada!' });
      return true;
    } catch (error) {
      console.error('Error updating song:', error);
      toast({ title: t('host.error'), variant: 'destructive' });
      return false;
    }
  };

  // ─── getNextInQueue ───
  const getNextInQueue = (): WaitlistEntry | null => {
    return entries.length > 0 ? entries[0] : null;
  };

  // ─── getUniqueSingerNames (autocomplete) ───
  const getUniqueSingerNames = async (): Promise<string[]> => {
    if (!instanceId) return [];

    try {
      const [waitlistResult, performancesResult] = await Promise.all([
        supabase
          .from('waitlist')
          .select('singer_name')
          .eq('karaoke_instance_id', instanceId),
        supabase
          .from('performances')
          .select('cantor')
          .eq('karaoke_instance_id', instanceId),
      ]);

      const namesSet = new Set<string>();

      waitlistResult.data?.forEach(entry => {
        if (entry.singer_name?.trim()) {
          namesSet.add(entry.singer_name.trim());
        }
      });

      performancesResult.data?.forEach(entry => {
        if (entry.cantor?.trim()) {
          namesSet.add(entry.cantor.trim());
        }
      });

      return Array.from(namesSet).sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase()),
      );
    } catch (error) {
      console.error('Error fetching singer names:', error);
      return [];
    }
  };

  // ─── getDisplayInfo helper ───
  const getDisplayInfo = useCallback(
    (entry: WaitlistEntry): QueueDisplayInfo => {
      return getQueueItemDisplayInfo(entry, singerHistories, sessionStartedAt);
    },
    [singerHistories, sessionStartedAt],
  );

  return {
    entries,
    historyEntries,
    loading,
    historyLoading,
    addToWaitlist,
    markAsSinging,
    markAsDone,
    removeFromWaitlist,
    movePriority,
    updateSingerName,
    updateSong,
    getNextInQueue,
    getUniqueSingerNames,
    getDisplayInfo,
    refetch: fetchEntries,
  };
}
