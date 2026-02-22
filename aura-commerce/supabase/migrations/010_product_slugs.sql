-- Migration 010: Product Slugs
-- Add unique slugs to products for public URLs (/p/:slug)

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Generate safe slugs for existing products
UPDATE public.products
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6)
WHERE slug IS NULL;

-- Enforce slug requirement
ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;
