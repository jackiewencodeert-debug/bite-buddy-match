-- =====================================================
-- FIX REMAINING RLS ISSUES
-- =====================================================

-- 1. USER_ROLES TABLE - Prevent privilege escalation
-- Only the handle_new_user trigger and admins can manage roles

-- Add restrictive INSERT policy - only via trigger (which uses SECURITY DEFINER)
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add restrictive UPDATE policy - only admins
CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add restrictive DELETE policy - only admins
CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. ALLERGEN_PATTERNS TABLE - Add DELETE protection
CREATE POLICY "Only admins can delete allergen patterns"
ON public.allergen_patterns FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- NOTE: menus and dishes access via QR codes works through 
-- the SECURITY DEFINER function get_public_menu()
-- which bypasses RLS. No additional policies needed.
-- =====================================================