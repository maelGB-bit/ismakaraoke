-- Fix security definer views by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.monthly_ranking;
DROP VIEW IF EXISTS public.compiled_participants;

-- Recreate monthly_ranking view with SECURITY INVOKER
CREATE VIEW public.monthly_ranking
WITH (security_invoker = on)
AS
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

-- Recreate compiled_participants view with SECURITY INVOKER
CREATE VIEW public.compiled_participants
WITH (security_invoker = on)
AS
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