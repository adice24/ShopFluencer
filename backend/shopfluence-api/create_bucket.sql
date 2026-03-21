DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
END $$;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Auth Uploads" ON storage.objects;
CREATE POLICY "Auth Uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
