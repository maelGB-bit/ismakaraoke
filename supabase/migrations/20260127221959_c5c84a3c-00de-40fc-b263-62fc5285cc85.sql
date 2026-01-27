-- Create enum for subscription interest types
CREATE TYPE public.subscription_interest AS ENUM ('single_event', 'weekly', 'monthly', 'yearly');

-- Create enum for coordinator request status
CREATE TYPE public.coordinator_request_status AS ENUM ('pending', 'approved', 'expired', 'rejected');

-- Create table for coordinator requests/registrations
CREATE TABLE public.coordinator_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  interest subscription_interest NOT NULL,
  status coordinator_request_status NOT NULL DEFAULT 'pending',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  instance_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coordinator_requests ENABLE ROW LEVEL SECURITY;

-- Policies for coordinator_requests
CREATE POLICY "Anyone can insert coordinator requests"
ON public.coordinator_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all coordinator requests"
ON public.coordinator_requests
FOR SELECT
USING (is_admin());

CREATE POLICY "Users can view own request"
ON public.coordinator_requests
FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can update coordinator requests"
ON public.coordinator_requests
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete coordinator requests"
ON public.coordinator_requests
FOR DELETE
USING (is_admin());

-- Add expires_at column to karaoke_instances for tracking subscription expiration
ALTER TABLE public.karaoke_instances 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Trigger to update updated_at
CREATE TRIGGER update_coordinator_requests_updated_at
BEFORE UPDATE ON public.coordinator_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();