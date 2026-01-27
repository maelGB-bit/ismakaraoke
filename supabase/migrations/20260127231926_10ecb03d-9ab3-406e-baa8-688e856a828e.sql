-- Add columns for password management
ALTER TABLE public.coordinator_requests 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS current_password TEXT;

-- Update existing approved requests
UPDATE public.coordinator_requests 
SET must_change_password = false 
WHERE status = 'approved' AND must_change_password IS NULL;