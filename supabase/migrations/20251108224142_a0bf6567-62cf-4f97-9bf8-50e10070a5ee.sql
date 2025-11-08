-- Make ad_analytics SELECT policy more explicit
DROP POLICY IF EXISTS "Admins can view ad analytics" ON public.ad_analytics;

CREATE POLICY "Only authenticated admins can view ad analytics"
ON public.ad_analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
  )
);