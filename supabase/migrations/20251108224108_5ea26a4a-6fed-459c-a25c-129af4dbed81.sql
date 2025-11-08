-- Add INSERT policy to profiles table
-- Although profiles are created via trigger, this provides an additional security layer
CREATE POLICY "Users can insert their own profile during registration"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);