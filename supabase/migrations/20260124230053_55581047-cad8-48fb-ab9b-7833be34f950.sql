-- Create an enum for user roles
CREATE TYPE public.app_role AS ENUM ('host', 'admin');

-- Create user_roles table for managing host access
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is a host (convenience function)
CREATE OR REPLACE FUNCTION public.is_host()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'host'
  )
$$;

-- RLS policies for user_roles table
-- Only hosts can view roles
CREATE POLICY "Hosts can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_host());

-- Only existing hosts can insert new roles
CREATE POLICY "Hosts can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_host());

-- Special policy: Allow first user to become host when no hosts exist
CREATE POLICY "First user becomes host"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'host')
);

-- Drop old host_settings policies that expose password hashes
DROP POLICY IF EXISTS "Anyone can insert first password" ON public.host_settings;
DROP POLICY IF EXISTS "Anyone can read host_settings" ON public.host_settings;
DROP POLICY IF EXISTS "Anyone can update password" ON public.host_settings;

-- No one should directly access host_settings anymore (legacy table)
CREATE POLICY "No direct access to host_settings"
ON public.host_settings FOR SELECT
USING (false);

CREATE POLICY "No direct insert to host_settings"
ON public.host_settings FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct update to host_settings"
ON public.host_settings FOR UPDATE
USING (false);

-- Update performances policies - keep SELECT public, restrict modifications to hosts
DROP POLICY IF EXISTS "Anyone can delete performances" ON public.performances;
DROP POLICY IF EXISTS "Anyone can insert performances" ON public.performances;
DROP POLICY IF EXISTS "Anyone can update performances" ON public.performances;

-- Keep read access public for viewers
-- The "Anyone can read performances" policy already exists and allows public read

-- Only hosts can insert performances
CREATE POLICY "Hosts can insert performances"
ON public.performances FOR INSERT
TO authenticated
WITH CHECK (public.is_host());

-- Only hosts can update performances
CREATE POLICY "Hosts can update performances"
ON public.performances FOR UPDATE
TO authenticated
USING (public.is_host());

-- Only hosts can delete performances
CREATE POLICY "Hosts can delete performances"
ON public.performances FOR DELETE
TO authenticated
USING (public.is_host());

-- Update waitlist policies - keep SELECT public, restrict modifications
DROP POLICY IF EXISTS "Anyone can delete from waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can update waitlist" ON public.waitlist;
-- Keep "Anyone can insert to waitlist" for user signups
-- Keep "Anyone can read waitlist" for public viewing

-- Only hosts can update waitlist (status changes, etc)
CREATE POLICY "Hosts can update waitlist"
ON public.waitlist FOR UPDATE
TO authenticated
USING (public.is_host());

-- Only hosts can delete from waitlist
CREATE POLICY "Hosts can delete from waitlist"
ON public.waitlist FOR DELETE
TO authenticated
USING (public.is_host());