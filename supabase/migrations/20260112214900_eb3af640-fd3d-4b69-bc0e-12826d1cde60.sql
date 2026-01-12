-- Fix remaining security issues

-- 1. The profiles table already has correct RLS - the scan is a false positive
-- Let's verify by checking that the policy exists
-- Profiles table has: "Authenticated users can view only their own profile" with (auth.uid() = id)
-- This is correct and secure

-- 2. Fix scans table - currently allows viewing NULL user_id scans by anyone
-- Update the policy to be more restrictive
DROP POLICY IF EXISTS "Users can view their own scans" ON public.scans;

CREATE POLICY "Users can view their own scans" 
ON public.scans 
FOR SELECT 
USING (
  -- Authenticated users can only see their own scans
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  -- Admins can see all scans
  OR has_role(auth.uid(), 'admin'::text)
);

-- Guest scans (user_id IS NULL) should only be viewable by admins
-- The above policy already handles this since non-admins won't match the condition

-- 3. Double-check if there's still a security definer view lingering
-- The public_menus view was dropped but might still be cached
-- Let's explicitly ensure it's gone
DROP VIEW IF EXISTS public.public_menus CASCADE;