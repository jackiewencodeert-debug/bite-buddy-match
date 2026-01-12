-- Fix the two remaining "RLS Policy Always True" warnings
-- These are INSERT policies with true condition

-- 1. ad_analytics - public INSERT is intentional for analytics tracking
-- But we can make it more secure by requiring at least some validation
DROP POLICY IF EXISTS "Anyone can insert ad analytics" ON public.ad_analytics;

CREATE POLICY "Anyone can insert ad analytics with valid data" 
ON public.ad_analytics 
FOR INSERT 
WITH CHECK (
  -- Require valid event_type and ad_type
  event_type IS NOT NULL AND 
  ad_type IS NOT NULL AND
  -- If user_id is provided, it must match the authenticated user
  (user_id IS NULL OR user_id = auth.uid())
);

-- 2. allergen_feedback - public INSERT is needed for guest feedback
DROP POLICY IF EXISTS "Anyone can insert allergen feedback" ON public.allergen_feedback;

CREATE POLICY "Anyone can insert allergen feedback with valid data" 
ON public.allergen_feedback 
FOR INSERT 
WITH CHECK (
  -- Require dish_name to be provided
  dish_name IS NOT NULL AND
  -- If user_id is provided, it must match the authenticated user
  (user_id IS NULL OR user_id = auth.uid())
);