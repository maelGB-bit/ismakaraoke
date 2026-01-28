-- Drop existing policies and recreate with correct logic
DROP POLICY IF EXISTS "Anyone can read event_settings" ON public.event_settings;
DROP POLICY IF EXISTS "Coordinators can update own event_settings" ON public.event_settings;
DROP POLICY IF EXISTS "Coordinators can insert own event_settings" ON public.event_settings;
DROP POLICY IF EXISTS "Admins can manage event_settings" ON public.event_settings;

-- Anyone can read event_settings (needed for participants to check if registration is open)
CREATE POLICY "Anyone can read event_settings" 
ON public.event_settings FOR SELECT 
USING (true);

-- Coordinators can insert settings for their own instance
-- The karaoke_instance_id in the INSERT must match the user's instance
CREATE POLICY "Coordinators can insert own event_settings" 
ON public.event_settings FOR INSERT 
WITH CHECK (
  is_admin() OR 
  is_coordinator() AND karaoke_instance_id = get_user_instance_id()
);

-- Coordinators can update settings for their own instance
CREATE POLICY "Coordinators can update own event_settings" 
ON public.event_settings FOR UPDATE 
USING (
  is_admin() OR 
  is_coordinator() AND karaoke_instance_id = get_user_instance_id()
);

-- Coordinators can delete settings for their own instance  
CREATE POLICY "Coordinators can delete own event_settings"
ON public.event_settings FOR DELETE
USING (
  is_admin() OR 
  is_coordinator() AND karaoke_instance_id = get_user_instance_id()
);