-- Create table for allergen detection feedback (ML learning)
CREATE TABLE public.allergen_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dish_name TEXT NOT NULL,
  detected_allergens TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  confirmed_allergens TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  missed_allergens TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  false_positives TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ingredients TEXT[] DEFAULT ARRAY[]::TEXT[],
  feedback_type TEXT NOT NULL DEFAULT 'correction', -- 'correction', 'confirmation', 'report'
  is_processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allergen_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert feedback (guests too)
CREATE POLICY "Anyone can insert allergen feedback"
ON public.allergen_feedback
FOR INSERT
WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.allergen_feedback
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.allergen_feedback
FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- Admins can update feedback (mark as processed)
CREATE POLICY "Admins can update feedback"
ON public.allergen_feedback
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::text));

-- Create table for learned allergen patterns
CREATE TABLE public.allergen_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_pattern TEXT NOT NULL,
  allergen TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ingredient_pattern, allergen)
);

-- Enable RLS
ALTER TABLE public.allergen_patterns ENABLE ROW LEVEL SECURITY;

-- Anyone can read patterns (for allergen detection)
CREATE POLICY "Anyone can read allergen patterns"
ON public.allergen_patterns
FOR SELECT
USING (true);

-- Only admins can modify patterns
CREATE POLICY "Admins can insert patterns"
ON public.allergen_patterns
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update patterns"
ON public.allergen_patterns
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::text));

-- Create trigger to update updated_at
CREATE TRIGGER update_allergen_patterns_updated_at
BEFORE UPDATE ON public.allergen_patterns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();