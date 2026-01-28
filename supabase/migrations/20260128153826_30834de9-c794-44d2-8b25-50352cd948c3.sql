-- Create participants table for voter registration
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  karaoke_instance_id UUID NOT NULL REFERENCES public.karaoke_instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(karaoke_instance_id, device_id),
  UNIQUE(karaoke_instance_id, email)
);

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Anyone can insert participants (for registration)
CREATE POLICY "Anyone can register as participant"
ON public.participants FOR INSERT
WITH CHECK (true);

-- Anyone can read participants by instance (for checking registration)
CREATE POLICY "Anyone can check registration"
ON public.participants FOR SELECT
USING (true);

-- Admins can delete participants
CREATE POLICY "Admins can delete participants"
ON public.participants FOR DELETE
USING (is_admin());

-- Coordinators can delete own instance participants
CREATE POLICY "Coordinators can delete own participants"
ON public.participants FOR DELETE
USING (karaoke_instance_id = get_user_instance_id());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;

-- Add index for faster lookups
CREATE INDEX idx_participants_instance ON public.participants(karaoke_instance_id);
CREATE INDEX idx_participants_device ON public.participants(karaoke_instance_id, device_id);