-- ═══════════════════════════════════════════════════════════════
-- Ensure set_user_role always persists: if public.profiles row is
-- missing (legacy signups / failed trigger), INSERT from auth.users.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.set_user_role(new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
  rows_updated int;
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

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated = 0 THEN
    INSERT INTO public.profiles (id, email, full_name, role, status, updated_at)
    SELECT
      u.id,
      COALESCE(u.email, ''),
      COALESCE(u.raw_user_meta_data->>'full_name', ''),
      normalized,
      'active',
      NOW()
    FROM auth.users u
    WHERE u.id = auth.uid()
    ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role,
        updated_at = NOW();
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_role(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
