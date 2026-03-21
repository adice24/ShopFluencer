-- Prisma-created tables often have NOT NULL id / updated_at with no PostgreSQL DEFAULT.
-- Supabase client inserts must supply them, or add defaults here for safety.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'influencer_profiles'
  ) THEN
    ALTER TABLE public.influencer_profiles
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
    BEGIN
      ALTER TABLE public.influencer_profiles
        ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'storefronts'
  ) THEN
    ALTER TABLE public.storefronts
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
    BEGIN
      ALTER TABLE public.storefronts
        ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;
