# 🛡️ ShopFluence — Security Architecture Document
## SOC 2 Type II / Penetration Test Ready

**Classification:** CONFIDENTIAL  
**Version:** 1.0  
**Last Updated:** 2026-02-20  
**Author:** Security Engineering

---

## Table of Contents
1. [Threat Model — STRIDE Analysis](#1-threat-model)
2. [OWASP Top 10 Mitigation Matrix](#2-owasp-mitigation)
3. [Authentication Architecture](#3-authentication)
4. [Authorization & RLS Policies](#4-authorization)
5. [Attack Surface & Mitigations](#5-attack-mitigations)
6. [Audit Logging Strategy](#6-audit-logging)
7. [Supabase Security Configuration](#7-supabase-config)
8. [Security Checklist for SOC 2](#8-checklist)

---

## 1. Threat Model — STRIDE Analysis {#1-threat-model}

| Threat | Category | Risk | Mitigation |
|--------|----------|------|------------|
| Attacker steals JWT from localStorage | **S**poofing | 🔴 Critical | PKCE flow + secure cookie storage + short-lived tokens (10min) |
| Attacker modifies JWT claims (role escalation) | **T**ampering | 🔴 Critical | Server-side JWT verification + RLS policies (never trust client claims) |
| Attacker denies malicious action | **R**epudiation | 🟡 Medium | Immutable audit_log table with IP, user_agent, action |
| Attacker reads other users' data | **I**nformation Disclosure | 🔴 Critical | Row-Level Security (RLS) on every table — zero trust |
| Attacker floods auth endpoints | **D**enial of Service | 🟠 High | Client rate limiter + Supabase built-in rate limiting |
| Admin role assigned to normal user | **E**levation of Privilege | 🔴 Critical | role column protected by RLS — only service_role can modify |

---

## 2. OWASP Top 10 Mitigation Matrix {#2-owasp-mitigation}

| # | OWASP Category | Status | Implementation |
|---|----------------|--------|----------------|
| A01 | Broken Access Control | ✅ Mitigated | RLS policies on all tables; role-based guards; `auth.uid()` enforced |
| A02 | Cryptographic Failures | ✅ Mitigated | Supabase bcrypt(10) hashing; TLS enforced; no secrets in client code |
| A03 | Injection | ✅ Mitigated | Supabase parameterized queries; DOMPurify sanitization on all inputs |
| A04 | Insecure Design | ✅ Mitigated | PKCE auth flow; defense-in-depth; principle of least privilege |
| A05 | Security Misconfiguration | ✅ Mitigated | CSP headers; strict CORS; disabled debug in production |
| A06 | Vulnerable Components | ✅ Mitigated | `npm audit` in CI; Dependabot; pinned dependency versions |
| A07 | Auth Failures | ✅ Mitigated | Brute-force protection; account lockout; MFA-ready; token rotation |
| A08 | Data Integrity Failures | ✅ Mitigated | JWT signature verification server-side; SRI on CDN scripts |
| A09 | Security Logging | ✅ Mitigated | Immutable `auth_audit_log` table; failed login tracking |
| A10 | SSRF | ✅ Mitigated | No user-supplied URLs processed server-side; OAuth redirect whitelist |

---

## 3. Authentication Architecture {#3-authentication}

### 3.1 Authentication Flow (PKCE)

```
┌──────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                       │
│                                                              │
│  User ──► AuthPage ──► Supabase Auth (PKCE) ──► JWT Issued   │
│            │                                        │        │
│            ├── Email/Password ──► bcrypt(10) verify  │        │
│            ├── Google OAuth ──► PKCE code_verifier   │        │
│            └── Apple OAuth ──► PKCE code_verifier    │        │
│                                                     ▼        │
│                                            Access Token       │
│                                            (10 min TTL)       │
│                                            Refresh Token      │
│                                            (7 day TTL)        │
│                                            Auto-rotation      │
│                                                              │
│  Storage: sessionStorage (not localStorage — XSS hardened)    │
│  PKCE: Prevents auth code interception attacks               │
│  Rotation: One-time-use refresh tokens                       │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Token Lifecycle

| Token | TTL | Storage | Rotation |
|-------|-----|---------|----------|
| Access Token | 10 minutes | In-memory (React state) | On expiry via refresh |
| Refresh Token | 7 days | Supabase managed (HTTP-only cookie in production) | One-time use, auto-rotated |
| PKCE Code Verifier | 60 seconds | sessionStorage (destroyed after exchange) | N/A |

### 3.3 Password Policy (Enforced Server-Side)

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter  
- At least 1 digit
- At least 1 special character (!@#$%^&*)
- Checked against Have I Been Pwned (HIBP) breach database (optional)
- bcrypt cost factor: 10 (Supabase default)

### 3.4 MFA-Ready Architecture

```
  User Login ──► Password Verified ──► MFA Challenge (if enrolled)
                                            │
                                   ┌────────┴────────┐
                                   │   TOTP (App)    │
                                   │   SMS (backup)  │
                                   └─────────────────┘
                                            │
                                     Session Issued
                                     (mfa_verified: true)
```

Supabase supports TOTP natively. Our code is structured to check
`session.user.factors` and enforce MFA verification before granting access.

---

## 4. Authorization & RLS Policies {#4-authorization}

### 4.1 Role Hierarchy

```
ADMIN ────────► Full platform access (via service_role key — never exposed to client)
  │
INFLUENCER ───► Own profile, own storefront, own analytics
  │
CUSTOMER ─────► Own orders, own profile
  │
ANONYMOUS ────► Public endpoints only (products, storefront view)
```

### 4.2 RLS Policy Design Principles

1. **Default deny** — All tables have RLS enabled with no default access
2. **auth.uid() enforcement** — Every policy checks `auth.uid() = user_id`
3. **Role column is READ-ONLY** — Only service_role can UPDATE the role column
4. **No client-side role trust** — RLS policies read role from DB, never from JWT claims
5. **Profiles table** — Users can only UPDATE their own non-sensitive fields

### 4.3 Critical RLS Policies

```sql
-- PROFILES: Users can only read/update their own profile
CREATE POLICY "users_read_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid()) -- prevent role escalation
  );

-- ORDERS: Users only see their own orders
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- AUDIT LOG: Insert-only, no reads except admin
CREATE POLICY "audit_insert" ON auth_audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "audit_no_delete" ON auth_audit_log
  FOR DELETE USING (false); -- immutable
```

---

## 5. Attack Surface & Mitigations {#5-attack-mitigations}

### 5.1 SQL Injection
| Vector | Mitigation |
|--------|------------|
| Form inputs → database queries | Supabase client uses **parameterized queries** exclusively |
| Raw SQL in RPC functions | All functions use `$1, $2` placeholders — never string concatenation |
| URL parameters | Client-side sanitization + server-side validation |

### 5.2 JWT Manipulation
| Vector | Mitigation |
|--------|------------|
| Forging JWT with modified claims | Supabase verifies JWT signature with HS256/RS256 secret |
| Changing `role` claim | RLS policies read role from **database**, not JWT |
| Extending token expiry | Short TTL (10 min); refresh tokens are one-time use |
| Stolen JWT replay | Token bound to session; revocation on sign-out |

### 5.3 Role Escalation
| Vector | Mitigation |
|--------|------------|
| User modifies their own `role` column | RLS WITH CHECK prevents role column changes |
| User calls admin endpoints | RLS denies; client guard redirects; double-checked server-side |
| Service role key leaked | **Never exposed to client**; only used in Edge Functions |

### 5.4 Brute Force
| Vector | Mitigation |
|--------|------------|
| Automated login attempts | Client-side rate limiter (5 attempts → 15min lockout) |
| Distributed brute force | Supabase built-in rate limiting (100 req/hr per IP) |
| Credential stuffing | Generic error ("Invalid credentials") — no user enumeration |
| Password spray | Account lockout after N failures + audit logging |

### 5.5 XSS (Cross-Site Scripting)
| Vector | Mitigation |
|--------|------------|
| Reflected XSS via URL params | React auto-escapes all rendered strings |
| Stored XSS via user input | DOMPurify sanitization on all text inputs before storage |
| DOM-based XSS | No `dangerouslySetInnerHTML`; CSP disables inline scripts |
| Token theft via XSS | Tokens in memory/sessionStorage (not persistent localStorage) |

### 5.6 CSRF (Cross-Site Request Forgery)
| Vector | Mitigation |
|--------|------------|
| Forged POST from attacker's site | Supabase uses Bearer tokens (not cookies for auth) → CSRF-immune |
| OAuth callback hijacking | PKCE code_verifier prevents interception |
| State parameter manipulation | `state` parameter validated in OAuth callback |

---

## 6. Audit Logging Strategy {#6-audit-logging}

### 6.1 Events Logged

| Event | Data Captured | Retention |
|-------|---------------|-----------|
| `auth.sign_up` | email, IP, user_agent, timestamp | 1 year |
| `auth.sign_in` | email, IP, user_agent, method (password/oauth) | 1 year |
| `auth.sign_in_failed` | email_hash, IP, user_agent, failure_reason | 1 year |
| `auth.sign_out` | user_id, IP, timestamp | 1 year |
| `auth.password_reset` | email_hash, IP, timestamp | 1 year |
| `auth.token_refresh` | user_id, timestamp | 90 days |
| `auth.mfa_enroll` | user_id, factor_type | 1 year |
| `auth.role_change` | user_id, old_role, new_role, changed_by | Forever |

### 6.2 Immutability Guarantees

```sql
-- No UPDATE or DELETE allowed on audit log
REVOKE UPDATE, DELETE ON auth_audit_log FROM authenticated;
REVOKE UPDATE, DELETE ON auth_audit_log FROM anon;
-- Only service_role can read for compliance reports
```

---

## 7. Supabase Security Configuration {#7-supabase-config}

### 7.1 Dashboard Settings Checklist

| Setting | Required Value | Location |
|---------|---------------|----------|
| Email confirmations | ✅ ENABLED | Auth → Email → Confirm email |
| Double opt-in | ✅ ENABLED | Auth → Email |
| Secure email change | ✅ ENABLED | Auth → Email |
| Min password length | ✅ 8 characters | Auth → Password |
| Leaked password protection | ✅ ENABLED | Auth → Password |
| Rate limiting | ✅ ENABLED (default) | Built-in |
| RLS enabled on all tables | ✅ REQUIRED | Table editor → each table |
| JWT expiry | ✅ 600 seconds (10 min) | Auth → JWT |
| OAuth PKCE | ✅ ENABLED | Auth → Providers |
| Redirect URL whitelist | ✅ Only your domain | Auth → URL Configuration |

### 7.2 Redirect URL Whitelist

```
https://your-domain.com/*
http://localhost:8080/*          (development only)
http://localhost:5173/*          (development only)
```

**⚠️ NEVER add wildcard `*` as a redirect URL in production.**

---

## 8. Security Checklist for SOC 2 Audit {#8-checklist}

### Access Controls (CC6)
- [x] Unique user identification (UUID per user)
- [x] Password complexity requirements enforced
- [x] Multi-factor authentication available
- [x] Session timeout (10-minute access token)
- [x] Role-based access control (RBAC)
- [x] Principle of least privilege (RLS default deny)
- [x] Account lockout after failed attempts

### Logging & Monitoring (CC7)
- [x] Authentication events logged with IP and user agent
- [x] Failed login attempts tracked
- [x] Audit log is immutable (no UPDATE/DELETE)  
- [x] Logs retained for compliance period (1 year)
- [x] Anomalous login detection (new device/location)

### Risk Management (CC3)
- [x] OWASP Top 10 addressed with specific mitigations
- [x] STRIDE threat model documented
- [x] Penetration test scope defined
- [x] Dependency vulnerability scanning (npm audit)
- [x] Secrets management (env vars, never in code)

### Change Management (CC8)
- [x] Infrastructure as Code (Supabase migrations)
- [x] RLS policies version controlled
- [x] Security review required for auth changes
- [x] Automated testing for auth flows

---

## Appendix A: Penetration Test Scope

### In-Scope
- Authentication endpoints (sign up, sign in, OAuth, password reset)
- JWT token manipulation and replay attacks
- RLS policy bypass attempts
- Role escalation vectors
- Session management (token rotation, revocation)
- Input validation (SQL injection, XSS payloads)
- CSRF attack surface

### Out-of-Scope
- Supabase infrastructure (covered by Supabase SOC 2)
- Physical security
- Social engineering
- Third-party OAuth provider infrastructure

---

*This document should be reviewed quarterly and after any security incident.*
