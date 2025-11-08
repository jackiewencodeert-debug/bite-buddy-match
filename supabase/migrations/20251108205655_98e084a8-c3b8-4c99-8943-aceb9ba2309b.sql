-- Create user type enum
CREATE TYPE public.user_type AS ENUM ('eter', 'eetgever');

-- Add user_type column to profiles
ALTER TABLE public.profiles 
ADD COLUMN user_type public.user_type NOT NULL DEFAULT 'eter';

-- Create menus table for businesses
CREATE TABLE public.menus (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  qr_code text NOT NULL UNIQUE,
  menu_image_url text,
  menu_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create menu_scans table for tracking QR code scans
CREATE TABLE public.menu_scans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id uuid NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  scanner_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  allergies_checked text[] DEFAULT ARRAY[]::text[],
  preferences_checked text[] DEFAULT ARRAY[]::text[],
  scanned_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menus
CREATE POLICY "Businesses can view their own menus"
  ON public.menus FOR SELECT
  USING (auth.uid() = business_user_id);

CREATE POLICY "Businesses can insert their own menus"
  ON public.menus FOR INSERT
  WITH CHECK (auth.uid() = business_user_id);

CREATE POLICY "Businesses can update their own menus"
  ON public.menus FOR UPDATE
  USING (auth.uid() = business_user_id);

CREATE POLICY "Businesses can delete their own menus"
  ON public.menus FOR DELETE
  USING (auth.uid() = business_user_id);

CREATE POLICY "Anyone can view menus by QR code"
  ON public.menus FOR SELECT
  USING (true);

-- RLS Policies for menu_scans
CREATE POLICY "Businesses can view scans of their menus"
  ON public.menu_scans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.menus
      WHERE menus.id = menu_scans.menu_id
      AND menus.business_user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert menu scans"
  ON public.menu_scans FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_menus_business_user ON public.menus(business_user_id);
CREATE INDEX idx_menus_qr_code ON public.menus(qr_code);
CREATE INDEX idx_menu_scans_menu_id ON public.menu_scans(menu_id);
CREATE INDEX idx_menu_scans_scanner_user ON public.menu_scans(scanner_user_id);

-- Update handle_new_user function to support user_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with user_type from raw_user_meta_data
  INSERT INTO public.profiles (id, email, user_type)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'eter')
  );
  
  -- Assign 'user' role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Check if this is the admin email and assign admin role
  IF NEW.email = 'jackiewencodeert@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$;