-- Create performances (rodadas) table
CREATE TABLE public.performances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cantor TEXT NOT NULL,
  musica TEXT NOT NULL,
  youtube_url TEXT,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'encerrada')),
  nota_media NUMERIC(3, 1) DEFAULT 0,
  total_votos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  performance_id UUID NOT NULL REFERENCES public.performances(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota >= 0 AND nota <= 10),
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(performance_id, device_id)
);

-- Enable RLS but allow public access (no auth needed for karaoke voting)
ALTER TABLE public.performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for performances (public access)
CREATE POLICY "Anyone can read performances" 
ON public.performances FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert performances" 
ON public.performances FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update performances" 
ON public.performances FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete performances" 
ON public.performances FOR DELETE 
USING (true);

-- RLS policies for votes (public access)
CREATE POLICY "Anyone can read votes" 
ON public.votes FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert votes" 
ON public.votes FOR INSERT 
WITH CHECK (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.performances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- Function to update performance stats when a vote is added
CREATE OR REPLACE FUNCTION public.update_performance_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.performances
  SET 
    total_votos = (SELECT COUNT(*) FROM public.votes WHERE performance_id = NEW.performance_id),
    nota_media = (SELECT ROUND(AVG(nota)::numeric, 1) FROM public.votes WHERE performance_id = NEW.performance_id)
  WHERE id = NEW.performance_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update stats on new vote
CREATE TRIGGER on_vote_insert
AFTER INSERT ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.update_performance_stats();