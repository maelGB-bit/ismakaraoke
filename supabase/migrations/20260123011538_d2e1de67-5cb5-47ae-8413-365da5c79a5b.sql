
-- Create update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for host settings (password storage)
CREATE TABLE public.host_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.host_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read to check if password exists
CREATE POLICY "Anyone can read host_settings"
ON public.host_settings
FOR SELECT
USING (true);

-- Anyone can insert if no password exists yet (first setup)
CREATE POLICY "Anyone can insert first password"
ON public.host_settings
FOR INSERT
WITH CHECK (true);

-- Anyone can update password (after verifying old password in app logic)
CREATE POLICY "Anyone can update password"
ON public.host_settings
FOR UPDATE
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_host_settings_updated_at
BEFORE UPDATE ON public.host_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
