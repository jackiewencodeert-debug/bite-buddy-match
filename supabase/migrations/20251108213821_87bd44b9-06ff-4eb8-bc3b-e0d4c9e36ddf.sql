-- Create table for ad analytics
CREATE TABLE public.ad_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  ad_type TEXT NOT NULL DEFAULT 'scan_interstitial',
  event_type TEXT NOT NULL, -- 'shown', 'completed', 'skipped'
  countdown_value INTEGER, -- Value when user closed (for skip tracking)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert ad analytics (for guest tracking)
CREATE POLICY "Anyone can insert ad analytics"
ON public.ad_analytics
FOR INSERT
WITH CHECK (true);

-- Admins can view all ad analytics
CREATE POLICY "Admins can view ad analytics"
ON public.ad_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create index for better query performance
CREATE INDEX idx_ad_analytics_event_type ON public.ad_analytics(event_type);
CREATE INDEX idx_ad_analytics_created_at ON public.ad_analytics(created_at DESC);