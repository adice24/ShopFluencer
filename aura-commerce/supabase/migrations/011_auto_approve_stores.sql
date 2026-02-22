-- Migration 011: Auto Approve Stores (Make Products Public)
-- This fixes the issue where an unauthenticated user gets "Product Not Found" on the copied link
-- because their store defaults to is_approved = false, blocking public access to it and its products.

-- 1. Modify the influencer_stores table to default to true for future signups
ALTER TABLE public.influencer_stores 
ALTER COLUMN is_approved SET DEFAULT true;

-- 2. Update all existing store profiles to approved so their products are visible to the public
UPDATE public.influencer_stores
SET is_approved = true
WHERE is_approved = false;
