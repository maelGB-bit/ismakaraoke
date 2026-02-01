import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InstructionVideo {
  id: string;
  title: string;
  youtube_url: string;
  duration_seconds: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstructionVideoSettings {
  id: string;
  insertion_frequency: number;
  current_video_index: number;
  updated_at: string;
}

export function useInstructionVideos() {
  return useQuery({
    queryKey: ['instruction-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instruction_videos')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as InstructionVideo[];
    },
  });
}

export function useInstructionVideoSettings() {
  return useQuery({
    queryKey: ['instruction-video-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instruction_video_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as InstructionVideoSettings | null;
    },
  });
}

export function useCreateInstructionVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (video: Omit<InstructionVideo, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('instruction_videos')
        .insert(video)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruction-videos'] });
    },
  });
}

export function useUpdateInstructionVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InstructionVideo> & { id: string }) => {
      const { data, error } = await supabase
        .from('instruction_videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruction-videos'] });
    },
  });
}

export function useDeleteInstructionVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('instruction_videos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruction-videos'] });
    },
  });
}

export function useUpdateInstructionVideoSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<InstructionVideoSettings>) => {
      // First check if settings exist
      const { data: existing } = await supabase
        .from('instruction_video_settings')
        .select('id')
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('instruction_video_settings')
          .update(settings)
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('instruction_video_settings')
          .insert({
            insertion_frequency: settings.insertion_frequency ?? 3,
            current_video_index: settings.current_video_index ?? 0,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruction-video-settings'] });
    },
  });
}
