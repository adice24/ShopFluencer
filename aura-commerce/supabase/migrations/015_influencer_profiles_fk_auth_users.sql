-- Supabase Auth users live in auth.users. Prisma's FK to public.users blocks inserts from
-- the anon/authenticated client when no row exists in public.users.
-- Point influencer_profiles.user_id at auth.users instead.

ALTER TABLE public.influencer_profiles
  DROP CONSTRAINT IF EXISTS influencer_profiles_user_id_fkey;

ALTER TABLE public.influencer_profiles
  ADD CONSTRAINT influencer_profiles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users (id)
  ON DELETE CASCADE;
