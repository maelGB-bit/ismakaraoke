-- Add last_access_at column to coordinator_requests table
ALTER TABLE public.coordinator_requests
ADD COLUMN last_access_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX idx_coordinator_requests_last_access ON public.coordinator_requests(last_access_at DESC);