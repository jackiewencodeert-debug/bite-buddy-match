-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can view only their own profile" ON public.profiles;

-- Create a new policy that explicitly requires authentication
CREATE POLICY "Authenticated users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);