/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │  ANALYTICS HOOK — Real-time Event Tracking & Stats          │
 * │  Tracks: page views, clicks, cart events, purchases         │
 * └──────────────────────────────────────────────────────────────┘
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useVisitorId } from "./useRealtimeSubscription";
import { fetchApi } from "../lib/api";
import type { AnalyticsEventType } from "../lib/types";

/* ── Device Parsing Helper ────────────────────── */
function getDeviceType() {
    if (typeof navigator === "undefined") return "Unknown";
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "Tablet";
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return "Mobile";
    }
    return "Desktop";
}

/* ── Track Events (fire and forget) ──────────────── */

export function useTrackEvent(storeId: string | undefined) {
    const visitorId = useVisitorId();
    const ipRef = useRef<string | null>(null);

    useEffect(() => {
        if (!ipRef.current) {
            fetch("https://api.ipify.org?format=json")
                .then(res => res.json())
                .then(data => {
                    ipRef.current = data.ip;
                })
                .catch(() => { /* silent fail */ });
        }
    }, []);

    const track = useCallback(
        async (eventType: AnalyticsEventType, productId?: string, metadata?: Record<string, unknown>) => {
            if (!storeId) return;

            try {
                const device = getDeviceType();
                const ip = ipRef.current || 'unknown';

                // Map analytics event to Backend enum format
                let mappedEventType = "STOREFRONT_VIEW";
                if (eventType === "page_view") mappedEventType = "STOREFRONT_VIEW";
                if (eventType === "product_click") mappedEventType = "PRODUCT_CLICK";
                if (eventType === "add_to_cart") mappedEventType = "ADD_TO_CART";
                if (eventType === "checkout_start") mappedEventType = "CHECKOUT_START";
                if (eventType === "purchase") mappedEventType = "PURCHASE";

                await fetchApi("/analytics/track", {
                    method: "POST",
                    body: JSON.stringify({
                        eventType: mappedEventType,
                        influencerId: storeId, // using storeId as influencerId dynamically
                        productId: productId || undefined,
                        visitorId: visitorId,
                        metadata: {
                            ...metadata,
                            device,
                            ip,
                        }
                    })
                });
            } catch {
                // Silent fail — analytics should never block UX
            }
        },
        [storeId, visitorId]
    );

    return { track };
}

/* ── Analytics Dashboard Data ────────────────────── */

export function useAnalyticsDashboard() {
    const queryClient = useQueryClient();

    const analyticsQuery = useQuery({
        queryKey: ["analytics", "influencer"],
        queryFn: async () => {
            const response = await fetchApi("/analytics/influencer");
            return response.data;
        },
        refetchInterval: 60000, // Refresh every 60s
    });

    return {
        analytics: analyticsQuery.data,
        isLoading: analyticsQuery.isLoading,
        error: analyticsQuery.error,
        refetch: analyticsQuery.refetch,
    };
}
