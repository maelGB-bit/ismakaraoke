
-- ===========================================
-- FIX 1: participants table - restrict public SELECT, add RPC for device lookup
-- ===========================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can check registration" ON public.participants;

-- Admins can read all participants
CREATE POLICY "Admins can read all participants"
ON public.participants FOR SELECT
TO public
USING (is_admin());

-- Coordinators can read own instance participants
CREATE POLICY "Coordinators can read own participants"
ON public.participants FOR SELECT
TO public
USING (is_coordinator() AND karaoke_instance_id = get_user_instance_id());

-- RPC: lookup participant by device_id (for anonymous participant self-check)
CREATE OR REPLACE FUNCTION public.get_participant_by_device(
  _instance_id uuid,
  _device_id text
)
RETURNS SETOF public.participants
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.participants
  WHERE karaoke_instance_id = _instance_id
    AND device_id = _device_id
  LIMIT 1;
$$;

-- RPC: lookup participant by email (for cross-device recognition)
CREATE OR REPLACE FUNCTION public.get_participant_by_email(
  _instance_id uuid,
  _email text
)
RETURNS SETOF public.participants
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.participants
  WHERE karaoke_instance_id = _instance_id
    AND email = lower(trim(_email))
  LIMIT 1;
$$;

-- ===========================================
-- FIX 2: user_roles - remove privilege escalation vector
-- ===========================================
DROP POLICY IF EXISTS "First user becomes host" ON public.user_roles;
