-- Create api_keys table for managing API keys
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create karaoke_instances table
CREATE TABLE public.karaoke_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  instance_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add karaoke_instance_id to performances table
ALTER TABLE public.performances 
ADD COLUMN karaoke_instance_id UUID REFERENCES public.karaoke_instances(id) ON DELETE CASCADE;

-- Add karaoke_instance_id to waitlist table
ALTER TABLE public.waitlist 
ADD COLUMN karaoke_instance_id UUID REFERENCES public.karaoke_instances(id) ON DELETE CASCADE;

-- Add karaoke_instance_id to votes table (for direct querying)
ALTER TABLE public.votes 
ADD COLUMN karaoke_instance_id UUID REFERENCES public.karaoke_instances(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karaoke_instances ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
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
      AND role = 'admin'
  )
$$;

-- Create function to check if user is coordinator
CREATE OR REPLACE FUNCTION public.is_coordinator()
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
      AND role = 'coordinator'
  )
$$;

-- Create function to get user's karaoke instance id
CREATE OR REPLACE FUNCTION public.get_user_instance_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.karaoke_instances 
  WHERE coordinator_id = auth.uid()
  LIMIT 1
$$;

-- API Keys policies (admin only)
CREATE POLICY "Admins can view api_keys" ON public.api_keys
FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert api_keys" ON public.api_keys
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update api_keys" ON public.api_keys
FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete api_keys" ON public.api_keys
FOR DELETE USING (is_admin());

-- Karaoke Instances policies
CREATE POLICY "Admins can view all instances" ON public.karaoke_instances
FOR SELECT USING (is_admin());

CREATE POLICY "Coordinators can view own instance" ON public.karaoke_instances
FOR SELECT USING (coordinator_id = auth.uid());

CREATE POLICY "Admins can insert instances" ON public.karaoke_instances
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update all instances" ON public.karaoke_instances
FOR UPDATE USING (is_admin());

CREATE POLICY "Coordinators can update own instance" ON public.karaoke_instances
FOR UPDATE USING (coordinator_id = auth.uid());

CREATE POLICY "Admins can delete instances" ON public.karaoke_instances
FOR DELETE USING (is_admin());

-- Update user_roles policies to allow admins to manage coordinators
CREATE POLICY "Admins can insert any role" ON public.user_roles
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

-- Create updated_at trigger for new tables
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_karaoke_instances_updated_at
BEFORE UPDATE ON public.karaoke_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime for karaoke_instances
ALTER PUBLICATION supabase_realtime ADD TABLE public.karaoke_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.api_keys;