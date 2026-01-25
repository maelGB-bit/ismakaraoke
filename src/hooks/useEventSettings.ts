import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EventSettings {
  id: string;
  registration_open: boolean;
  updated_at: string;
}

export function useEventSettings() {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('event_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching event settings:', error);
    } else if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const toggleRegistration = async () => {
    if (!settings) return false;
    
    const newValue = !settings.registration_open;
    const { error } = await supabase
      .from('event_settings')
      .update({ 
        registration_open: newValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', settings.id);

    if (error) {
      console.error('Error updating registration status:', error);
      return false;
    }
    
    // Optimistic update
    setSettings({ ...settings, registration_open: newValue });
    return true;
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('event_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_settings',
        },
        (payload) => {
          if (payload.new) {
            setSettings(payload.new as EventSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    settings,
    loading,
    isRegistrationOpen: settings?.registration_open ?? true,
    toggleRegistration,
  };
}
