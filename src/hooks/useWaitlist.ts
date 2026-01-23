import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';

export interface WaitlistEntry {
  id: string;
  singer_name: string;
  youtube_url: string;
  song_title: string;
  times_sung: number;
  status: string;
  created_at: string;
}

export function useWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('status', 'waiting')
        .order('times_sung', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel('waitlist-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist' }, () => { fetchEntries(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addToWaitlist = async (singerName: string, youtubeUrl: string, songTitle: string) => {
    try {
      const { data: previousEntries } = await supabase
        .from('waitlist')
        .select('times_sung')
        .eq('singer_name', singerName.toLowerCase().trim())
        .order('times_sung', { ascending: false })
        .limit(1);

      const timesSung = previousEntries?.[0]?.times_sung || 0;

      const { error } = await supabase.from('waitlist').insert({
        singer_name: singerName.trim(),
        youtube_url: youtubeUrl,
        song_title: songTitle,
        times_sung: timesSung,
        status: 'waiting',
      });

      if (error) throw error;
      toast({ title: t('signup.signupConfirmed'), description: t('signup.addedToQueue') });
      return true;
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast({ title: t('host.error'), description: t('signup.cantAddToList'), variant: 'destructive' });
      return false;
    }
  };

  const markAsSinging = async (entryId: string) => {
    try {
      const { error } = await supabase.from('waitlist').update({ status: 'singing' }).eq('id', entryId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating waitlist entry:', error);
    }
  };

  const markAsDone = async (entryId: string, singerName: string) => {
    try {
      const { error: updateError } = await supabase.from('waitlist').update({ status: 'done' }).eq('id', entryId);
      if (updateError) throw updateError;

      const { data: waitingEntries } = await supabase
        .from('waitlist')
        .select('id, times_sung')
        .eq('singer_name', singerName.toLowerCase().trim())
        .eq('status', 'waiting');

      if (waitingEntries && waitingEntries.length > 0) {
        for (const entry of waitingEntries) {
          await supabase.from('waitlist').update({ times_sung: entry.times_sung + 1 }).eq('id', entry.id);
        }
      }
    } catch (error) {
      console.error('Error marking as done:', error);
    }
  };

  const removeFromWaitlist = async (entryId: string) => {
    try {
      const { error } = await supabase.from('waitlist').delete().eq('id', entryId);
      if (error) throw error;
    } catch (error) {
      console.error('Error removing from waitlist:', error);
    }
  };

  const getNextInQueue = (): WaitlistEntry | null => {
    return entries.length > 0 ? entries[0] : null;
  };

  return { entries, loading, addToWaitlist, markAsSinging, markAsDone, removeFromWaitlist, getNextInQueue, refetch: fetchEntries };
}
