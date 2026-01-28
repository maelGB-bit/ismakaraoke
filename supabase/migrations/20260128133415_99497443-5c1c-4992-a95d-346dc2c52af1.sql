-- Allow anyone to delete their own entries from waitlist
-- This is needed for the "Vou embora" button on participant pages (Vote, Inscricao)
-- The application code in LeaveButton.tsx filters by singer_name to ensure users only delete their own songs
CREATE POLICY "Anyone can delete from waitlist" 
ON public.waitlist FOR DELETE 
USING (true);