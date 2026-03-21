import { supabase } from "./supabase";

/**
 * In `npm run dev`, always use same-origin `/api/v1` so Vite proxies to Nest.
 * Do not set `VITE_API_URL` for local dev — it forces cross-origin calls, breaks cookies,
 * and bypasses `VITE_PROXY_TARGET`. Production builds use `VITE_API_URL`.
 */
function buildApiBase(): string {
    if (import.meta.env.DEV) {
        return "/api/v1";
    }
    const env = import.meta.env.VITE_API_URL?.trim();
    if (env) {
        const trimmed = env.replace(/\/?$/, "");
        return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
    }
    return "http://localhost:3000/api/v1";
}

const rawApi = buildApiBase();

/** Nest `TransformInterceptor` wraps payloads as `{ success, data, ... }` unless the body already has `success`. */
export function unwrapNestResponse<T>(json: unknown): T {
    if (
        json &&
        typeof json === "object" &&
        "success" in json &&
        (json as { success: unknown }).success === true &&
        "data" in json &&
        (json as { data: unknown }).data !== undefined
    ) {
        return (json as { data: T }).data;
    }
    return json as T;
}

/** REST base, e.g. `/api/v1` or `https://api.example.com/api/v1` */
export const API_URL = rawApi;

/** HTTP origin for Socket.IO (no `/api/v1` path). */
export function getBackendOrigin(): string {
    const explicit = import.meta.env.VITE_BACKEND_URL;
    if (explicit) {
        return explicit.replace(/\/$/, "");
    }
    if (import.meta.env.DEV) {
        return `${window.location.protocol}//${window.location.host}`;
    }
    try {
        return new URL(API_URL).origin;
    } catch {
        return "http://localhost:3000";
    }
}

/** Cookie-based platform admin session (Nest JWT). */
export type AdminSessionResult = {
    authenticated: boolean;
    user?: { id?: string; email?: string; role?: string };
    offline?: boolean;
};

export async function fetchAdminSession(): Promise<AdminSessionResult> {
    try {
        const res = await fetch(`${API_URL}/admin/auth/me`, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        if (res.status === 401) {
            return { authenticated: false };
        }
        if (!res.ok) {
            return { authenticated: false, offline: true };
        }
        const json = await res.json();
        const payload = unwrapNestResponse<AdminSessionResult>(json);
        return {
            authenticated: !!payload?.authenticated,
            user: payload?.user,
            offline: false,
        };
    } catch {
        return { authenticated: false, offline: true };
    }
}

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = API_URL;

    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
    });

    if (!res.ok) {
        let errorData = null;
        try {
            errorData = await res.json();
        } catch {
            // Ignore non-json responses
        }
        throw new Error(errorData?.message || `API Error: ${res.statusText}`);
    }

    const json = await res.json();
    return unwrapNestResponse(json);
};

/**
 * Platform admin API (`/admin/*`). Uses httpOnly `admin_token` only — do not send Supabase JWT.
 * If both are sent and the cookie is missing, the guard would try to verify the Supabase token as an admin JWT.
 */
export async function fetchAdminApi(endpoint: string, options: RequestInit = {}) {
    const baseUrl = API_URL;
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
    });

    if (!res.ok) {
        let errorData: { message?: string } | null = null;
        try {
            errorData = await res.json();
        } catch {
            // ignore
        }
        throw new Error(errorData?.message || `API Error: ${res.statusText}`);
    }

    const json = await res.json();
    return unwrapNestResponse(json);
}
