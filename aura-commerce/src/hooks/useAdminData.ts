/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │  ADMIN DATA HOOK — Platform-wide Queries & Actions          │
 * │  Real-time monitoring for admin panel                       │
 * └──────────────────────────────────────────────────────────────┘
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { InfluencerStore, Order, PlatformStats, Product } from "../lib/types";

/* ── Platform Stats ──────────────────────────────── */

export function usePlatformStats() {
    const queryClient = useQueryClient();

    const statsQuery = useQuery({
        queryKey: ["platform-stats"],
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_platform_stats");
            if (error) throw error;
            return data as PlatformStats;
        },
        refetchInterval: 30000,
    });

    // Live: invalidate on new orders
    useRealtimeSubscription<Order>({
        table: "orders",
        event: "INSERT",
        onEvent: () => {
            queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
        },
    });

    return {
        stats: statsQuery.data,
        isLoading: statsQuery.isLoading,
    };
}

/* ── All Influencers ─────────────────────────────── */

export function useAllInfluencers() {
    const queryClient = useQueryClient();

    const influencersQuery = useQuery({
        queryKey: ["admin-influencers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("influencer_stores")
                .select("*, profiles!influencer_stores_user_id_fkey(email, full_name)")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as (InfluencerStore & { profiles: { email: string; full_name: string } })[];
        },
    });

    // Live updates when stores change
    useRealtimeSubscription<InfluencerStore>({
        table: "influencer_stores",
        onEvent: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-influencers"] });
        },
    });

    // Approve influencer
    const approveInfluencer = useMutation({
        mutationFn: async (storeId: string) => {
            const { error } = await supabase
                .from("influencer_stores")
                .update({ is_approved: true })
                .eq("id", storeId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-influencers"] });
            queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
        },
    });

    // Suspend influencer
    const suspendInfluencer = useMutation({
        mutationFn: async (storeId: string) => {
            const { error } = await supabase
                .from("influencer_stores")
                .update({ is_active: false })
                .eq("id", storeId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-influencers"] });
        },
    });

    return {
        influencers: influencersQuery.data || [],
        isLoading: influencersQuery.isLoading,
        approveInfluencer,
        suspendInfluencer,
    };
}

/* ── All Orders (Admin) ──────────────────────────── */

export function useAllOrders() {
    const queryClient = useQueryClient();

    const ordersQuery = useQuery({
        queryKey: ["admin-orders"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("orders")
                .select("*, influencer_stores(slug, display_name)")
                .order("created_at", { ascending: false })
                .limit(100);
            if (error) throw error;
            return data as (Order & { influencer_stores: { slug: string; display_name: string } })[];
        },
    });

    // Live order feed
    useRealtimeSubscription<Order>({
        table: "orders",
        onEvent: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        },
    });

    return {
        orders: ordersQuery.data || [],
        isLoading: ordersQuery.isLoading,
    };
}

/* ── All Products (Admin) ────────────────────────── */

export function useAllProducts() {
    const productsQuery = useQuery({
        queryKey: ["admin-products"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("products")
                .select("*, influencer_stores(slug, display_name)")
                .order("created_at", { ascending: false })
                .limit(200);
            if (error) throw error;
            return data as (Product & { influencer_stores: { slug: string; display_name: string } })[];
        },
    });

    return {
        products: productsQuery.data || [],
        isLoading: productsQuery.isLoading,
    };
}
