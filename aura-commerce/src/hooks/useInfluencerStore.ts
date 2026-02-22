/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │  INFLUENCER STORE HOOK — Real-time Product Management       │
 * │  CRUD + Realtime + Optimistic Updates                       │
 * └──────────────────────────────────────────────────────────────┘
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { InfluencerStore, Product, StoreStats } from "../lib/types";
import { useCallback } from "react";

/* ── Store Data ──────────────────────────────────── */

export function useMyStore() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch store data
    const storeQuery = useQuery({
        queryKey: ["my-store", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase
                .from("influencer_stores")
                .select("*")
                .eq("user_id", user.id)
                .single();
            if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
            return (data as InfluencerStore) || null;
        },
        enabled: !!user,
    });

    // Listen for store updates (e.g., admin approval)
    useRealtimeSubscription<InfluencerStore>({
        table: "influencer_stores",
        filter: user ? `user_id=eq.${user.id}` : undefined,
        onEvent: (payload) => {
            if (payload.eventType === "UPDATE") {
                queryClient.setQueryData(["my-store", user?.id], payload.new);
            }
        },
        enabled: !!user,
    });

    // Create store
    const createStore = useMutation({
        mutationFn: async (data: Partial<InfluencerStore> & { slug: string; display_name: string }) => {
            if (!user) throw new Error("Not authenticated");

            // Extract the required fields and whatever else is passed
            const { slug, display_name, ...rest } = data;

            const { data: store, error } = await supabase
                .from("influencer_stores")
                .insert({
                    user_id: user.id,
                    slug: slug.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                    display_name: display_name,
                    ...rest
                })
                .select()
                .maybeSingle();
            if (error) throw error;
            if (!store) throw new Error("Could not retrieve created store. Please try again.");
            return store as InfluencerStore;
        },
        onSuccess: (store) => {
            queryClient.setQueryData(["my-store", user?.id], store);
        },
    });

    // Update store
    const updateStore = useMutation({
        mutationFn: async (updates: Partial<InfluencerStore>) => {
            if (!storeQuery.data) throw new Error("No store found");
            const { data, error } = await supabase
                .from("influencer_stores")
                .update(updates)
                .eq("id", storeQuery.data.id)
                .select()
                .maybeSingle();
            if (error) throw error;
            if (!data) throw new Error("Could not update store.");
            return data as InfluencerStore;
        },
        onMutate: async (updates) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ["my-store", user?.id] });
            const previous = queryClient.getQueryData(["my-store", user?.id]);
            queryClient.setQueryData(["my-store", user?.id], (old: InfluencerStore | null) =>
                old ? { ...old, ...updates } : old
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            queryClient.setQueryData(["my-store", user?.id], context?.previous);
        },
    });

    return {
        store: storeQuery.data,
        isLoading: storeQuery.isLoading,
        error: storeQuery.error,
        createStore,
        updateStore,
    };
}

/* ── Products ────────────────────────────────────── */

