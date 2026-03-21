-- Migration 009: Product Images Storage Bucket
-- Bucket INSERT usually succeeds. Policies on storage.objects require ownership (often postgres
-- in Dashboard SQL Editor). If you see 42501, create the bucket in Dashboard → Storage instead.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  public = EXCLUDED.public;

-- Policies (skip entire block if not table owner — e.g. run from SQL Editor as postgres)
DO $body$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Product Images Public View" ON storage.objects;
  CREATE POLICY "Product Images Public View"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

  DROP POLICY IF EXISTS "Product Images User Upload" ON storage.objects;
  CREATE POLICY "Product Images User Upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (auth.uid())::text = (storage.foldername(name))[1] AND
    (
      LOWER(RIGHT(name, 4)) IN ('.jpg', '.png', '.gif') OR
      LOWER(RIGHT(name, 5)) IN ('.jpeg', '.webp')
    )
  );

  DROP POLICY IF EXISTS "Product Images User Update" ON storage.objects;
  CREATE POLICY "Product Images User Update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

  DROP POLICY IF EXISTS "Product Images User Delete" ON storage.objects;
  CREATE POLICY "Product Images User Delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );
EXCEPTION
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      RAISE NOTICE '009: skipped storage.objects policies (not owner). Create bucket "product-images" in Dashboard → Storage, or run this file in Supabase SQL Editor as postgres.';
    ELSE
      RAISE;
    END IF;
END
$body$;
