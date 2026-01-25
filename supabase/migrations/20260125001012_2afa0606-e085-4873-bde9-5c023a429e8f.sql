-- Add video_changed_at column to track when the host changes the video/song
ALTER TABLE public.performances ADD COLUMN video_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;