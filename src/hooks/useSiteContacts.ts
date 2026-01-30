import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteContact {
  id: string;
  key: string;
  value: string | null;
  label: string;
  icon: string;
}

export function useSiteContacts() {
  const [contacts, setContacts] = useState<SiteContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('site_contacts')
        .select('*')
        .order('key');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching site contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const updateContact = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('site_contacts')
        .update({ value })
        .eq('key', key);

      if (error) throw error;
      
      // Update local state
      setContacts(prev => 
        prev.map(c => c.key === key ? { ...c, value } : c)
      );
      
      return true;
    } catch (error) {
      console.error('Error updating contact:', error);
      return false;
    }
  };

  const getContactValue = (key: string) => {
    return contacts.find(c => c.key === key)?.value || '';
  };

  return { contacts, loading, updateContact, getContactValue, refetch: fetchContacts };
}
