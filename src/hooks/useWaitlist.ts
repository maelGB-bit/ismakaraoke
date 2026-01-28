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
}

function normalizeSingerName(name: string) {
  return name.trim().toLowerCase();
}

function buildFairOrder(waitingEntries: WaitlistEntry[]): WaitlistEntry[] {
  // Fair rules:
  // 1) People with lower times_sung go first
  // 2) If a person has multiple songs waiting, they get 1 song per "round" (round-robin)
  // 3) Ties are broken by earliest created_at of the next song

  const byTimes = new Map<number, Map<string, WaitlistEntry[]>>();

  for (const entry of waitingEntries) {
    const base = entry.times_sung ?? 0;
    const singerKey = normalizeSingerName(entry.singer_name);
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
    // Order singers by who signed up first (within this base bucket)
    const singerKeys = Array.from(group.keys()).sort((aKey, bKey) => {
      const aFirst = group.get(aKey)?.[0];
      const bFirst = group.get(bKey)?.[0];
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

    // Apply fair order only to regular entries (not coordinator insertions)
    const fair = forceRebalance ? buildFairOrder(regularEntries) : regularEntries;
    
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
    try {
      let query = supabase
        .from('waitlist')
        .select('*')
        .eq('status', 'waiting')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (instanceId) {
        query = query.eq('karaoke_instance_id', instanceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      const waiting = (data as WaitlistEntry[]) || [];
      const fair = await applyFairOrderIfNeeded(waiting, forceRebalance);
      setEntries(fair);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      let query = supabase
        .from('waitlist')
        .select('*')
        .eq('status', 'done')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (instanceId) {
        query = query.eq('karaoke_instance_id', instanceId);
      }

      const { data, error } = await query;

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

  const addToWaitlist = async (singerName: string, youtubeUrl: string, songTitle: string, registeredBy?: string, insertFirst = false) => {
    try {
      // Check rate limiting (skip for coordinator insertions that go first)
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

      // Get how many times this singer has sung before
      const { data: previousEntries } = await supabase
        .from('waitlist')
        .select('times_sung')
        .ilike('singer_name', singerName.trim())
        .order('times_sung', { ascending: false })
        .limit(1);

      const timesSung = previousEntries?.[0]?.times_sung || 0;

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

      // Increment times_sung for all waiting entries from this singer
      const { data: waitingEntries } = await supabase
        .from('waitlist')
        .select('id, times_sung, priority')
        .ilike('singer_name', singerName.trim())
        .eq('status', 'waiting');

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

  const getNextInQueue = (): WaitlistEntry | null => {
    return entries.length > 0 ? entries[0] : null;
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
    getNextInQueue, 
    refetch: fetchEntries 
  };
}
