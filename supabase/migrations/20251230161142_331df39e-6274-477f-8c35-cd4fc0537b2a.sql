-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for businesses to upload their menu images
CREATE POLICY "Businesses can upload their menu images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for public read access to menu images
CREATE POLICY "Anyone can view menu images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'menu-images');

-- Create policy for businesses to update their menu images
CREATE POLICY "Businesses can update their menu images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'menu-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for businesses to delete their menu images
CREATE POLICY "Businesses can delete their menu images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'menu-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);