-- Add QR position column to profiles for business users
ALTER TABLE public.profiles 
ADD COLUMN qr_position text DEFAULT 'bottom-right';

COMMENT ON COLUMN public.profiles.qr_position IS 'Position of QR code on menu: bottom-right, bottom-left, top-right, top-left';