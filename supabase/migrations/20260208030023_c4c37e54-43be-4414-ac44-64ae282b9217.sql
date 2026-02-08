-- Add session boundary timestamp to event_settings
-- This marks when the current session/event started
-- After a reset, only performances created after this timestamp count for the fair queue

ALTER TABLE public.event_settings 
ADD COLUMN session_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Update existing rows to have session_started_at = now() so they start fresh
UPDATE public.event_settings SET session_started_at = now();