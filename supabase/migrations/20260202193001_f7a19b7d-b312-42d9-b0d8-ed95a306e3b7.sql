-- Add allow_voting column to waitlist table
-- This controls whether voting is enabled for each performance entry
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS allow_voting boolean DEFAULT true;

-- Add a comment to explain the column
COMMENT ON COLUMN public.waitlist.allow_voting IS 'When false, voting is disabled for this performance entry';