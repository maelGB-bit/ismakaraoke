-- Create a function to check if any hosts/coordinators exist (for login form logic)
-- This is safe to be public because it only returns a boolean, not user data
CREATE OR REPLACE FUNCTION public.has_any_hosts()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role IN ('host', 'coordinator')
  )
$$;