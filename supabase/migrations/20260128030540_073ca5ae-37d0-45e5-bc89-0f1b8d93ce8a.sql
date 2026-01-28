-- Add instance-specific registration settings
ALTER TABLE public.event_settings 
ADD COLUMN IF NOT EXISTS karaoke_instance_id uuid REFERENCES public.karaoke_instances(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_settings_instance ON public.event_settings(karaoke_instance_id);

-- Update RLS policies to be instance-aware
DROP POLICY IF EXISTS "Anyone can read event_settings" ON public.event_settings;
DROP POLICY IF EXISTS "Hosts can update event_settings" ON public.event_settings;
DROP POLICY IF EXISTS "Hosts can insert event_settings" ON public.event_settings;

-- Anyone can read settings for any instance (needed for participants)
CREATE POLICY "Anyone can read event_settings" 
ON public.event_settings FOR SELECT 
USING (true);

-- Coordinators can update settings for their own instance
CREATE POLICY "Coordinators can update own event_settings" 
ON public.event_settings FOR UPDATE 
USING (karaoke_instance_id = get_user_instance_id() OR is_admin());

-- Coordinators can insert settings for their own instance
CREATE POLICY "Coordinators can insert own event_settings" 
ON public.event_settings FOR INSERT 
WITH CHECK (karaoke_instance_id = get_user_instance_id() OR is_admin());

-- Admins can do everything
CREATE POLICY "Admins can manage event_settings" 
ON public.event_settings FOR ALL 
USING (is_admin());