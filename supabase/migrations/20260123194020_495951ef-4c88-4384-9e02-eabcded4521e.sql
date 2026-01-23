-- Add priority column to waitlist for manual ordering by host
ALTER TABLE public.waitlist ADD COLUMN priority integer NOT NULL DEFAULT 0;

-- Create index for efficient ordering
CREATE INDEX idx_waitlist_priority ON public.waitlist(priority ASC, times_sung ASC, created_at ASC);