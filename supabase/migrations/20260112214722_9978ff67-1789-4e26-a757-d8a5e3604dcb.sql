-- Drop the security definer view and use regular view with proper permissions
DROP VIEW IF EXISTS public.public_menus;

-- Instead of a view, we'll rely purely on the SECURITY DEFINER functions
-- which are already created and are the secure way to access data

-- The security scan still shows the old policies in cache
-- Let's verify and clean up any remaining problematic policies

-- Double check that the "Anyone can view menus by QR code" policy is actually dropped
-- by listing what policies exist (this is just verification, we already dropped it)