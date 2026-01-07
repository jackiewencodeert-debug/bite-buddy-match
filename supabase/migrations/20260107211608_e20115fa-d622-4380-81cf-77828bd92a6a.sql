-- Add severity level to preferences table
ALTER TABLE public.preferences 
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'moderate' CHECK (severity IN ('mild', 'moderate', 'severe'));

-- Create favorites table for storing favorite dishes
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, dish_id)
);

-- Enable RLS on favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for favorites
CREATE POLICY "Users can view their own favorites" 
ON public.favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites" 
ON public.favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add cross_contamination_risk column to dishes
ALTER TABLE public.dishes 
ADD COLUMN IF NOT EXISTS cross_contamination_risk TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add category column to dishes for alternative suggestions
ALTER TABLE public.dishes 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;