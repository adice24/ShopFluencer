import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { getBackendOrigin } from "../lib/api";

type PlatformUpdatePayload = {
    scopes: string[];
    ts: number;
};

/**
 * Maps backend scopes → React Query keys used by admin pages.
 */
function invalidateForScopes(queryClient: QueryClient, scopes: string[]) {
    const set = new Set(scopes);
    const all = set.has("all");

    if (all || set.has("overview")) {
        void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
        void queryClient.invalidateQueries({ queryKey: ["admin-approvals"] });
        void queryClient.invalidateQueries({ queryKey: ["admin-api-health"] });
        void queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    }
    if (all || set.has("approvals")) {
        void queryClient.invalidateQueries({ queryKey: ["admin-approvals"] });
    }
    if (all || set.has("transactions")) {
        void queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
    }
    if (all || set.has("users")) {
        void queryClient.invalidateQueries({ queryKey: ["admin-influencers"] });
        void queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
    }
    if (all || set.has("products")) {
        void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    }
    if (all || set.has("settings")) {
        void queryClient.invalidateQueries({ queryKey: ["admin-setting"] });
    }
}

/**
 * Live updates for the platform admin shell: Socket.IO `platform:update` → refetch admin queries.
 * Uses the httpOnly `admin_token` cookie (same-origin + Vite proxy in dev).
 */
export function useAdminRealtime(enabled: boolean) {
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [lastPushAt, setLastPushAt] = useState<number | null>(null);

    const onUpdate = useCallback(
        (payload: PlatformUpdatePayload) => {
            if (!payload?.scopes?.length) return;
            setLastPushAt(payload.ts ?? Date.now());
            invalidateForScopes(queryClient, payload.scopes);
        },
        [queryClient],
    );

    useEffect(() => {
        if (!enabled) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            setConnected(false);
            return;
        }

        const origin = getBackendOrigin();
        const socket = io(`${origin}/platform-admin`, {
            path: "/socket.io",
            withCredentials: true,
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1500,
        });

        socketRef.current = socket;

        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));
        socket.on("connect_error", () => setConnected(false));
        socket.on("platform:update", onUpdate);

        return () => {
            socket.off("platform:update", onUpdate);
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [enabled, onUpdate]);

    return { connected, lastPushAt };
}
