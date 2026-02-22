-- Migration 009: Product Images Storage Bucket
-- Creates a secure storage bucket for product images to avoid URL-only dependencies
-- Prevents file upload bypass by restricting MIME types and size limits natively via Postgres RLS.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  public = EXCLUDED.public;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access
DROP POLICY IF EXISTS "Product Images Public View" ON storage.objects;
CREATE POLICY "Product Images Public View"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2. Authenticated Insert Access (Security: Must match user_id path, must be valid mime)
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

-- 3. Authenticated Update Access (Owner only)
DROP POLICY IF EXISTS "Product Images User Update" ON storage.objects;
CREATE POLICY "Product Images User Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'product-images' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Authenticated Delete Access (Owner only)
DROP POLICY IF EXISTS "Product Images User Delete" ON storage.objects;
CREATE POLICY "Product Images User Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'product-images' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
);
