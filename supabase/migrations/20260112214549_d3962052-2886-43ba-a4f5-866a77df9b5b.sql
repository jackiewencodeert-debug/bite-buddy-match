-- We need to re-enable public access for menus but hide the business_user_id
-- The best approach is to create a secure view

-- First, let's create a view that excludes business_user_id for public access
CREATE OR REPLACE VIEW public.public_menus AS
SELECT 
  id,
  created_at,
  menu_data,
  qr_code,
  menu_image_url
FROM public.menus;

-- Grant access to the view for anonymous and authenticated users
GRANT SELECT ON public.public_menus TO anon, authenticated;

-- Now we need to allow SELECT on menus again for the app to work
-- But only for users who own the menu (already covered) or through our secure function
-- Let's add a limited policy that allows public access but we'll use the view in code
CREATE POLICY "Public can access menus through secure function" 
ON public.menus 
FOR SELECT 
USING (
  -- Allow business owners to see their own menus
  auth.uid() = business_user_id
);

-- Actually the above already exists as "Businesses can view their own menus"
-- So we just need the code to use our new secure function or view
DROP POLICY IF EXISTS "Public can access menus through secure function" ON public.menus;

-- For dishes, the "Anyone can view dishes through public menus" policy also uses true
-- Let's update it to be more restrictive but still functional
-- First, update the get_public_menu function to also return dishes

DROP FUNCTION IF EXISTS public.get_public_menu(TEXT);

CREATE OR REPLACE FUNCTION public.get_public_menu(menu_qr_code TEXT)
RETURNS TABLE (
  menu_id UUID,
  menu_data JSONB,
  qr_code TEXT,
  menu_image_url TEXT,
  created_at TIMESTAMPTZ,
  dishes JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as menu_id,
    m.menu_data,
    m.qr_code,
    m.menu_image_url,
    m.created_at,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'name', d.name,
          'description', d.description,
          'price', d.price,
          'ingredients', d.ingredients,
          'allergens', d.allergens,
          'dietary_info', d.dietary_info,
          'cross_contamination_risk', d.cross_contamination_risk,
          'category', d.category,
          'is_available', d.is_available,
          'name_translations', d.name_translations,
          'ingredients_translations', d.ingredients_translations,
          'allergens_translations', d.allergens_translations,
          'dietary_info_translations', d.dietary_info_translations
        )
      ) FROM dishes d WHERE d.menu_id = m.id),
      '[]'::jsonb
    ) as dishes
  FROM menus m
  WHERE m.qr_code = menu_qr_code;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_public_menu(TEXT) TO anon, authenticated;