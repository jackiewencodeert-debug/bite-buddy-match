-- =====================================================
-- FIX REMAINING 5 RLS SECURITY ISSUES
-- =====================================================

-- 1. MENUS TABLE - Menus should only be accessible via get_public_menu function
-- Business owners can manage their own menus
-- Public access is handled via the secure get_public_menu() function
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Revoke direct anon access
REVOKE ALL ON public.menus FROM anon;

-- Ensure business owners can manage their menus (policies likely exist, recreate)
DROP POLICY IF EXISTS "Businesses can view their own menus" ON public.menus;
DROP POLICY IF EXISTS "Anyone can view menus" ON public.menus;
DROP POLICY IF EXISTS "Public can view menus" ON public.menus;

CREATE POLICY "Businesses can view their own menus"
ON public.menus FOR SELECT
TO authenticated
USING (auth.uid() = business_user_id);

-- 2. DISHES TABLE - Dishes should only be accessible via get_public_menu function
-- Business owners can manage their dishes
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;

-- Revoke direct anon access
REVOKE ALL ON public.dishes FROM anon;

DROP POLICY IF EXISTS "Businesses can view their own dishes" ON public.dishes;
DROP POLICY IF EXISTS "Anyone can view dishes" ON public.dishes;
DROP POLICY IF EXISTS "Public can view dishes" ON public.dishes;

CREATE POLICY "Businesses can view their own dishes"
ON public.dishes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.menus 
    WHERE menus.id = dishes.menu_id 
    AND menus.business_user_id = auth.uid()
  )
);

-- 3. ALLERGEN_PATTERNS TABLE - Admin only access
ALTER TABLE public.allergen_patterns ENABLE ROW LEVEL SECURITY;

-- Revoke direct anon access
REVOKE ALL ON public.allergen_patterns FROM anon;

DROP POLICY IF EXISTS "Anyone can read allergen patterns" ON public.allergen_patterns;
DROP POLICY IF EXISTS "Public can view allergen_patterns" ON public.allergen_patterns;

-- Only admins can view patterns directly
-- (Public access is via get_allergen_patterns() function)
CREATE POLICY "Only admins can view allergen patterns"
ON public.allergen_patterns FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. MENU_SCANS TABLE - Business owners see their menu scans, admins see all
ALTER TABLE public.menu_scans ENABLE ROW LEVEL SECURITY;

-- Revoke direct anon access
REVOKE ALL ON public.menu_scans FROM anon;

DROP POLICY IF EXISTS "Businesses can view scans of their menus" ON public.menu_scans;
DROP POLICY IF EXISTS "Anyone can view menu_scans" ON public.menu_scans;
DROP POLICY IF EXISTS "Public can view menu_scans" ON public.menu_scans;

CREATE POLICY "Businesses can view scans of their own menus"
ON public.menu_scans FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.menus 
    WHERE menus.id = menu_scans.menu_id 
    AND menus.business_user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- 5. AD_ANALYTICS TABLE - Admin only access
ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

-- Revoke direct anon access  
REVOKE ALL ON public.ad_analytics FROM anon;

DROP POLICY IF EXISTS "Only authenticated admins can view ad analytics" ON public.ad_analytics;
DROP POLICY IF EXISTS "Anyone can view ad_analytics" ON public.ad_analytics;
DROP POLICY IF EXISTS "Public can view ad_analytics" ON public.ad_analytics;

CREATE POLICY "Only admins can view ad analytics"
ON public.ad_analytics FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Ensure insert still works for analytics tracking (any authenticated user)
DROP POLICY IF EXISTS "Anyone can insert ad analytics with valid data" ON public.ad_analytics;

CREATE POLICY "Authenticated users can insert ad analytics"
ON public.ad_analytics FOR INSERT
TO authenticated
WITH CHECK (
  (event_type IS NOT NULL) AND 
  (ad_type IS NOT NULL) AND 
  ((user_id IS NULL) OR (user_id = auth.uid()))
);

-- Also allow anon to insert (for guest users tracking)
GRANT INSERT ON public.ad_analytics TO anon;

CREATE POLICY "Anon users can insert ad analytics"
ON public.ad_analytics FOR INSERT
TO anon
WITH CHECK (
  (event_type IS NOT NULL) AND 
  (ad_type IS NOT NULL) AND 
  (user_id IS NULL)
);

-- =====================================================
-- ENSURE SCANS TABLE ALLOWS GUEST INSERTS
-- =====================================================
-- Guest users need to be able to insert scans (for guest_registration tracking)
GRANT INSERT ON public.scans TO anon;

CREATE POLICY "Anon users can insert guest scans"
ON public.scans FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);