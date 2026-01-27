import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Performance } from '@/types/karaoke';

export function useActivePerformance(instanceId?: string | null) {
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial active performance
    const fetchActive = async () => {
      let query = supabase
        .from('performances')
        .select('*')
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .limit(1);
      
      // Filter by instance if provided
      if (instanceId) {
        query = query.eq('karaoke_instance_id', instanceId);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        setPerformance(data as Performance);
      }
      setLoading(false);
    };

    fetchActive();

    // Subscribe to realtime updates
    const channelName = instanceId ? `performances-${instanceId}` : 'performances-realtime';
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performances',
          ...(instanceId ? { filter: `karaoke_instance_id=eq.${instanceId}` } : {}),
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newPerf = payload.new as Performance;
            if (newPerf.status === 'ativa') {
              setPerformance(newPerf);
            } else if (performance?.id === newPerf.id) {
              setPerformance(newPerf);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instanceId]);

  return { performance, loading, setPerformance };
}

export function usePerformanceById(id: string | null) {
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchPerformance = async () => {
      const { data, error } = await supabase
        .from('performances')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        setPerformance(data as Performance);
      }
      setLoading(false);
    };

    fetchPerformance();

    // Subscribe to realtime updates for this specific performance
    const channel = supabase
      .channel(`performance-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'performances',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setPerformance(payload.new as Performance);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  return { performance, loading };
}

export function useRanking(instanceId?: string | null) {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      let query = supabase
        .from('performances')
        .select('*')
        .eq('status', 'encerrada')
        .order('nota_media', { ascending: false })
        .order('total_votos', { ascending: false });
      
      if (instanceId) {
        query = query.eq('karaoke_instance_id', instanceId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setPerformances(data as Performance[]);
      }
      setLoading(false);
    };

    fetchRanking();

    // Subscribe to realtime updates
    const channelName = instanceId ? `ranking-${instanceId}` : 'ranking-realtime';
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performances',
          ...(instanceId ? { filter: `karaoke_instance_id=eq.${instanceId}` } : {}),
        },
        () => {
          fetchRanking();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instanceId]);

  return { performances, loading, refetch: () => {} };
}
