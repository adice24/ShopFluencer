/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │  ANALYTICS HOOK — Real-time Event Tracking & Stats          │
 * │  Direct Supabase tracking — no backend dependency           │
 * └──────────────────────────────────────────────────────────────┘
 */

import { useCallback, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

/* ── Visitor ID (persisted per session) ─────────── */
function getVisitorId(): string {
    const key = "sf_visitor_id";
    let id = sessionStorage.getItem(key);
    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(key, id);
    }
    return id;
}

/* ── Track Events — direct Supabase insert ────── */
export function useTrackEvent(storeId: string | undefined) {
    const visitorId = getVisitorId();
    const trackedRef = useRef<Set<string>>(new Set());

    const track = useCallback(
        async (
            eventType: string,
            productId?: string,
            metadata?: Record<string, unknown>
        ) => {
            if (!storeId) return;

            // Deduplicate: don't track the same event+product twice per session
            const key = `${eventType}:${productId || ""}`;
            if (trackedRef.current.has(key)) return;
            trackedRef.current.add(key);

            try {
                await supabase.from("analytics_events").insert({
                    store_id: storeId,
                    event_type: eventType, // "page_view", "product_click", "add_to_cart", "purchase", "PRODUCT_VIEW"
                    product_id: productId || null,
                    visitor_id: visitorId,
                    referrer: document.referrer || "",
                    user_agent: navigator.userAgent,
                    metadata: metadata || {},
                });
            } catch {
                // Silent fail — analytics must never block UX
            }
        },
        [storeId, visitorId]
    );

    return { track };
}

/* ── useAnalyticsDashboard — real-time store stats ─ */
export function useAnalyticsDashboard() {
    // (kept for backward compat — use useStoreStats in Overview instead)
    return { analytics: null, isLoading: false, error: null, refetch: () => { } };
}
