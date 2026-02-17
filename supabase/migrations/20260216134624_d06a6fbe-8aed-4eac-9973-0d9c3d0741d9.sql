-- Allow partners to view each other's profiles
CREATE POLICY "Partners can view linked profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM relationships r
    WHERE (
      (r.user1_id = auth.uid() AND r.user2_id = profiles.user_id)
      OR
      (r.user2_id = auth.uid() AND r.user1_id = profiles.user_id)
    )
  )
);