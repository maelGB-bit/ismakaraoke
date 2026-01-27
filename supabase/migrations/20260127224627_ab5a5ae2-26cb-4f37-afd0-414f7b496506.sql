-- Create a secure function to get the current user's email
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view own request" ON public.coordinator_requests;

-- Recreate the policy using the secure function
CREATE POLICY "Users can view own request" 
ON public.coordinator_requests 
FOR SELECT 
USING (email = get_user_email());