-- Create secure_secrets table to store API keys that admins can update
CREATE TABLE IF NOT EXISTS public.secure_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  encrypted_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.secure_secrets ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write secrets
CREATE POLICY "Admins can manage secrets"
  ON public.secure_secrets
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Add comment for documentation
COMMENT ON TABLE public.secure_secrets IS 'Stores API keys and secrets that can be updated by admins via the dashboard';