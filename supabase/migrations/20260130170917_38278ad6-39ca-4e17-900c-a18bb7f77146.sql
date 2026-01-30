-- Create table for site contact settings
CREATE TABLE public.site_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  label text NOT NULL,
  icon text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_contacts ENABLE ROW LEVEL SECURITY;

-- Anyone can read contacts
CREATE POLICY "Anyone can view site contacts"
ON public.site_contacts
FOR SELECT
USING (true);

-- Only admins can manage contacts
CREATE POLICY "Admins can manage site contacts"
ON public.site_contacts
FOR ALL
USING (is_admin());

-- Insert default contact entries
INSERT INTO public.site_contacts (key, value, label, icon) VALUES
  ('whatsapp', '', 'WhatsApp', 'message-circle'),
  ('instagram', '', 'Instagram', 'instagram'),
  ('email', '', 'Email', 'mail'),
  ('support', '', 'Suporte', 'help-circle');

-- Create trigger for updated_at
CREATE TRIGGER update_site_contacts_updated_at
BEFORE UPDATE ON public.site_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();