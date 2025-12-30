-- Add QR settings columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS qr_color text DEFAULT 'black',
ADD COLUMN IF NOT EXISTS qr_text_above text DEFAULT '',
ADD COLUMN IF NOT EXISTS qr_text_below text DEFAULT '';