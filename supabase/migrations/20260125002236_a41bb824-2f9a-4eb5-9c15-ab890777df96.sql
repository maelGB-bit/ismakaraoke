-- Allow hosts to delete votes (needed when they change the song mid-performance)
CREATE POLICY "Hosts can delete votes" 
ON public.votes 
FOR DELETE 
USING (public.is_host());