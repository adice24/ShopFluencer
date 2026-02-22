import { supabase } from './supabase';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = API_URL;

    // Add default headers without overriding custom ones
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
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

    return res.json();
};
