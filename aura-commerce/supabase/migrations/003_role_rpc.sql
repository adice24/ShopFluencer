-- ═══════════════════════════════════════════════════════════════
-- ShopFluence — Secure Role Upgrade RPC
-- SOC 2 Compliant / Role Access
-- ═══════════════════════════════════════════════════════════════

-- Allows a user to upgrade their role from 'customer' to 'influencer' 
-- No one can upgrade to 'admin' using this function.

CREATE OR REPLACE FUNCTION public.set_user_role(new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS to allow the restricted column update
SET search_path = public
AS $$
BEGIN
    -- 1. Must be authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Validate input (whitelist ONLY influencer or customer)
    IF new_role NOT IN ('influencer', 'customer') THEN
        RAISE EXCEPTION 'Invalid role selection';
    END IF;

    -- 3. Prevent overwriting Admin roles
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Admins cannot change their role via this method';
    END IF;

    -- 4. Execute the update
    UPDATE public.profiles
    SET role = new_role,
        updated_at = NOW()
    WHERE id = auth.uid();
    
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.set_user_role(text) TO authenticated;
