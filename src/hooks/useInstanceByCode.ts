import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InstanceData {
  id: string;
  name: string;
  instance_code: string;
  status: string;
}

export function useInstanceByCode(instanceCode?: string) {
  const [instance, setInstance] = useState<InstanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!instanceCode) {
      setLoading(false);
      setError('No instance code provided');
      return;
    }

    console.log('[useInstanceByCode] Fetching instance with code:', instanceCode);

    const fetchInstance = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('karaoke_instances')
        .select('id, name, instance_code, status')
        .eq('instance_code', instanceCode)
        .maybeSingle();

      console.log('[useInstanceByCode] Query result:', { data, fetchError, instanceCode });

      if (fetchError) {
        console.error('Error fetching instance:', fetchError);
        setError('Instance not found');
        setInstance(null);
      } else if (!data) {
        console.log('[useInstanceByCode] No data returned for instance code:', instanceCode);
        setError('Instance not found');
        setInstance(null);
      } else if (data.status !== 'active') {
        console.log('[useInstanceByCode] Instance not active:', data.status);
        setError('Instance is not active');
        setInstance(null);
      } else {
        console.log('[useInstanceByCode] Instance found successfully:', data);
        setInstance(data);
      }
      
      setLoading(false);
    };

    fetchInstance();
  }, [instanceCode]);

  return { instance, loading, error };
}
