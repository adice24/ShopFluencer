-- Platform operator login credentials for Nest /admin/auth (same DB as Prisma).
-- Stores bcrypt hashes only — never plaintext passwords.
-- PostgREST cannot read this table: RLS enabled with no policies for anon/authenticated.

CREATE TABLE IF NOT EXISTS public.platform_operator_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  label VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_operator_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_operator_credentials FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.platform_operator_credentials FROM PUBLIC;
REVOKE ALL ON public.platform_operator_credentials FROM anon;
REVOKE ALL ON public.platform_operator_credentials FROM authenticated;

-- Default row (bcrypt for password admin123). CHANGE IN PRODUCTION.
INSERT INTO public.platform_operator_credentials (id, email, password_hash, label, is_active)
VALUES (
  gen_random_uuid(),
  'admin@shopfluence.com',
  '$2b$10$7GVbe9I9ZI.wltXq8zYb..0F.LXv1vsnaDM9rYoEc4ahxyLYjw9UK',
  'default',
  true
)
ON CONFLICT (email) DO NOTHING;

NOTIFY pgrst, 'reload schema';
