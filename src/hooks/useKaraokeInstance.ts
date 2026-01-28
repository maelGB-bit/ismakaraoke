import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { KaraokeInstance } from '@/types/admin';

interface UseKaraokeInstanceOptions {
  coordinatorId?: string;
  instanceCode?: string;
}

export function useKaraokeInstance(coordinatorIdOrOptions?: string | UseKaraokeInstanceOptions, instanceCode?: string) {
  const [instance, setInstance] = useState<KaraokeInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  // Handle both old API (coordinatorId) and new API (options object or two params)
  let coordinatorId: string | undefined;
  let code: string | undefined;
  
  if (typeof coordinatorIdOrOptions === 'object') {
    coordinatorId = coordinatorIdOrOptions.coordinatorId;
    code = coordinatorIdOrOptions.instanceCode;
  } else {
    coordinatorId = coordinatorIdOrOptions;
    code = instanceCode;
  }

  useEffect(() => {
    console.log('[useKaraokeInstance] coordinatorId:', coordinatorId, 'instanceCode:', code);
    
    // Need either coordinatorId or instanceCode
    if (!coordinatorId && !code) {
      console.log('[useKaraokeInstance] No coordinatorId or instanceCode, setting loading false');
      setLoading(false);
      return;
    }

    const fetchInstance = async () => {
      console.log('[useKaraokeInstance] Fetching instance for:', { coordinatorId, code });
      
      let query = supabase.from('karaoke_instances').select('*');
      
      if (code) {
        // Fetch by instance code (for admin access)
        query = query.eq('instance_code', code);
      } else if (coordinatorId) {
        // Fetch by coordinator ID (for coordinator access)
        query = query.eq('coordinator_id', coordinatorId);
      }
      
      const { data, error } = await query.maybeSingle();

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
    const filter = code 
      ? `instance_code=eq.${code}` 
      : `coordinator_id=eq.${coordinatorId}`;
    
    const channelName = code ? `instance-code-${code}` : `instance-${coordinatorId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'karaoke_instances',
          filter,
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
  }, [coordinatorId, code]);

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
