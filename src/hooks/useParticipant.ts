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
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('karaoke_instance_id', instanceId)
        .eq('device_id', deviceId)
        .maybeSingle();

      if (!error && data) {
        setParticipant(data as Participant);
      } else {
        setParticipant(null);
      }
      setLoading(false);
    };

    fetchParticipant();
  }, [instanceId, deviceId]);

  const registerParticipant = async (name: string, phone: string, email: string): Promise<{ success: boolean; error?: string }> => {
    if (!instanceId || !deviceId) {
      return { success: false, error: 'Dados da instância inválidos' };
    }

    try {
      const { data, error } = await supabase
        .from('participants')
        .insert({
          karaoke_instance_id: instanceId,
          device_id: deviceId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('email')) {
            return { success: false, error: 'Este email já está cadastrado neste evento' };
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
