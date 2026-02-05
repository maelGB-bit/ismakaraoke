import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Participant {
  id: string;
  karaoke_instance_id: string;
  name: string;
  phone: string;
  email: string;
  device_id: string;
  created_at: string;
}

export function useParticipant(instanceId: string | null, deviceId: string | null) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instanceId || !deviceId) {
      setParticipant(null);
      setLoading(false);
      return;
    }

    const fetchParticipant = async () => {
      setLoading(true);
      
      // First try to find by device_id
      const { data: byDevice, error: deviceError } = await supabase
        .from('participants')
        .select('*')
        .eq('karaoke_instance_id', instanceId)
        .eq('device_id', deviceId)
        .maybeSingle();

      if (!deviceError && byDevice) {
        setParticipant(byDevice as Participant);
        setLoading(false);
        return;
      }

      // If not found by device, check localStorage for email and try to find by email
      try {
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          if (profile.email) {
            const { data: byEmail, error: emailError } = await supabase
              .from('participants')
              .select('*')
              .eq('karaoke_instance_id', instanceId)
              .eq('email', profile.email.trim().toLowerCase())
              .maybeSingle();

            if (!emailError && byEmail) {
              // Found by email - this user is already registered, just with different device
              // We'll treat them as registered and show them in the system
              setParticipant(byEmail as Participant);
              setLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        console.error('Error checking localStorage for email:', e);
      }

      setParticipant(null);
      setLoading(false);
    };

    fetchParticipant();
  }, [instanceId, deviceId]);

  const registerParticipant = async (name: string, phone: string, email: string): Promise<{ success: boolean; error?: string }> => {
    if (!instanceId || !deviceId) {
      return { success: false, error: 'Dados da instância inválidos' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // First check if email already exists for this instance
      const { data: existingByEmail } = await supabase
        .from('participants')
        .select('*')
        .eq('karaoke_instance_id', instanceId)
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingByEmail) {
        // Email already registered - treat as success and set participant
        setParticipant(existingByEmail as Participant);
        return { success: true };
      }

      // Check if device already has a registration
      const { data: existingByDevice } = await supabase
        .from('participants')
        .select('*')
        .eq('karaoke_instance_id', instanceId)
        .eq('device_id', deviceId)
        .maybeSingle();

      if (existingByDevice) {
        // Device already registered - treat as success
        setParticipant(existingByDevice as Participant);
        return { success: true };
      }

      // No existing registration - create new
      const { data, error } = await supabase
        .from('participants')
        .insert({
          karaoke_instance_id: instanceId,
          device_id: deviceId,
          name: name.trim(),
          phone: phone.trim(),
          email: normalizedEmail,
        })
        .select()
        .single();

      if (error) {
        // Handle race condition - if email constraint fails, fetch the existing record
        if (error.code === '23505') {
          if (error.message.includes('email')) {
            // Race condition - email was just registered, fetch it
            const { data: raceParticipant } = await supabase
              .from('participants')
              .select('*')
              .eq('karaoke_instance_id', instanceId)
              .eq('email', normalizedEmail)
              .maybeSingle();

            if (raceParticipant) {
              setParticipant(raceParticipant as Participant);
              return { success: true };
            }
            return { success: false, error: 'Este email já está cadastrado neste evento' };
          }
          // Device constraint violation - also check for race condition
          const { data: raceDevice } = await supabase
            .from('participants')
            .select('*')
            .eq('karaoke_instance_id', instanceId)
            .eq('device_id', deviceId)
            .maybeSingle();

          if (raceDevice) {
            setParticipant(raceDevice as Participant);
            return { success: true };
          }
          return { success: false, error: 'Este dispositivo já está cadastrado neste evento' };
        }
        return { success: false, error: error.message };
      }

      setParticipant(data as Participant);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erro ao registrar participante' };
    }
  };

  return { participant, loading, registerParticipant };
}

export function useInstanceParticipants(instanceId: string | null) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instanceId) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    const fetchParticipants = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('karaoke_instance_id', instanceId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setParticipants(data as Participant[]);
      }
      setLoading(false);
    };

    fetchParticipants();
  }, [instanceId]);

  return { participants, loading };
}
