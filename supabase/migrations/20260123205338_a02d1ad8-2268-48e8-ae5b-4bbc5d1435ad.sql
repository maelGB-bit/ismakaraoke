-- Add registered_by column to track who registered each entry
ALTER TABLE public.waitlist 
ADD COLUMN registered_by TEXT;