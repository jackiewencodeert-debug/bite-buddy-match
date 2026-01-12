-- Fix 1: Drop overly permissive menus policy and create a safer one
-- The issue is that business_user_id is exposed. We'll create a function to safely fetch menu data.
DROP POLICY IF EXISTS "Anyone can view menus by QR code" ON public.menus;

-- Create a safer policy that only allows viewing specific columns via a secure function
-- For now, we keep public access but recommend using a view or function
-- Create new policy that still allows public viewing but through proper channels
CREATE POLICY "Public can view menu data for QR scanning" 
ON public.menus 
FOR SELECT 
USING (true);

-- Actually, the real fix is to create a secure view that excludes sensitive data
-- First drop the new policy we just created
DROP POLICY IF EXISTS "Public can view menu data for QR scanning" ON public.menus;

-- Create a database function that returns menu data WITHOUT business_user_id
CREATE OR REPLACE FUNCTION public.get_public_menu(menu_qr_code TEXT)
RETURNS TABLE (
  id UUID,
  menu_data JSONB,
  qr_code TEXT,
  menu_image_url TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.menu_data, m.qr_code, m.menu_image_url, m.created_at
  FROM menus m
  WHERE m.qr_code = menu_qr_code;
END;
$$;

-- Fix 2: Drop overly permissive business_invites policy
DROP POLICY IF EXISTS "Anyone can verify invite codes" ON public.business_invites;

-- Create a function to verify invite codes without exposing email data
CREATE OR REPLACE FUNCTION public.verify_invite_code(invite_code TEXT)
RETURNS TABLE (
  id UUID,
  code TEXT,
  business_name TEXT,
  is_claimed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT bi.id, bi.code, bi.business_name, bi.is_claimed
  FROM business_invites bi
  WHERE bi.code = invite_code;
END;
$$;

-- Create a function to claim an invite code (authenticated users only)
CREATE OR REPLACE FUNCTION public.claim_invite_code(invite_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to claim an invite';
  END IF;
  
  UPDATE business_invites
  SET is_claimed = true,
      claimed_at = now(),
      claimed_by = v_user_id
  WHERE code = invite_code
    AND is_claimed = false;
  
  RETURN FOUND;
END;
$$;

-- Fix 3: The profiles table already has correct RLS (auth.uid() = id)
-- The security scan was a false positive since profiles only allows viewing own profile
-- No changes needed for profiles

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.get_public_menu(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_invite_code(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_invite_code(TEXT) TO authenticated;