-- Create business_invites table for admin-created business account codes
CREATE TABLE public.business_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  business_email TEXT,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.business_invites ENABLE ROW LEVEL SECURITY;

-- Admins can view all business invites
CREATE POLICY "Admins can view all business invites"
ON public.business_invites
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can create business invites
CREATE POLICY "Admins can create business invites"
ON public.business_invites
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update business invites
CREATE POLICY "Admins can update business invites"
ON public.business_invites
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete business invites
CREATE POLICY "Admins can delete business invites"
ON public.business_invites
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can verify invite codes (for claiming)
CREATE POLICY "Anyone can verify invite codes"
ON public.business_invites
FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_business_invites_code ON public.business_invites(code);
CREATE INDEX idx_business_invites_is_claimed ON public.business_invites(is_claimed);