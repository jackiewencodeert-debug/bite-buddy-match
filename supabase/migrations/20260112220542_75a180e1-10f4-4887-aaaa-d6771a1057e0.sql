-- Fix 1: Remove unrestricted public access to dishes table
-- The get_public_menu function already returns dishes securely
DROP POLICY IF EXISTS "Anyone can view dishes through public menus" ON public.dishes;

-- Fix 2: Remove unrestricted public access to allergen_patterns
-- Create a secure function instead
DROP POLICY IF EXISTS "Anyone can read allergen patterns" ON public.allergen_patterns;

-- Create secure function for allergen pattern access
CREATE OR REPLACE FUNCTION public.get_allergen_patterns()
RETURNS TABLE (
  ingredient_pattern TEXT,
  allergen TEXT,
  confidence_score NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ap.ingredient_pattern, ap.allergen, ap.confidence_score
  FROM allergen_patterns ap
  WHERE ap.confidence_score >= 0.5;  -- Only return patterns with reasonable confidence
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_allergen_patterns() TO anon, authenticated;