import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { fetchApi, API_URL } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

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
    const [socket, setSocket] = useState<Socket | null>(null);

    // Load initial notifications
    useEffect(() => {
        if (!user) return;

        const loadNotifications = async () => {
            try {
                const data = await fetchApi('/notifications');
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.read).length);
            } catch (error) {
                console.error("Failed to load notifications:", error);
            }
        };

        loadNotifications();
    }, [user]);

    // Connect WebSocket
    useEffect(() => {
        if (!user) {
            if (socket) socket.disconnect();
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const newSocket = io(`${API_URL}/notifications`, {
            auth: { token: `Bearer ${token}` }
        });

        newSocket.on('connect', () => {
            console.log('Connected to notifications WebSocket');
        });

        newSocket.on('notification', (newNotification: Notification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Also show a toast when a new notification comes in
            toast.success(newNotification.title, {
                description: newNotification.message,
            });
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await fetchApi(`/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await fetchApi('/notifications/read-all', { method: 'PATCH' });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    }, []);

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead
    };
}
