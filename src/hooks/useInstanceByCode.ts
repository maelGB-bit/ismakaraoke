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

    const fetchInstance = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('karaoke_instances')
        .select('id, name, instance_code, status')
        .eq('instance_code', instanceCode)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching instance:', fetchError);
        setError('Instance not found');
        setInstance(null);
      } else if (!data) {
        setError('Instance not found');
        setInstance(null);
      } else if (data.status !== 'active') {
        setError('Instance is not active');
        setInstance(null);
      } else {
        setInstance(data);
      }
      
      setLoading(false);
    };

    fetchInstance();
  }, [instanceCode]);

  return { instance, loading, error };
}
