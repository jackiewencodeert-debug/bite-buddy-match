-- Add translation columns to dishes table
ALTER TABLE public.dishes 
ADD COLUMN IF NOT EXISTS ingredients_translations jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allergens_translations jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dietary_info_translations jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS name_translations jsonb DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.dishes.ingredients_translations IS 'Array of ingredient translation objects with keys: original, nl, en, fr, es, de';
COMMENT ON COLUMN public.dishes.allergens_translations IS 'Array of allergen translation objects with keys: original, nl, en, fr, es, de';
COMMENT ON COLUMN public.dishes.dietary_info_translations IS 'Array of dietary info translation objects with keys: original, nl, en, fr, es, de';
COMMENT ON COLUMN public.dishes.name_translations IS 'Object with dish name translations: { nl, en, fr, es, de }';