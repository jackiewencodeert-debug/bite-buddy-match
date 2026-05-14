-- Ingredient-naar-allergeen mapping voor rule-based scan inference (zero AI).
-- Bij scan: OCR text → tokens → fuzzy-match tegen ingredient_name/aliases → unie van allergens.

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

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_ingredient_name_trgm
  ON public.ingredient_allergens USING gin (ingredient_name gin_trgm_ops);

ALTER TABLE public.ingredient_allergens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read ingredients" ON public.ingredient_allergens;
CREATE POLICY "Public read ingredients"
  ON public.ingredient_allergens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write ingredients" ON public.ingredient_allergens;
CREATE POLICY "Admin write ingredients"
  ON public.ingredient_allergens FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
