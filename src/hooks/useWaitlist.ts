import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';

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

function normalizeSingerName(name: string) {
  return name.trim().toLowerCase();
}

interface SingerHistory {
  timesSung: number;
  lastPerformed: Date | null;
}

function buildFairOrder(waitingEntries: WaitlistEntry[], singerHistories: Map<string, SingerHistory>): WaitlistEntry[] {
  // Fair rules:
  // 1) People with lower total historical performances go first
  // 2) If equal, prioritize who hasn't sung for longer (or never sang)
  // 3) If a person has multiple songs waiting, they get 1 song per "round" (round-robin)
  // 4) Ties are broken by earliest created_at of the next song

  // Group entries by their effective times_sung (from history + current queue position)
  const byTimes = new Map<number, Map<string, WaitlistEntry[]>>();

  for (const entry of waitingEntries) {
    const singerKey = normalizeSingerName(entry.singer_name);
    const history = singerHistories.get(singerKey);
    
    // Use historical times_sung if available, otherwise use entry's times_sung
    const base = history?.timesSung ?? entry.times_sung ?? 0;
    
    if (!byTimes.has(base)) byTimes.set(base, new Map());
    const group = byTimes.get(base)!;
    if (!group.has(singerKey)) group.set(singerKey, []);
    group.get(singerKey)!.push(entry);
  }

  // Sort each singer's songs by signup time
  for (const group of byTimes.values()) {
    for (const list of group.values()) {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
  }

  const bases = Array.from(byTimes.keys()).sort((a, b) => a - b);
  const result: WaitlistEntry[] = [];

  for (const base of bases) {
    const group = byTimes.get(base)!;
    
    // Order singers by: last performance time (longer ago = higher priority), then signup time
    const singerKeys = Array.from(group.keys()).sort((aKey, bKey) => {
      const aHistory = singerHistories.get(aKey);
      const bHistory = singerHistories.get(bKey);
      const aFirst = group.get(aKey)?.[0];
      const bFirst = group.get(bKey)?.[0];
      
      // If one never performed and other did, prioritize who never performed
      if (!aHistory?.lastPerformed && bHistory?.lastPerformed) return -1;
      if (aHistory?.lastPerformed && !bHistory?.lastPerformed) return 1;
      
      // Both have performed - prioritize who performed longer ago
      if (aHistory?.lastPerformed && bHistory?.lastPerformed) {
        const timeDiff = aHistory.lastPerformed.getTime() - bHistory.lastPerformed.getTime();
        if (timeDiff !== 0) return timeDiff; // Earlier = lower timestamp = goes first
      }
      
      // Fallback to signup time
      if (!aFirst || !bFirst) return 0;
      return new Date(aFirst.created_at).getTime() - new Date(bFirst.created_at).getTime();
    });

    // Round-robin
    let stillHas = true;
    while (stillHas) {
      stillHas = false;
      for (const singerKey of singerKeys) {
        const list = group.get(singerKey);
        if (list && list.length > 0) {
          result.push(list.shift()!);
          stillHas = true;
        }
      }
    }
  }

  return result;
}

export function useWaitlist(instanceId?: string | null) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [historyEntries, setHistoryEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Fetch singer history from performances table
  const fetchSingerHistories = async (singerNames: string[]): Promise<Map<string, SingerHistory>> => {
    const histories = new Map<string, SingerHistory>();
    if (!instanceId || singerNames.length === 0) return histories;

    // Get performance history for all singers in the waitlist
    const { data: performances } = await supabase
      .from('performances')
      .select('cantor, created_at')
      .eq('karaoke_instance_id', instanceId)
      .eq('status', 'encerrada');

    if (!performances) return histories;

    // Count performances and track last performance time for each singer
    for (const perf of performances) {
      const singerKey = normalizeSingerName(perf.cantor);
      const existing = histories.get(singerKey);
      const perfDate = new Date(perf.created_at);
      
      if (existing) {
        existing.timesSung++;
        if (!existing.lastPerformed || perfDate > existing.lastPerformed) {
          existing.lastPerformed = perfDate;
        }
      } else {
        histories.set(singerKey, { timesSung: 1, lastPerformed: perfDate });
      }
    }

    return histories;
  };

  const applyFairOrderIfNeeded = async (waitingEntries: WaitlistEntry[], forceRebalance = false) => {
    // Separate coordinator insertions (negative priority) from regular entries
    const coordinatorEntries = waitingEntries.filter(e => e.priority < 0);
    const regularEntries = waitingEntries.filter(e => e.priority >= 0);
    
    // Sort coordinator entries by priority (most negative = most recent = first)
    coordinatorEntries.sort((a, b) => a.priority - b.priority);
    
    // Check if regular entries have manual order (sequential from some base)
    const hasManualOrder = regularEntries.length > 0 && 
      regularEntries.every((e, idx) => e.priority === idx || e.priority === idx + coordinatorEntries.length);
    
    if (hasManualOrder && !forceRebalance && coordinatorEntries.length === 0) {
      // Host has already set the order, respect it
      return waitingEntries;
    }

    // Fetch historical performance data for fair ordering
    const singerNames = regularEntries.map(e => e.singer_name);
    const singerHistories = await fetchSingerHistories(singerNames);

    // Apply fair order only to regular entries (not coordinator insertions)
    const fair = forceRebalance ? buildFairOrder(regularEntries, singerHistories) : regularEntries;
    
    // Combine: coordinator entries first, then fair/regular entries
    const combined = [...coordinatorEntries, ...fair];
    
    // Check if we need to update priorities to be sequential
    const needsUpdate = combined.some((e, idx) => e.priority !== idx);
    if (!needsUpdate) return combined;

    // Persist priorities as sequential integers to make ordering deterministic.
    await Promise.all(
      combined.map((e, idx) => supabase.from('waitlist').update({ priority: idx }).eq('id', e.id))
    );

    // Return with updated priorities locally
    return combined.map((e, idx) => ({ ...e, priority: idx }));
  };

  const fetchWaitingEntries = async (forceRebalance = false) => {
    // IMPORTANT: Only fetch if we have a valid instanceId to avoid cross-instance data leakage
    // If no instanceId is provided, return empty list (don't fetch all instances)
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
      const fair = await applyFairOrderIfNeeded(waiting, forceRebalance);
      setEntries(fair);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    // IMPORTANT: Only fetch if we have a valid instanceId
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
  };

  const fetchEntries = async () => {
    await Promise.all([fetchWaitingEntries(), fetchHistory()]);
  };

  useEffect(() => {
    fetchEntries();

    const channelName = instanceId ? `waitlist-${instanceId}` : 'waitlist-changes';
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'waitlist',
          ...(instanceId ? { filter: `karaoke_instance_id=eq.${instanceId}` } : {}),
        }, 
        (payload) => {
          console.log('Waitlist INSERT detected:', payload);
          fetchEntries();
        }
      )
      .on(
        'postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'waitlist',
          ...(instanceId ? { filter: `karaoke_instance_id=eq.${instanceId}` } : {}),
        }, 
        (payload) => {
          console.log('Waitlist UPDATE detected:', payload);
          fetchEntries();
        }
      )
      .on(
        'postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'waitlist',
          ...(instanceId ? { filter: `karaoke_instance_id=eq.${instanceId}` } : {}),
        }, 
        (payload) => {
          console.log('Waitlist DELETE detected:', payload);
          fetchEntries();
        }
      )
      .subscribe((status) => {
        console.log('Waitlist realtime subscription status:', status);
      });

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [instanceId]);

  // Rate limiting constants
  const RATE_LIMIT_KEY = 'waitlist_last_submission';
  const RATE_LIMIT_MS = 60000; // 1 minute

  const addToWaitlist = async (singerName: string, youtubeUrl: string, songTitle: string, registeredBy?: string, insertFirst = false, allowVoting = true) => {
    try {
      // Check if registration is open for this instance (skip for coordinator insertions)
      if (!insertFirst && instanceId) {
        const { data: settings } = await supabase
          .from('event_settings')
          .select('registration_open')
          .eq('karaoke_instance_id', instanceId)
          .maybeSingle();
        
        // If settings exist and registration is closed, block the submission
        if (settings && settings.registration_open === false) {
          toast({ 
            title: t('registration.closed'), 
            description: t('registration.closedMessage'),
            variant: 'destructive' 
          });
          return false;
        }
      }

      // Check rate limiting (skip for coordinator insertions - they can add freely)
      if (!insertFirst) {
        const lastSubmission = localStorage.getItem(RATE_LIMIT_KEY);
        if (lastSubmission) {
          const timeSince = Date.now() - parseInt(lastSubmission, 10);
          if (timeSince < RATE_LIMIT_MS) {
            const waitSeconds = Math.ceil((RATE_LIMIT_MS - timeSince) / 1000);
            toast({ 
              title: t('signup.waitMoment'), 
              description: `${t('signup.waitSeconds')} ${waitSeconds}s`,
              variant: 'destructive' 
            });
            return false;
          }
        }
      }

      // For coordinator insertions (insertFirst), use the singerName for fair order calculation
      // This ensures the typed name is considered for times_sung, not the coordinator's name
      const nameForFairOrder = singerName.trim();
      
      // Get how many times this singer has sung before IN THIS INSTANCE ONLY
      // Each event is independent - times_sung should NOT carry over between instances
      let timesSung = 0;
      if (instanceId) {
        const { data: previousEntries } = await supabase
          .from('waitlist')
          .select('times_sung')
          .eq('karaoke_instance_id', instanceId)
          .ilike('singer_name', nameForFairOrder)
          .order('times_sung', { ascending: false })
          .limit(1);

        timesSung = previousEntries?.[0]?.times_sung || 0;
      }

      // If insertFirst, use negative priority to ensure this entry comes first
      // Negative priorities are sorted before 0+, so each new insertFirst gets a more negative value
      let priorityToUse = 999999; // Default: will be rebalanced in fair order
      
      if (insertFirst) {
        // Get the current minimum priority to insert before it
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
        
        // Use a priority that's lower (comes before) the current minimum
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
      
      // Update rate limit timestamp on successful submission (only for regular insertions)
      if (!insertFirst) {
        localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
        // Rebalance with fair order for regular insertions
        await fetchWaitingEntries(true);
      } else {
        // Just refetch without rebalancing for coordinator insertions
        await fetchWaitingEntries(false);
      }
      
      toast({ title: t('signup.signupConfirmed'), description: t('signup.addedToQueue') });
      
      return true;
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast({ title: t('host.error'), description: t('signup.cantAddToList'), variant: 'destructive' });
      return false;
    }
  };

  const markAsSinging = async (entryId: string) => {
    try {
      const { error } = await supabase.from('waitlist').update({ status: 'singing' }).eq('id', entryId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating waitlist entry:', error);
    }
  };

  const markAsDone = async (entryId: string, singerName: string) => {
    try {
      const { error: updateError } = await supabase.from('waitlist').update({ status: 'done' }).eq('id', entryId);
      if (updateError) throw updateError;

      // Increment times_sung for all waiting entries from this singer IN THIS INSTANCE
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
          await supabase.from('waitlist').update({ 
            times_sung: entry.times_sung + 1,
            priority: 999999 // Reset to high value to trigger rebalance
          }).eq('id', entry.id);
        }
      }

      // Force rebalance after someone sings to reapply fair order
      await fetchWaitingEntries(true);
      await fetchHistory();
    } catch (error) {
      console.error('Error marking as done:', error);
    }
  };

  const removeFromWaitlist = async (entryId: string) => {
    try {
      const { error } = await supabase.from('waitlist').delete().eq('id', entryId);
      if (error) throw error;
    } catch (error) {
      console.error('Error removing from waitlist:', error);
    }
  };

  const movePriority = async (entryId: string, direction: 'up' | 'down') => {
    try {
      // Host manual tweak: swap position in the CURRENT (already fair) list,
      // then persist sequential priorities.
      const currentIndex = entries.findIndex(e => e.id === entryId);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= entries.length) return;

      const reordered = [...entries];
      const [moved] = reordered.splice(currentIndex, 1);
      reordered.splice(targetIndex, 0, moved);

      await Promise.all(
        reordered.map((e, idx) => supabase.from('waitlist').update({ priority: idx }).eq('id', e.id))
      );

      setEntries(reordered.map((e, idx) => ({ ...e, priority: idx })));
    } catch (error) {
      console.error('Error moving priority:', error);
    }
  };

  const updateSingerName = async (entryId: string, newName: string, updateAll = true) => {
    try {
      // Get the current entry to find the old name
      const currentEntry = entries.find(e => e.id === entryId);
      const oldName = currentEntry?.singer_name;
      
      if (updateAll && oldName && instanceId) {
        // Update ALL entries with the same singer name in this instance
        const { error } = await supabase
          .from('waitlist')
          .update({ singer_name: newName.trim() })
          .eq('karaoke_instance_id', instanceId)
          .eq('status', 'waiting')
          .ilike('singer_name', oldName);
        
        if (error) throw error;
        
        // Update local state - change all entries with the same name
        setEntries(prev => prev.map(e => 
          e.singer_name.toLowerCase() === oldName.toLowerCase() 
            ? { ...e, singer_name: newName.trim() } 
            : e
        ));
      } else {
        // Update only the specific entry
        const { error } = await supabase
          .from('waitlist')
          .update({ singer_name: newName.trim() })
          .eq('id', entryId);
        
        if (error) throw error;
        
        // Update local state immediately
        setEntries(prev => prev.map(e => 
          e.id === entryId ? { ...e, singer_name: newName.trim() } : e
        ));
      }
      
      toast({ title: t('waitlist.nameUpdated') });
      return true;
    } catch (error) {
      console.error('Error updating singer name:', error);
      toast({ title: t('host.error'), variant: 'destructive' });
      return false;
    }
  };

  const getNextInQueue = (): WaitlistEntry | null => {
    return entries.length > 0 ? entries[0] : null;
  };

  // Get unique singer names for autocomplete suggestions
  const getUniqueSingerNames = async (): Promise<string[]> => {
    if (!instanceId) return [];
    
    try {
      // Get unique names from both waitlist and performances
      const [waitlistResult, performancesResult] = await Promise.all([
        supabase
          .from('waitlist')
          .select('singer_name')
          .eq('karaoke_instance_id', instanceId),
        supabase
          .from('performances')
          .select('cantor')
          .eq('karaoke_instance_id', instanceId)
      ]);

      const namesSet = new Set<string>();
      
      // Add names from waitlist
      waitlistResult.data?.forEach(entry => {
        if (entry.singer_name?.trim()) {
          namesSet.add(entry.singer_name.trim());
        }
      });
      
      // Add names from performances
      performancesResult.data?.forEach(entry => {
        if (entry.cantor?.trim()) {
          namesSet.add(entry.cantor.trim());
        }
      });

      return Array.from(namesSet).sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
      );
    } catch (error) {
      console.error('Error fetching singer names:', error);
      return [];
    }
  };

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
    getNextInQueue, 
    getUniqueSingerNames,
    refetch: fetchEntries 
  };
}
