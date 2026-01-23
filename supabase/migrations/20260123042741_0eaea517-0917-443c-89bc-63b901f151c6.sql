-- Create waitlist table for queue management
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  singer_name TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  song_title TEXT NOT NULL,
  times_sung INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anyone can read/insert)
CREATE POLICY "Anyone can read waitlist" 
ON public.waitlist 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert to waitlist" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update waitlist" 
ON public.waitlist 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete from waitlist" 
ON public.waitlist 
FOR DELETE 
USING (true);

-- Enable realtime for waitlist
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;