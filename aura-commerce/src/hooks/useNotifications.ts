import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { fetchApi, getBackendOrigin } from "../lib/api";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef<Socket | null>(null);
    const cancelledRef = useRef(false);

    useEffect(() => {
        if (!user) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        cancelledRef.current = false;

        void (async () => {
            try {
                const data = await fetchApi("/notifications");
                if (cancelledRef.current) return;
                const list = Array.isArray(data) ? data : [];
                setNotifications(list);
                setUnreadCount(list.filter((n: Notification) => !n.read).length);
            } catch {
                /* Nest API not running — skip WebSocket entirely (no console spam) */
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (cancelledRef.current || !session?.access_token) return;

            const newSocket = io(`${getBackendOrigin()}/notifications`, {
                auth: { token: `Bearer ${session.access_token}` },
                transports: ["polling", "websocket"],
                reconnectionAttempts: 2,
                reconnectionDelay: 4000,
            });

            if (cancelledRef.current) {
                newSocket.disconnect();
                return;
            }

            socketRef.current = newSocket;

            newSocket.on("notification", (newNotification: Notification) => {
                setNotifications((prev) => [newNotification, ...prev]);
                setUnreadCount((prev) => prev + 1);
                toast.success(newNotification.title, {
                    description: newNotification.message,
                });
            });
        })();

        return () => {
            cancelledRef.current = true;
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [user]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await fetchApi(`/notifications/${id}/read`, { method: "PATCH" });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await fetchApi("/notifications/read-all", { method: "PATCH" });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    }, []);

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
    };
}
