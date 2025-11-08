-- Drop existing SELECT policy and create a more explicit one
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create explicit policy that only allows authenticated users to view their own profile
CREATE POLICY "Authenticated users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);