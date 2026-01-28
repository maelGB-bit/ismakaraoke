import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Performance } from '@/types/karaoke';

export function useActivePerformance(instanceId?: string | null) {
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // IMPORTANT: Only fetch if we have a valid instanceId to avoid cross-instance data leakage
    if (!instanceId) {
      console.log('[useActivePerformance] No instanceId provided, skipping fetch');
      setPerformance(null);
      setLoading(false);
      return;
    }

    // Fetch initial active performance
    const fetchActive = async () => {
      console.log('[useActivePerformance] Fetching active performance for instanceId:', instanceId);
      const { data, error } = await supabase
        .from('performances')
        .select('*')
        .eq('status', 'ativa')
        .eq('karaoke_instance_id', instanceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setPerformance(data as Performance);
      }
      setLoading(false);
    };

    fetchActive();

    // Subscribe to realtime updates
    const channelName = `performances-${instanceId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performances',
          filter: `karaoke_instance_id=eq.${instanceId}`,
        },
        (payload) => {
          console.log('[useActivePerformance] Realtime event:', payload.eventType, payload.new);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newPerf = payload.new as Performance;
            if (newPerf.status === 'ativa') {
              // Always update when there's an active performance (handles video changes too)
              console.log('[useActivePerformance] Updating active performance:', newPerf.id, 'video_changed_at:', newPerf.video_changed_at);
              setPerformance(newPerf);
            } else {
              // Performance closed or changed status - refetch to get current active one
              console.log('[useActivePerformance] Performance status changed to:', newPerf.status);
              fetchActive();
            }
          } else if (payload.eventType === 'DELETE') {
            // Performance deleted - refetch
            fetchActive();
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
    // IMPORTANT: Only fetch if we have a valid instanceId
    if (!instanceId) {
      console.log('[useRanking] No instanceId provided, skipping fetch');
      setPerformances([]);
      setLoading(false);
      return;
    }

    const fetchRanking = async () => {
      console.log('[useRanking] Fetching ranking for instanceId:', instanceId);
      const { data, error } = await supabase
        .from('performances')
        .select('*')
        .eq('status', 'encerrada')
        .eq('karaoke_instance_id', instanceId)
        .order('nota_media', { ascending: false })
        .order('total_votos', { ascending: false });

      if (!error && data) {
        setPerformances(data as Performance[]);
      }
      setLoading(false);
    };

    fetchRanking();

    // Subscribe to realtime updates
    const channelName = `ranking-${instanceId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performances',
          filter: `karaoke_instance_id=eq.${instanceId}`,
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
