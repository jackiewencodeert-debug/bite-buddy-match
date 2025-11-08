-- Add characteristics column to preferences table
ALTER TABLE public.preferences 
ADD COLUMN IF NOT EXISTS characteristics TEXT[];

-- Add comment to explain the column
COMMENT ON COLUMN public.preferences.characteristics IS 'Array of ingredient names or characteristics that should be detected on menus for this allergy/preference';

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_preferences_characteristics ON public.preferences USING GIN(characteristics);