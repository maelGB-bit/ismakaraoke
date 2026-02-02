-- Add allow_voting column to performances table
-- This controls whether voting is enabled for each performance
ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS allow_voting boolean DEFAULT true;

-- Add a comment to explain the column
COMMENT ON COLUMN public.performances.allow_voting IS 'When false, voting is disabled for this performance and "Apresentação sem votação" is shown';