import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HeroCarouselSlide {
  id: string;
  title: string | null;
  desktop_image_url: string;
  tablet_image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteImage {
  id: string;
  key: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

// Hero Carousel Hooks
export function useHeroCarouselSlides() {
  return useQuery({
    queryKey: ['hero-carousel-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_carousel_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as HeroCarouselSlide[];
    },
  });
}

export function useAllHeroCarouselSlides() {
  return useQuery({
    queryKey: ['hero-carousel-slides-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_carousel_slides')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as HeroCarouselSlide[];
    },
  });
}

export function useCreateHeroSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slide: Omit<HeroCarouselSlide, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hero_carousel_slides')
        .insert(slide)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-carousel-slides'] });
      queryClient.invalidateQueries({ queryKey: ['hero-carousel-slides-all'] });
    },
  });
}

export function useUpdateHeroSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HeroCarouselSlide> & { id: string }) => {
      const { data, error } = await supabase
        .from('hero_carousel_slides')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-carousel-slides'] });
      queryClient.invalidateQueries({ queryKey: ['hero-carousel-slides-all'] });
    },
  });
}

export function useDeleteHeroSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hero_carousel_slides')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-carousel-slides'] });
      queryClient.invalidateQueries({ queryKey: ['hero-carousel-slides-all'] });
    },
  });
}

// Site Images Hooks
export function useSiteImages() {
  return useQuery({
    queryKey: ['site-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_images')
        .select('*')
        .order('key');
      
      if (error) throw error;
      return data as SiteImage[];
    },
  });
}

export function useSiteImage(key: string) {
  return useQuery({
    queryKey: ['site-image', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_images')
        .select('*')
        .eq('key', key)
        .single();
      
      if (error) throw error;
      return data as SiteImage;
    },
  });
}

export function useUpdateSiteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, image_url }: { id: string; image_url: string | null }) => {
      const { data, error } = await supabase
        .from('site_images')
        .update({ image_url })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-images'] });
      queryClient.invalidateQueries({ queryKey: ['site-image'] });
    },
  });
}

// Upload helper
export async function uploadSiteImage(file: File, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('site-images')
    .upload(path, file, { upsert: true });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('site-images')
    .getPublicUrl(data.path);
  
  return publicUrl;
}
