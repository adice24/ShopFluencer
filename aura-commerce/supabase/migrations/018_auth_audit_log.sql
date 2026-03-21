-- ═══════════════════════════════════════════════════════════════
-- Immutable security audit log (client inserts from security.ts).
-- Safe if 001_security_setup.sql already ran (IF NOT EXISTS / DROP IF EXISTS).
-- Run in Supabase SQL Editor if you see: PGRST205 / relation "auth_audit_log" does not exist
-- ═══════════════════════════════════════════════════════════════

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
    email_hash TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    success BOOLEAN NOT NULL DEFAULT true,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit_log FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_insert" ON public.auth_audit_log;
CREATE POLICY "audit_log_insert"
    ON public.auth_audit_log FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "audit_log_select_own" ON public.auth_audit_log;
CREATE POLICY "audit_log_select_own"
    ON public.auth_audit_log FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "audit_log_no_update" ON public.auth_audit_log;
CREATE POLICY "audit_log_no_update"
    ON public.auth_audit_log FOR UPDATE
    USING (false);

DROP POLICY IF EXISTS "audit_log_no_delete" ON public.auth_audit_log;
CREATE POLICY "audit_log_no_delete"
    ON public.auth_audit_log FOR DELETE
    USING (false);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.auth_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.auth_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_email_hash ON public.auth_audit_log(email_hash);

REVOKE UPDATE ON public.auth_audit_log FROM authenticated;
REVOKE DELETE ON public.auth_audit_log FROM authenticated;
REVOKE UPDATE ON public.auth_audit_log FROM anon;
REVOKE DELETE ON public.auth_audit_log FROM anon;

GRANT INSERT ON public.auth_audit_log TO authenticated;
GRANT SELECT ON public.auth_audit_log TO authenticated;
GRANT INSERT ON public.auth_audit_log TO anon;

NOTIFY pgrst, 'reload schema';
