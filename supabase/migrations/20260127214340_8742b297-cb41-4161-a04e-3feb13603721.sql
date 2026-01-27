-- Update performances policies for instance isolation
DROP POLICY IF EXISTS "Anyone can read performances" ON public.performances;
DROP POLICY IF EXISTS "Hosts can insert performances" ON public.performances;
DROP POLICY IF EXISTS "Hosts can update performances" ON public.performances;
DROP POLICY IF EXISTS "Hosts can delete performances" ON public.performances;

CREATE POLICY "Anyone can read performances by instance" ON public.performances
FOR SELECT USING (true);

CREATE POLICY "Admins can insert performances" ON public.performances
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Coordinators can insert own performances" ON public.performances
FOR INSERT WITH CHECK (karaoke_instance_id = get_user_instance_id());

CREATE POLICY "Admins can update performances" ON public.performances
FOR UPDATE USING (is_admin());

CREATE POLICY "Coordinators can update own performances" ON public.performances
FOR UPDATE USING (karaoke_instance_id = get_user_instance_id());

CREATE POLICY "Admins can delete performances" ON public.performances
FOR DELETE USING (is_admin());

CREATE POLICY "Coordinators can delete own performances" ON public.performances
FOR DELETE USING (karaoke_instance_id = get_user_instance_id());

-- Update waitlist policies for instance isolation
DROP POLICY IF EXISTS "Anyone can read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can insert to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Hosts can update waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Hosts can delete from waitlist" ON public.waitlist;

CREATE POLICY "Anyone can read waitlist by instance" ON public.waitlist
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert to waitlist with instance" ON public.waitlist
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update waitlist" ON public.waitlist
FOR UPDATE USING (is_admin());

CREATE POLICY "Coordinators can update own waitlist" ON public.waitlist
FOR UPDATE USING (karaoke_instance_id = get_user_instance_id());

CREATE POLICY "Admins can delete from waitlist" ON public.waitlist
FOR DELETE USING (is_admin());

CREATE POLICY "Coordinators can delete from own waitlist" ON public.waitlist
FOR DELETE USING (karaoke_instance_id = get_user_instance_id());

-- Update votes policies for instance isolation
DROP POLICY IF EXISTS "Anyone can read votes" ON public.votes;
DROP POLICY IF EXISTS "Anyone can insert votes" ON public.votes;
DROP POLICY IF EXISTS "Hosts can delete votes" ON public.votes;

CREATE POLICY "Anyone can read votes by instance" ON public.votes
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert votes with instance" ON public.votes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can delete votes" ON public.votes
FOR DELETE USING (is_admin());

CREATE POLICY "Coordinators can delete own votes" ON public.votes
FOR DELETE USING (karaoke_instance_id = get_user_instance_id());