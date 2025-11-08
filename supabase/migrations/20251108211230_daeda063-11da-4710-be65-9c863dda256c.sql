-- Add business allergen warnings column to profiles
ALTER TABLE public.profiles 
ADD COLUMN business_allergen_warnings text[] DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN public.profiles.business_allergen_warnings IS 'Allergens that the business cannot avoid in their kitchen';

-- Create dishes table for individual menu items
CREATE TABLE public.dishes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id uuid NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price text,
  ingredients text[] DEFAULT ARRAY[]::text[],
  allergens text[] DEFAULT ARRAY[]::text[],
  dietary_info text[] DEFAULT ARRAY[]::text[],
  is_available boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on dishes
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dishes
CREATE POLICY "Businesses can view their own dishes"
  ON public.dishes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.menus
      WHERE menus.id = dishes.menu_id
      AND menus.business_user_id = auth.uid()
    )
  );

CREATE POLICY "Businesses can insert their own dishes"
  ON public.dishes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.menus
      WHERE menus.id = dishes.menu_id
      AND menus.business_user_id = auth.uid()
    )
  );

CREATE POLICY "Businesses can update their own dishes"
  ON public.dishes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.menus
      WHERE menus.id = dishes.menu_id
      AND menus.business_user_id = auth.uid()
    )
  );

CREATE POLICY "Businesses can delete their own dishes"
  ON public.dishes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.menus
      WHERE menus.id = dishes.menu_id
      AND menus.business_user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view dishes through public menus"
  ON public.dishes FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_dishes_menu_id ON public.dishes(menu_id);
CREATE INDEX idx_dishes_allergens ON public.dishes USING GIN(allergens);
CREATE INDEX idx_dishes_ingredients ON public.dishes USING GIN(ingredients);

-- Create trigger for updated_at
CREATE TRIGGER update_dishes_updated_at
  BEFORE UPDATE ON public.dishes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();