-- Create view for monthly ranking (calculates global_score = nota_media * total_votos)
CREATE OR REPLACE VIEW public.monthly_ranking AS
SELECT 
  p.id,
  p.cantor,
  p.musica,
  p.nota_media,
  p.total_votos,
  COALESCE(p.nota_media * p.total_votos, 0) as global_score,
  p.created_at,
  ki.name as instance_name,
  ki.instance_code
FROM performances p
LEFT JOIN karaoke_instances ki ON p.karaoke_instance_id = ki.id
WHERE p.status = 'encerrada'
  AND p.created_at >= date_trunc('month', CURRENT_DATE)
  AND p.created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
  AND p.total_votos > 0
ORDER BY global_score DESC
LIMIT 30;

-- Create table to store event archives (rankings when events are closed)
CREATE TABLE IF NOT EXISTS public.event_archives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  karaoke_instance_id UUID REFERENCES public.karaoke_instances(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  instance_code TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  rankings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_archives ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view all event archives" 
ON public.event_archives 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Coordinators can view own event archives" 
ON public.event_archives 
FOR SELECT 
USING (is_coordinator() AND karaoke_instance_id = get_user_instance_id());

CREATE POLICY "Admins can manage event archives" 
ON public.event_archives 
FOR ALL 
USING (is_admin());

CREATE POLICY "Coordinators can insert own event archives" 
ON public.event_archives 
FOR INSERT 
WITH CHECK (is_coordinator() AND karaoke_instance_id = get_user_instance_id());

-- Create compiled participants view for admin
CREATE OR REPLACE VIEW public.compiled_participants AS
SELECT 
  p.id,
  p.name,
  p.phone,
  p.email,
  p.created_at as registration_date,
  p.karaoke_instance_id,
  ki.name as instance_name,
  ki.instance_code
FROM participants p
LEFT JOIN karaoke_instances ki ON p.karaoke_instance_id = ki.id
ORDER BY p.created_at DESC;