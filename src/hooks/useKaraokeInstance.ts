import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { KaraokeInstance } from '@/types/admin';

export function useKaraokeInstance(coordinatorId?: string) {
  const [instance, setInstance] = useState<KaraokeInstance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coordinatorId) {
      setLoading(false);
      return;
    }

    const fetchInstance = async () => {
      const { data, error } = await supabase
        .from('karaoke_instances')
        .select('*')
        .eq('coordinator_id', coordinatorId)
        .maybeSingle();

      if (!error && data) {
        setInstance(data as KaraokeInstance);
      }
      setLoading(false);
    };

    fetchInstance();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`instance-${coordinatorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'karaoke_instances',
          filter: `coordinator_id=eq.${coordinatorId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setInstance(null);
          } else {
            setInstance(payload.new as KaraokeInstance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coordinatorId]);

  return { instance, loading };
}

export function useAllInstances() {
  const [instances, setInstances] = useState<KaraokeInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstances = async () => {
    const { data, error } = await supabase
      .from('karaoke_instances')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setInstances(data as KaraokeInstance[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInstances();

    const channel = supabase
      .channel('all-instances')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'karaoke_instances',
        },
        () => {
          fetchInstances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { instances, loading, refetch: fetchInstances };
}
