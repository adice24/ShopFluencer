-- Migration 008: Enhance Products Table
-- Adds missing influencer commerce fields to support digital products, inventory, and detailed listings

ALTER TABLE public.products
-- sku for inventory tracking
ADD COLUMN IF NOT EXISTS sku TEXT,
-- category text instead of strict relational for flexible quick-entry
ADD COLUMN IF NOT EXISTS category TEXT,
-- tags for discovery/filtering
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
-- weight for physical shipping calculation
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2) CHECK (weight >= 0),
-- flag to distinguish digital downloads from physical goods
ADD COLUMN IF NOT EXISTS is_digital BOOLEAN NOT NULL DEFAULT false,
-- track status explicitly apart from visibility
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft'));

-- Ensure any existing rows have status set to active
UPDATE public.products SET status = 'active' WHERE status IS NULL;
