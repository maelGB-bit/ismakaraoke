import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteVideo {
  id: string;
  key: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useSiteVideos() {
  return useQuery({
    queryKey: ['site-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_videos')
        .select('*')
        .order('key');
      
      if (error) throw error;
      return data as SiteVideo[];
    },
  });
}

export function useSiteVideo(key: string) {
  return useQuery({
    queryKey: ['site-video', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_videos')
        .select('*')
        .eq('key', key)
        .single();
      
      if (error) throw error;
      return data as SiteVideo;
    },
  });
}

export function useUpdateSiteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, youtube_url }: { id: string; youtube_url: string | null }) => {
      const { data, error } = await supabase
        .from('site_videos')
        .update({ youtube_url })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-videos'] });
      queryClient.invalidateQueries({ queryKey: ['site-video'] });
    },
  });
}
