-- Add button_name column to instruction_videos
ALTER TABLE public.instruction_videos 
ADD COLUMN IF NOT EXISTS button_name TEXT NOT NULL DEFAULT 'Assistir';

-- Update existing rows to have a default button name based on title
UPDATE public.instruction_videos
SET button_name = 'Assistir'
WHERE button_name IS NULL OR button_name = '';