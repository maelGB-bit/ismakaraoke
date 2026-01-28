-- Add IP address column to coordinator_requests
ALTER TABLE public.coordinator_requests 
ADD COLUMN IF NOT EXISTS ip_address text;

-- Add 'duplicado' status to the enum
ALTER TYPE public.coordinator_request_status ADD VALUE IF NOT EXISTS 'duplicado';

-- Create index for IP lookups
CREATE INDEX IF NOT EXISTS idx_coordinator_requests_ip ON public.coordinator_requests(ip_address);