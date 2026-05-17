CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'NL',
  website_url TEXT,
  phone TEXT,
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curated_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT,
  source_type TEXT CHECK (source_type IN ('manual','pdf_import','ai_extracted','crowd','seed')),
  source_url TEXT,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curated_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID REFERENCES public.curated_menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_eur NUMERIC(10,2),
  category TEXT,
  ingredients TEXT[],
  allergens TEXT[] CHECK (allergens <@ ARRAY[
    'gluten','schaaldieren','eieren','vis','pinda',
    'soja','melk','noten','selderij','mosterd',
    'sesam','sulfiet','lupine','weekdieren'
  ]),
  dietary_tags TEXT[] CHECK (dietary_tags <@ ARRAY[
    'vegetarisch','veganistisch','glutenvrij','lactosevrij','halal','koosjer'
  ]),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dish_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID REFERENCES public.curated_dishes(id) ON DELETE CASCADE,
  alias_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ingredient_allergens (
  id SERIAL PRIMARY KEY,
  ingredient_name TEXT NOT NULL UNIQUE,
  ingredient_aliases TEXT[],
  allergens TEXT[] NOT NULL CHECK (allergens <@ ARRAY[
    'gluten','schaaldieren','eieren','vis','pinda',
    'soja','melk','noten','selderij','mosterd',
    'sesam','sulfiet','lupine','weekdieren'
  ]),
  notes TEXT,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_name_trgm ON public.restaurants USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_curated_dishes_name_trgm ON public.curated_dishes USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dish_aliases_name_trgm ON public.dish_aliases USING gin (alias_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ingredient_name_trgm ON public.ingredient_allergens USING gin (ingredient_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_curated_dishes_menu ON public.curated_dishes(menu_id);
CREATE INDEX IF NOT EXISTS idx_curated_menus_restaurant ON public.curated_menus(restaurant_id);

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(uid, 'admin'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.fuzzy_dish_match(search_text TEXT, threshold FLOAT DEFAULT 0.4)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  allergens TEXT[],
  ingredients TEXT[],
  similarity_score FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name,
    d.description,
    d.allergens,
    d.ingredients,
    GREATEST(
      similarity(d.name, search_text),
      COALESCE((
        SELECT MAX(similarity(da.alias_name, search_text))
        FROM public.dish_aliases da
        WHERE da.dish_id = d.id
      ), 0)
    )::FLOAT AS score
  FROM public.curated_dishes d
  WHERE d.verified = true
    AND (
      similarity(d.name, search_text) > threshold
      OR EXISTS (
        SELECT 1 FROM public.dish_aliases da2
        WHERE da2.dish_id = d.id
          AND similarity(da2.alias_name, search_text) > threshold
      )
    )
  ORDER BY score DESC
  LIMIT 5;
END;
$$;

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_allergens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Public read curated_menus" ON public.curated_menus;
DROP POLICY IF EXISTS "Public read curated_dishes" ON public.curated_dishes;
DROP POLICY IF EXISTS "Public read dish_aliases" ON public.dish_aliases;
DROP POLICY IF EXISTS "Public read ingredient_allergens" ON public.ingredient_allergens;

CREATE POLICY "Public read restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Public read curated_menus" ON public.curated_menus FOR SELECT USING (true);
CREATE POLICY "Public read curated_dishes" ON public.curated_dishes FOR SELECT USING (true);
CREATE POLICY "Public read dish_aliases" ON public.dish_aliases FOR SELECT USING (true);
CREATE POLICY "Public read ingredient_allergens" ON public.ingredient_allergens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Admin write curated_menus" ON public.curated_menus;
DROP POLICY IF EXISTS "Admin write curated_dishes" ON public.curated_dishes;
DROP POLICY IF EXISTS "Admin write dish_aliases" ON public.dish_aliases;
DROP POLICY IF EXISTS "Admin write ingredient_allergens" ON public.ingredient_allergens;

CREATE POLICY "Admin write restaurants" ON public.restaurants FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin write curated_menus" ON public.curated_menus FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin write curated_dishes" ON public.curated_dishes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin write dish_aliases" ON public.dish_aliases FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin write ingredient_allergens" ON public.ingredient_allergens FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-uploads', 'menu-uploads', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload menu-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own menu-uploads" ON storage.objects;

CREATE POLICY "Authenticated users can upload menu-uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own menu-uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-uploads' AND auth.uid() = owner);