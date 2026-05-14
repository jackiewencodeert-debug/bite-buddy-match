-- BiteBuddyMatch — Fase B migratie (A2 mode: namespace nieuw, raak eetgever niet aan)
-- Bestaande `menus` en `dishes` blijven voor eetgever-upload flow.
-- Nieuwe `curated_menus` / `curated_dishes` voeden de consumer-scan lookup (Fase D).

BEGIN;

-- 1. Trigram-extension voor fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Nieuwe tables
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'NL',
  website_url TEXT,
  phone TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.curated_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT,
  source_type TEXT CHECK (source_type IN ('manual','pdf_import','ai_extracted','crowd')),
  source_url TEXT,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.curated_dishes (
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
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.dish_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID REFERENCES public.curated_dishes(id) ON DELETE CASCADE,
  alias_name TEXT NOT NULL
);

-- 3. Indexes voor fast fuzzy lookup
CREATE INDEX idx_restaurants_name_trgm ON public.restaurants USING gin (name gin_trgm_ops);
CREATE INDEX idx_curated_dishes_name_trgm ON public.curated_dishes USING gin (name gin_trgm_ops);
CREATE INDEX idx_dish_aliases_name_trgm ON public.dish_aliases USING gin (alias_name gin_trgm_ops);
CREATE INDEX idx_curated_dishes_menu ON public.curated_dishes(menu_id);
CREATE INDEX idx_curated_menus_restaurant ON public.curated_menus(restaurant_id);

-- 4. Admin-check helper (SECURITY DEFINER — werkt rond RLS op auth.users)
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = uid
      AND email = 'jackiewencodeert@gmail.com'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon;

-- 5. RLS aan
ALTER TABLE public.restaurants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_menus   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_dishes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_aliases    ENABLE ROW LEVEL SECURITY;

-- 6. Public read policies
CREATE POLICY "Public read restaurants"    ON public.restaurants     FOR SELECT USING (true);
CREATE POLICY "Public read curated menus"  ON public.curated_menus   FOR SELECT USING (true);
CREATE POLICY "Public read curated dishes" ON public.curated_dishes  FOR SELECT USING (true);
CREATE POLICY "Public read dish aliases"   ON public.dish_aliases    FOR SELECT USING (true);

-- 7. Admin write policies (via is_admin helper)
CREATE POLICY "Admin write restaurants"    ON public.restaurants     FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin write curated menus"  ON public.curated_menus   FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin write curated dishes" ON public.curated_dishes  FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin write dish aliases"   ON public.dish_aliases    FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 8. updated_at trigger op restaurants
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER restaurants_touch_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMIT;
