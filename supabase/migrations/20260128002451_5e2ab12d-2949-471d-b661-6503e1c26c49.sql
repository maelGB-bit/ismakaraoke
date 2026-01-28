-- Allow public users to view active instances (needed for voting/registration pages)
CREATE POLICY "Public can view active instances" 
ON public.karaoke_instances 
FOR SELECT 
USING (status = 'active');