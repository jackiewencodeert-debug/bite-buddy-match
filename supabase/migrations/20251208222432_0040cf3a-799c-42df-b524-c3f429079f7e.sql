-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert menu scans" ON public.menu_scans;

-- Create a more secure policy: authenticated users can insert with their own user_id, 
-- or anyone can insert with null scanner_user_id (for guest scans)
CREATE POLICY "Users can insert their own menu scans"
ON public.menu_scans
FOR INSERT
WITH CHECK (
  (scanner_user_id IS NULL) OR 
  (auth.uid() IS NOT NULL AND scanner_user_id = auth.uid())
);