-- Create storage bucket for site images
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to site-images
CREATE POLICY "Public can view site images"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-images');

-- Only admins can upload/update/delete site images
CREATE POLICY "Admins can upload site images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-images' AND public.is_admin());

CREATE POLICY "Admins can update site images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-images' AND public.is_admin());

CREATE POLICY "Admins can delete site images"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-images' AND public.is_admin());

-- Create table for hero banner carousel slides
CREATE TABLE public.hero_carousel_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  desktop_image_url TEXT NOT NULL,
  tablet_image_url TEXT,
  mobile_image_url TEXT,
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_carousel_slides ENABLE ROW LEVEL SECURITY;

-- Anyone can view active slides
CREATE POLICY "Anyone can view active slides"
ON public.hero_carousel_slides FOR SELECT
USING (is_active = true);

-- Admins can manage all slides
CREATE POLICY "Admins can manage slides"
ON public.hero_carousel_slides FOR ALL
USING (public.is_admin());

-- Create table for site images (logo, other assets)
CREATE TABLE public.site_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view site images
CREATE POLICY "Anyone can view site images"
ON public.site_images FOR SELECT
USING (true);

-- Admins can manage site images
CREATE POLICY "Admins can manage site images"
ON public.site_images FOR ALL
USING (public.is_admin());

-- Insert default site image entries
INSERT INTO public.site_images (key, title, description) VALUES
  ('logo', 'Logo Principal', 'Logo exibida no cabeçalho e rodapé do site'),
  ('favicon', 'Favicon', 'Ícone exibido na aba do navegador');

-- Trigger to update updated_at
CREATE TRIGGER update_hero_carousel_slides_updated_at
  BEFORE UPDATE ON public.hero_carousel_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_images_updated_at
  BEFORE UPDATE ON public.site_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();