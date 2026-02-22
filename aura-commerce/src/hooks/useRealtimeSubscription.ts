/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │  REALTIME SUBSCRIPTION HOOK                                  │
 * │  Supabase Realtime → React state sync                       │
 * │  Automatically subscribes/unsubscribes on mount/unmount     │
 * └──────────────────────────────────────────────────────────────┘
 */

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type PostgresEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeSubscriptionOptions<T extends { [key: string]: any }> {
    /** Supabase table name */
    table: string;
    /** Optional schema (default: public) */
    schema?: string;
    /** Which events to listen for */
    event?: PostgresEvent;
    /** Column filter (e.g., "store_id=eq.abc123") */
    filter?: string;
    /** Callback when event occurs */
    onEvent: (
        payload: RealtimePostgresChangesPayload<T>
    ) => void;
    /** Whether the subscription is enabled */
    enabled?: boolean;
}

/**
 * Low-level hook for Supabase Realtime subscriptions.
 *
 * Usage:
 * ```tsx
 * useRealtimeSubscription({
 *   table: "products",
 *   filter: `store_id=eq.${storeId}`,
 *   onEvent: (payload) => {
 *     if (payload.eventType === "INSERT") {
 *       setProducts(prev => [...prev, payload.new]);
 *     }
 *   }
 * });
 * ```
 */
export function useRealtimeSubscription<T extends { [key: string]: any }>({
    table,
    schema = "public",
    event = "*",
    filter,
    onEvent,
    enabled = true,
}: UseRealtimeSubscriptionOptions<T>) {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const callbackRef = useRef(onEvent);
    callbackRef.current = onEvent;

    useEffect(() => {
        if (!enabled) return;

        const channelName = `realtime:${schema}:${table}:${filter || "all"}:${event}`;

        // Build channel config
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const channelConfig: any = {
            event,
            schema,
            table,
        };

        if (filter) {
            channelConfig.filter = filter;
        }

        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                channelConfig,
                (payload: RealtimePostgresChangesPayload<T>) => {
                    callbackRef.current(payload);
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [table, schema, event, filter, enabled]);
}

/**
 * Hook for subscribing to multiple tables at once.
 * Useful for dashboard pages that need to listen to products + orders + analytics.
 */
export function useMultiRealtimeSubscription(
    subscriptions: Array<{
        table: string;
        filter?: string;
        event?: PostgresEvent;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onEvent: (payload: RealtimePostgresChangesPayload<any>) => void;
    }>,
    enabled = true
) {
    useEffect(() => {
        if (!enabled || subscriptions.length === 0) return;

        const channelName = `multi:${subscriptions.map(s => s.table).join("+")}`;

        let channel = supabase.channel(channelName);

        for (const sub of subscriptions) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const config: any = {
                event: sub.event || "*",
                schema: "public",
                table: sub.table,
            };
            if (sub.filter) config.filter = sub.filter;

            channel = channel.on("postgres_changes", config, sub.onEvent);
        }

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, JSON.stringify(subscriptions.map(s => `${s.table}:${s.filter || ""}:${s.event || "*"}`))]);
}

/**
 * Generates a deterministic visitor ID for anonymous analytics tracking.
 * Uses a combination of browser fingerprinting signals (no PII).
 */
export function useVisitorId(): string {
    const getVisitorId = useCallback(() => {
        const stored = sessionStorage.getItem("sf_visitor_id");
        if (stored) return stored;

        // Simple fingerprint (no PII)
        const signals = [
            navigator.language,
            screen.width,
            screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 0,
        ].join("|");

        // Simple hash
        let hash = 0;
        for (let i = 0; i < signals.length; i++) {
            const char = signals.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }

        const visitorId = `v_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
        sessionStorage.setItem("sf_visitor_id", visitorId);
        return visitorId;
    }, []);

    return getVisitorId();
}