export function useProducts(storeId: string | undefined) {
    const queryClient = useQueryClient();

    const productsQuery = useQuery({
        queryKey: ["products", storeId],
        queryFn: async () => {
            if (!storeId) return [];
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("store_id", storeId)
                .order("sort_order", { ascending: true });
            if (error) throw error;
            return (data as Product[]) || [];
        },
        enabled: !!storeId,
    });

    // Real-time product updates
    useRealtimeSubscription<Product>({
        table: "products",
        filter: storeId ? `store_id=eq.${storeId}` : undefined,
        onEvent: (payload) => {
            queryClient.setQueryData(["products", storeId], (old: Product[] | undefined) => {
                if (!old) return old;
                switch (payload.eventType) {
                    case "INSERT":
                        return [...old, payload.new as Product].sort((a, b) => a.sort_order - b.sort_order);
                    case "UPDATE":
                        return old
                            .map((p) => (p.id === (payload.new as Product).id ? (payload.new as Product) : p))
                            .sort((a, b) => a.sort_order - b.sort_order);
                    case "DELETE":
                        return old.filter((p) => p.id !== (payload.old as Product).id);
                    default:
                        return old;
                }
            });
        },
        enabled: !!storeId,
    });

    // Add product
    const addProduct = useMutation({
        mutationFn: async (product: Partial<Product>) => {
            if (!storeId) throw new Error("No store");

            // Auto-generate slug and fallback if name doesn't exist yet
            const baseSlug = (product.name || `product-${Math.floor(Math.random() * 1000)}`)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "");
            const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

            const { data, error } = await supabase
                .from("products")
                .insert({ ...product, slug: uniqueSlug, store_id: storeId })
                .select()
                .single();
            if (error) throw error;
            return data as Product;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", storeId] });
        },
    });

    // Update product
    const updateProduct = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
            const { data, error } = await supabase
                .from("products")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data as Product;
        },
        onMutate: async ({ id, ...updates }) => {
            await queryClient.cancelQueries({ queryKey: ["products", storeId] });
            const previous = queryClient.getQueryData<Product[]>(["products", storeId]);
            queryClient.setQueryData(["products", storeId], (old: Product[] | undefined) =>
                old?.map((p) => (p.id === id ? { ...p, ...updates } : p))
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            queryClient.setQueryData(["products", storeId], context?.previous);
        },
    });

    // Delete product
    const deleteProduct = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("products").delete().eq("id", id);
            if (error) throw error;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["products", storeId] });
            const previous = queryClient.getQueryData<Product[]>(["products", storeId]);
            queryClient.setQueryData(["products", storeId], (old: Product[] | undefined) =>
                old?.filter((p) => p.id !== id)
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            queryClient.setQueryData(["products", storeId], context?.previous);
        },
    });

    // Toggle visibility (optimistic)
    const toggleVisibility = useCallback(
        async (id: string) => {
            const product = productsQuery.data?.find((p) => p.id === id);
            if (!product) return;
            updateProduct.mutate({ id, is_visible: !product.is_visible });
        },
        [productsQuery.data, updateProduct]
    );

    // Reorder products
    const reorderProducts = useMutation({
        mutationFn: async (orderedIds: string[]) => {
            const updates = orderedIds.map((id, index) => ({
                id,
                sort_order: index,
            }));
            // Batch update sort orders
            for (const update of updates) {
                await supabase
                    .from("products")
                    .update({ sort_order: update.sort_order })
                    .eq("id", update.id);
            }
        },
        onMutate: async (orderedIds) => {
            await queryClient.cancelQueries({ queryKey: ["products", storeId] });
            const previous = queryClient.getQueryData<Product[]>(["products", storeId]);
            queryClient.setQueryData(["products", storeId], (old: Product[] | undefined) => {
                if (!old) return old;
                return orderedIds
                    .map((id, idx) => {
                        const product = old.find((p) => p.id === id);
                        return product ? { ...product, sort_order: idx } : null;
                    })
                    .filter(Boolean) as Product[];
            });
            return { previous };
        },
        onError: (_err, _vars, context) => {
            queryClient.setQueryData(["products", storeId], context?.previous);
        },
    });

    return {
        products: productsQuery.data || [],
        isLoading: productsQuery.isLoading,
        error: productsQuery.error,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleVisibility,
        reorderProducts,
    };
}

/* ── Store Stats ─────────────────────────────────── */

export function useStoreStats(storeId: string | undefined) {
    const queryClient = useQueryClient();

    const statsQuery = useQuery({
        queryKey: ["store-stats", storeId],
        queryFn: async () => {
            if (!storeId) return null;
            const { data, error } = await supabase.rpc("get_store_stats", { p_store_id: storeId });
            if (error) throw error;
            return data as StoreStats;
        },
        enabled: !!storeId,
        refetchInterval: 30000, // Refresh every 30s as backup
    });

    // Invalidate stats on new orders or analytics
    useRealtimeSubscription({
        table: "orders",
        filter: storeId ? `store_id=eq.${storeId}` : undefined,
        event: "INSERT",
        onEvent: () => {
            queryClient.invalidateQueries({ queryKey: ["store-stats", storeId] });
        },
        enabled: !!storeId,
    });

    useRealtimeSubscription({
        table: "analytics_events",
        filter: storeId ? `store_id=eq.${storeId}` : undefined,
        event: "INSERT",
        onEvent: () => {
            // Debounced invalidation (analytics events are high-frequency)
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["store-stats", storeId] });
            }, 2000);
        },
        enabled: !!storeId,
    });

    return {
        stats: statsQuery.data,
        isLoading: statsQuery.isLoading,
        refetch: statsQuery.refetch,
    };
}
