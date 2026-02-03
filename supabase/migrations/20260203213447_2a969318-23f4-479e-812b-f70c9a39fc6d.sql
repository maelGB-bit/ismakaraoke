
-- Add DELETE policy for admins on user_roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (is_admin());

-- Add DELETE policy for hosts on user_roles  
CREATE POLICY "Hosts can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (is_host());
