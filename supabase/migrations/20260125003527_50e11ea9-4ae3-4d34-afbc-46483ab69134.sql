-- Create event_settings table to store registration open/closed state
CREATE TABLE public.event_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_open BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read event settings (needed to check if registration is open)
CREATE POLICY "Anyone can read event_settings" 
ON public.event_settings 
FOR SELECT 
USING (true);

-- Only hosts can update event settings
CREATE POLICY "Hosts can update event_settings" 
ON public.event_settings 
FOR UPDATE 
USING (public.is_host());

-- Only hosts can insert event settings (for initial setup)
CREATE POLICY "Hosts can insert event_settings" 
ON public.event_settings 
FOR INSERT 
WITH CHECK (public.is_host());

-- Insert default row (registration open by default)
INSERT INTO public.event_settings (registration_open) VALUES (true);

-- Enable realtime for event_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_settings;