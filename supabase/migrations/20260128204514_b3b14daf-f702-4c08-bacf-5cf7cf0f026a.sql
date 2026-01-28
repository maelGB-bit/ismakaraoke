-- Allow coordinators to update their own last_access_at
CREATE POLICY "Users can update own last_access"
ON public.coordinator_requests
FOR UPDATE
USING (email = get_user_email())
WITH CHECK (email = get_user_email());