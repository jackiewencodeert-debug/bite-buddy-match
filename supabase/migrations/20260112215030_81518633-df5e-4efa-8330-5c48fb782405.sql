-- Fix allergen_feedback table - restrict public read access
-- Currently has "Users can view their own feedback" with (auth.uid() = user_id) OR (user_id IS NULL)
-- The OR (user_id IS NULL) allows anyone to view anonymous feedback which exposes health data

DROP POLICY IF EXISTS "Users can view their own feedback" ON public.allergen_feedback;

CREATE POLICY "Users can view their own feedback" 
ON public.allergen_feedback 
FOR SELECT 
USING (
  -- Only authenticated users can see their own feedback
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

-- Admins already have their own policy to view all feedback
-- The existing "Admins can view all feedback" policy is already correct