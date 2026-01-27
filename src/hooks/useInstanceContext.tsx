import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { KaraokeInstance } from '@/types/admin';

interface InstanceContextType {
  instance: KaraokeInstance | null;
  instanceId: string | null;
  loading: boolean;
  refetch: () => void;
}

const InstanceContext = createContext<InstanceContextType | null>(null);

export function useInstanceContext() {
  const context = useContext(InstanceContext);
  if (!context) {
    throw new Error('useInstanceContext must be used within InstanceProvider');
  }
  return context;
}

interface InstanceProviderProps {
  children: ReactNode;
  instanceCode?: string; // For public pages using URL param
  coordinatorId?: string; // For coordinator dashboard
}

export function InstanceProvider({ children, instanceCode, coordinatorId }: InstanceProviderProps) {
  const [instance, setInstance] = useState<KaraokeInstance | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInstance = async () => {
    setLoading(true);
    try {
      let query = supabase.from('karaoke_instances').select('*');
      
      if (instanceCode) {
        query = query.eq('instance_code', instanceCode);
      } else if (coordinatorId) {
        query = query.eq('coordinator_id', coordinatorId);
      } else {
        // No filter - for backwards compatibility, get any active instance
        query = query.eq('status', 'active').limit(1);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (!error && data) {
        setInstance(data as KaraokeInstance);
      }
    } catch (error) {
      console.error('Error fetching instance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstance();

    // Set up realtime subscription
    const filter = instanceCode 
      ? `instance_code=eq.${instanceCode}` 
      : coordinatorId 
        ? `coordinator_id=eq.${coordinatorId}` 
        : undefined;

    const channel = supabase
      .channel('instance-context')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'karaoke_instances',
          ...(filter ? { filter } : {}),
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
  }, [instanceCode, coordinatorId]);

  return (
    <InstanceContext.Provider value={{ 
      instance, 
      instanceId: instance?.id || null, 
      loading,
      refetch: fetchInstance 
    }}>
      {children}
    </InstanceContext.Provider>
  );
}
