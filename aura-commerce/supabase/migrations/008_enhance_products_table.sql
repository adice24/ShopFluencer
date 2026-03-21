-- Migration 008: Enhance Products Table (Supabase 002 schema)
-- Adds optional commerce fields. If `products` comes from Prisma instead, `status` may be
-- enum "ProductStatus" (ACTIVE, DRAFT, …) — never use lowercase 'active' for that type.

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2) CHECK (weight >= 0),
ADD COLUMN IF NOT EXISTS is_digital BOOLEAN NOT NULL DEFAULT false;

-- Only add TEXT status when the column does not exist yet (Prisma-managed DBs already have enum status)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.products
      ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft'));
  END IF;
END $$;

-- Backfill status: TEXT column uses lowercase; Prisma enum uses UPPERCASE labels
DO $$
DECLARE
  t text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    RETURN;
  END IF;

  SELECT pg_catalog.format_type(a.atttypid, a.atttypmod) INTO t
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'products'
    AND a.attname = 'status'
    AND NOT a.attisdropped;

  IF t IS NULL THEN
    RETURN;
  END IF;

  IF t IS NOT NULL AND position('ProductStatus' in t) > 0 THEN
    UPDATE public.products
    SET status = 'ACTIVE'::"ProductStatus"
    WHERE status IS NULL;
  ELSE
    BEGIN
      UPDATE public.products SET status = 'active' WHERE status IS NULL;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '008: skipped status backfill (column type: %)', t;
    END;
  END IF;
END $$;
