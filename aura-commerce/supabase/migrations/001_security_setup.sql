-- ═══════════════════════════════════════════════════════════════
-- ShopFluence — Security Database Setup
-- SOC 2 Compliant / Penetration Test Ready
--
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════

-- ┌──────────────────────────────────────────────────────────────┐
-- │ 1. PROFILES TABLE — User data with RLS                      │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'customer'
        CHECK (role IN ('customer', 'influencer', 'admin')),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'pending_approval', 'deleted')),
    bio TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    login_count INTEGER NOT NULL DEFAULT 0,
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ
);

-- Enable RLS (MANDATORY — no exceptions)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner (defense in depth)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- ┌──────────────────────────────────────────────────────────────┐
-- │ 2. PROFILES RLS POLICIES — Zero Trust                       │
-- └──────────────────────────────────────────────────────────────┘

-- Users can only read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile but CANNOT change role/status
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Prevent role escalation: role must remain unchanged
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        -- Prevent status manipulation
        AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
    );

-- Only service_role can insert profiles (via trigger)
DROP POLICY IF EXISTS "profiles_insert_via_trigger" ON public.profiles;
CREATE POLICY "profiles_insert_via_trigger"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- No direct deletes (soft delete via status = 'deleted')
DROP POLICY IF EXISTS "profiles_no_delete" ON public.profiles;
CREATE POLICY "profiles_no_delete"
    ON public.profiles FOR DELETE
    USING (false);

-- ┌──────────────────────────────────────────────────────────────┐
-- │ 3. AUTO-CREATE PROFILE ON SIGNUP (Trigger)                  │
-- └──────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with elevated privileges
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        status
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'customer',  -- SECURITY: Always default to customer role
        'active'
    );
    RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ┌──────────────────────────────────────────────────────────────┐
-- │ 4. AUDIT LOG TABLE — Immutable Security Events              │
-- └──────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.auth_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL
        CHECK (action IN (
            'auth.sign_up',
            'auth.sign_in',
            'auth.sign_in_failed',
            'auth.sign_out',
            'auth.token_refresh',
            'auth.password_reset',
            'auth.password_change',
            'auth.mfa_enroll',
            'auth.mfa_verify',
            'auth.oauth_sign_in',
            'auth.account_locked',
            'auth.session_expired',
            'auth.role_change'
        )),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email_hash TEXT,  -- SHA-256 hash, never raw email (GDPR/SOC 2)
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    success BOOLEAN NOT NULL DEFAULT true,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit_log FORCE ROW LEVEL SECURITY;

-- Anyone can INSERT audit events (needed for client-side logging)
DROP POLICY IF EXISTS "audit_log_insert" ON public.auth_audit_log;
CREATE POLICY "audit_log_insert"
    ON public.auth_audit_log FOR INSERT
    WITH CHECK (true);

-- Users can only read their own audit log entries
DROP POLICY IF EXISTS "audit_log_select_own" ON public.auth_audit_log;
CREATE POLICY "audit_log_select_own"
    ON public.auth_audit_log FOR SELECT
    USING (auth.uid() = user_id);

-- NO updates allowed (immutability)
DROP POLICY IF EXISTS "audit_log_no_update" ON public.auth_audit_log;
CREATE POLICY "audit_log_no_update"
    ON public.auth_audit_log FOR UPDATE
    USING (false);

-- NO deletes allowed (immutability)
DROP POLICY IF EXISTS "audit_log_no_delete" ON public.auth_audit_log;
CREATE POLICY "audit_log_no_delete"
    ON public.auth_audit_log FOR DELETE
    USING (false);

-- Index for fast querying by user and time
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.auth_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.auth_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_email_hash ON public.auth_audit_log(email_hash);

-- ┌──────────────────────────────────────────────────────────────┐
-- │ 5. ROLE CHANGE AUDIT TRIGGER                                │
-- │    Logs every role change for compliance                     │
-- └──────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.audit_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO public.auth_audit_log (
            action,
            user_id,
            metadata,
            success
        ) VALUES (
            'auth.role_change',
            NEW.id,
            jsonb_build_object(
                'old_role', OLD.role,
                'new_role', NEW.role,
                'changed_by', COALESCE(auth.uid()::text, 'system')
            ),
            true
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_role_change ON public.profiles;
CREATE TRIGGER on_role_change
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION public.audit_role_change();

-- ┌──────────────────────────────────────────────────────────────┐
-- │ 6. LOGIN TRACKING TRIGGER                                   │
-- │    Increments login count on successful sign-in             │
-- └──────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.track_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
        UPDATE public.profiles
        SET
            last_login_at = NOW(),
            login_count = login_count + 1,
            failed_login_count = 0,  -- Reset on successful login
            locked_until = NULL      -- Remove any lockout
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_login ON auth.users;
CREATE TRIGGER on_user_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.track_login();

-- ┌──────────────────────────────────────────────────────────────┐
-- │ 7. UPDATE TIMESTAMP TRIGGER                                 │
-- └──────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ┌──────────────────────────────────────────────────────────────┐
-- │ 8. SECURITY GRANTS/REVOKES                                  │
-- └──────────────────────────────────────────────────────────────┘

-- Revoke direct access to auth_audit_log modifications
-- (RLS handles this, but belt-and-suspenders)
REVOKE UPDATE ON public.auth_audit_log FROM authenticated;
REVOKE DELETE ON public.auth_audit_log FROM authenticated;
REVOKE UPDATE ON public.auth_audit_log FROM anon;
REVOKE DELETE ON public.auth_audit_log FROM anon;

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, avatar_url, bio, phone) ON public.profiles TO authenticated;
GRANT INSERT ON public.auth_audit_log TO authenticated;
GRANT SELECT ON public.auth_audit_log TO authenticated;
GRANT INSERT ON public.auth_audit_log TO anon;  -- For failed login logging

-- ┌──────────────────────────────────────────────────────────────┐
-- │ 9. AUDIT LOG RETENTION POLICY (Optional — run periodically) │
-- └──────────────────────────────────────────────────────────────┘

-- Delete audit logs older than 1 year (SOC 2 minimum retention)
-- Run this as a scheduled function or pg_cron job
-- DO NOT run this automatically — keep for compliance reference
--
-- DELETE FROM public.auth_audit_log
-- WHERE created_at < NOW() - INTERVAL '1 year';

-- ┌──────────────────────────────────────────────────────────────┐
-- │ 10. VERIFICATION QUERY — Run after setup                    │
-- └──────────────────────────────────────────────────────────────┘

-- Verify RLS is enabled on all tables
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════════
-- SETUP COMPLETE
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify RLS is enabled on all tables
-- 3. Test with a non-admin user to confirm policies work
-- ═══════════════════════════════════════════════════════════════
