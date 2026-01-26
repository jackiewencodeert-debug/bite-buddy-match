-- =====================================================
-- FIX ALL 7 CRITICAL RLS SECURITY ISSUES
-- =====================================================

-- 1. PROFILES TABLE - Ensure users can only see their own profile
-- First ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive SELECT policies and recreate properly
DROP POLICY IF EXISTS "Authenticated users can view only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Users can only view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. PREFERENCES TABLE - Medical allergy data must be protected
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

-- Ensure only own preferences visible (policy might exist, recreate to be safe)
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.preferences;
DROP POLICY IF EXISTS "Anyone can view preferences" ON public.preferences;
DROP POLICY IF EXISTS "Public can view preferences" ON public.preferences;

CREATE POLICY "Users can only view their own preferences"
ON public.preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. FAVORITES TABLE - User favorites must be private
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Anyone can view favorites" ON public.favorites;
DROP POLICY IF EXISTS "Public can view favorites" ON public.favorites;

CREATE POLICY "Users can only view their own favorites"
ON public.favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. SCANS TABLE - Activity tracking must be private
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own scans" ON public.scans;
DROP POLICY IF EXISTS "Anyone can view scans" ON public.scans;
DROP POLICY IF EXISTS "Public can view scans" ON public.scans;

-- Users see own scans, admins see all
CREATE POLICY "Users can only view their own scans"
ON public.scans FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- 5. ALLERGEN_FEEDBACK TABLE - User feedback must be private
ALTER TABLE public.allergen_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own feedback" ON public.allergen_feedback;
DROP POLICY IF EXISTS "Anyone can view allergen_feedback" ON public.allergen_feedback;
DROP POLICY IF EXISTS "Public can view feedback" ON public.allergen_feedback;

-- Users see own feedback, admins see all
CREATE POLICY "Users can only view their own feedback"
ON public.allergen_feedback FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- 6. BUSINESS_INVITES TABLE - Invite codes must be admin-only
ALTER TABLE public.business_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all business invites" ON public.business_invites;
DROP POLICY IF EXISTS "Anyone can view business_invites" ON public.business_invites;
DROP POLICY IF EXISTS "Public can view invites" ON public.business_invites;

CREATE POLICY "Only admins can view business invites"
ON public.business_invites FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. USER_ROLES TABLE - Role visibility must be restricted
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public can view roles" ON public.user_roles;

-- Users see own roles, admins see all roles
CREATE POLICY "Users can only view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- =====================================================
-- REVOKE PUBLIC ACCESS FROM ANON ROLE
-- This ensures anonymous users cannot access these tables
-- =====================================================

-- Revoke all privileges from anon on sensitive tables
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.preferences FROM anon;
REVOKE ALL ON public.favorites FROM anon;
REVOKE ALL ON public.scans FROM anon;
REVOKE ALL ON public.allergen_feedback FROM anon;
REVOKE ALL ON public.business_invites FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

-- Grant necessary permissions only to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preferences TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT SELECT, INSERT ON public.scans TO authenticated;
GRANT SELECT, INSERT ON public.allergen_feedback TO authenticated;
GRANT SELECT ON public.business_invites TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;