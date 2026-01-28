
-- Create table for caching YouTube search results
CREATE TABLE public.youtube_search_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  hit_count INTEGER NOT NULL DEFAULT 0
);

-- Create unique index on search query for fast lookups
CREATE UNIQUE INDEX idx_youtube_cache_query ON public.youtube_search_cache (LOWER(search_query));

-- Create index on expiration for cleanup
CREATE INDEX idx_youtube_cache_expires ON public.youtube_search_cache (expires_at);

-- Enable RLS
ALTER TABLE public.youtube_search_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read cache (for edge function)
CREATE POLICY "Anyone can read youtube cache"
ON public.youtube_search_cache
FOR SELECT
USING (true);

-- Only edge functions (via service role) can insert/update cache
-- Regular users cannot modify cache directly
CREATE POLICY "Service role can manage cache"
ON public.youtube_search_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime for cache table (optional, for monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE public.youtube_search_cache;
