-- Migration 011: Auto Approve Stores (Make Products Public)
-- Requires: 002_full_schema.sql (creates public.influencer_stores)
-- Safe to run if the table does not exist yet (no-op).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'influencer_stores'
  ) THEN
    ALTER TABLE public.influencer_stores
      ALTER COLUMN is_approved SET DEFAULT true;

    UPDATE public.influencer_stores
    SET is_approved = true
    WHERE is_approved = false;
  END IF;
END $$;
