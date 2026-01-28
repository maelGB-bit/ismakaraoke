import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { KaraokeInstance } from '@/types/admin';

export function useKaraokeInstance(coordinatorId?: string) {
  const [instance, setInstance] = useState<KaraokeInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    console.log('[useKaraokeInstance] coordinatorId:', coordinatorId);
    
    if (!coordinatorId) {
      console.log('[useKaraokeInstance] No coordinatorId, setting loading false');
      setLoading(false);
      return;
    }

    const fetchInstance = async () => {
      console.log('[useKaraokeInstance] Fetching instance for:', coordinatorId);
      const { data, error } = await supabase
        .from('karaoke_instances')
        .select('*')
        .eq('coordinator_id', coordinatorId)
        .maybeSingle();

      console.log('[useKaraokeInstance] Query result:', { data, error });

      if (!error && data) {
        const inst = data as KaraokeInstance;
        setInstance(inst);
        
        // Check if subscription is expired
        if (inst.expires_at) {
          const expiresAt = new Date(inst.expires_at);
          setIsExpired(expiresAt < new Date());
        }
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
            const inst = payload.new as KaraokeInstance;
            setInstance(inst);
            
            if (inst.expires_at) {
              const expiresAt = new Date(inst.expires_at);
              setIsExpired(expiresAt < new Date());
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coordinatorId]);

  return { instance, loading, isExpired };
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
