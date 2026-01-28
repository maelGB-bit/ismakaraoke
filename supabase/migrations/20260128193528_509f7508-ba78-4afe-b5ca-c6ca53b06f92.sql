-- Create table for configurable YouTube videos
CREATE TABLE public.site_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_videos ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can view site videos" 
ON public.site_videos 
FOR SELECT 
USING (true);

-- Only admins can manage videos
CREATE POLICY "Admins can manage site videos" 
ON public.site_videos 
FOR ALL 
USING (public.is_admin());

-- Insert default video entries
INSERT INTO public.site_videos (key, title, description, youtube_url) VALUES
  ('hero_video', 'Vídeo Principal (Hero)', 'Vídeo exibido abaixo dos botões na página inicial', NULL),
  ('how_it_works', 'Veja Como Funciona', 'Vídeo da seção "Veja como funciona na prática"', NULL),
  ('tutorial_coordinator', 'Tutorial Coordenador', 'Vídeo explicativo para coordenadores na página de teste', NULL),
  ('tutorial_participant', 'Tutorial Participante', 'Vídeo explicativo para participantes na página de teste', NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_site_videos_updated_at
BEFORE UPDATE ON public.site_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();