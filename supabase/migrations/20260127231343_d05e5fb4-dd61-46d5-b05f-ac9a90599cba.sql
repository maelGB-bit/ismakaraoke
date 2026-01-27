-- Add temp_password column to coordinator_requests to store the temporary password
ALTER TABLE public.coordinator_requests 
ADD COLUMN IF NOT EXISTS temp_password TEXT;