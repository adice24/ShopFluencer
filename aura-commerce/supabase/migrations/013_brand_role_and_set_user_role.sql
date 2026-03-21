-- ═══════════════════════════════════════════════════════════════
-- Add `brand` to profiles.role and extend set_user_role RPC
-- Run after 001_security_setup.sql (requires public.profiles)
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('customer', 'influencer', 'admin', 'brand'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_user_role(new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  normalized := lower(trim(new_role));

  IF normalized NOT IN ('influencer', 'customer', 'brand') THEN
    RAISE EXCEPTION 'Invalid role selection';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admins cannot change their role via this method';
  END IF;

  UPDATE public.profiles
  SET role = normalized,
      updated_at = NOW()
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_role(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
