import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EventSettings {
  id: string;
  registration_open: boolean;
  updated_at: string;
  karaoke_instance_id: string | null;
}

export function useEventSettings(instanceId: string | null) {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!instanceId) {
      console.log('[useEventSettings] No instanceId, skipping fetch');
      setSettings(null);
      setLoading(false);
      return;
    }

    console.log('[useEventSettings] Fetching settings for instance:', instanceId);
    
    const { data, error } = await supabase
      .from('event_settings')
      .select('*')
      .eq('karaoke_instance_id', instanceId)
      .maybeSingle();

    if (error) {
      console.error('[useEventSettings] Error fetching:', error);
    } else if (data) {
      console.log('[useEventSettings] Found settings:', data);
      setSettings(data);
    } else {
      console.log('[useEventSettings] No settings found for instance, registration is open by default');
      // No settings found - registration is open by default
      setSettings(null);
    }
    setLoading(false);
  }, [instanceId]);

  const toggleRegistration = async () => {
    if (!instanceId) {
      console.error('[useEventSettings] Cannot toggle - no instanceId');
      return false;
    }
    
    const newValue = settings ? !settings.registration_open : false;
    
    console.log('[useEventSettings] Toggling registration to:', newValue, 'for instance:', instanceId);
    
    if (settings) {
      // Update existing settings
      const { error } = await supabase
        .from('event_settings')
        .update({ 
          registration_open: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) {
        console.error('[useEventSettings] Error updating:', error);
        return false;
      }
      
      setSettings({ ...settings, registration_open: newValue });
    } else {
      // Create new settings for this instance
      const { data, error } = await supabase
        .from('event_settings')
        .insert({ 
          registration_open: newValue,
          karaoke_instance_id: instanceId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[useEventSettings] Error inserting:', error);
        return false;
      }
      
      setSettings(data);
    }
    
    return true;
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!instanceId) return;

    // Subscribe to realtime changes for this instance
    const channel = supabase
      .channel(`event_settings_${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_settings',
          filter: `karaoke_instance_id=eq.${instanceId}`,
        },
        (payload) => {
          console.log('[useEventSettings] Realtime update:', payload);
          if (payload.new) {
            setSettings(payload.new as EventSettings);
          } else if (payload.eventType === 'DELETE') {
            setSettings(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instanceId]);

  return {
    settings,
    loading,
    // If no settings exist for this instance, registration is open by default
    isRegistrationOpen: settings?.registration_open ?? true,
    toggleRegistration,
  };
}
