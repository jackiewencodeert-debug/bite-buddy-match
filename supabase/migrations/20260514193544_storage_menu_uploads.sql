-- Storage bucket voor menu-uploads (PDF/foto's bij Fase D import workflow)

INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-uploads', 'menu-uploads', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload menus" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own uploads" ON storage.objects;

CREATE POLICY "Authenticated users can upload menus"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-uploads' AND auth.uid() = owner);
