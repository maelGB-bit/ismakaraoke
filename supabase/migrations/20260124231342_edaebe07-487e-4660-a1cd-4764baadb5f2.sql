-- Enable realtime for performances table to receive vote updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.performances;