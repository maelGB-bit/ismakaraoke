-- Create function to update performance statistics when votes are added/deleted
CREATE OR REPLACE FUNCTION public.update_performance_stats()
RETURNS TRIGGER AS $$
DECLARE
  perf_id uuid;
BEGIN
  -- Determine which performance to update
  IF TG_OP = 'DELETE' THEN
    perf_id := OLD.performance_id;
  ELSE
    perf_id := NEW.performance_id;
  END IF;
  
  -- Update the performance with calculated stats
  UPDATE public.performances
  SET 
    nota_media = COALESCE((
      SELECT AVG(nota)::numeric(3,1)
      FROM public.votes
      WHERE performance_id = perf_id
    ), 0),
    total_votos = COALESCE((
      SELECT COUNT(*)::integer
      FROM public.votes
      WHERE performance_id = perf_id
    ), 0)
  WHERE id = perf_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for INSERT on votes
CREATE TRIGGER trigger_update_performance_stats_insert
AFTER INSERT ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.update_performance_stats();

-- Create trigger for DELETE on votes
CREATE TRIGGER trigger_update_performance_stats_delete
AFTER DELETE ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.update_performance_stats();

-- Create trigger for UPDATE on votes (in case vote is changed)
CREATE TRIGGER trigger_update_performance_stats_update
AFTER UPDATE ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.update_performance_stats();