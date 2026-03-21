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
import {
    storefrontRowToInfluencerStore,
    toStorefrontWritePatch,
} from "../lib/storefrontMapper";
import { useCallback } from "react";

function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined)
    ) as Partial<T>;
}

/* ── Store Data ──────────────────────────────────── */

export function useMyStore() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch store data
    const storeQuery = useQuery({
        queryKey: ["my-store", user?.id],
        queryFn: async () => {
            if (!user) return null;
            
            // 1. Get influencer profile
            const { data: profile, error: profileError } = await supabase
                .from("influencer_profiles")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (profileError || !profile) return null;

            // 2. Get storefront
            const { data, error } = await supabase
                .from("storefronts")
                .select("*")
                .eq("influencer_id", profile.id)
                .maybeSingle();

            if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
            return storefrontRowToInfluencerStore(data as Record<string, unknown>);
        },
        enabled: !!user,
    });

    // Listen for store updates
    useRealtimeSubscription<InfluencerStore>({
        table: "storefronts",
        onEvent: (payload) => {
            if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
                queryClient.invalidateQueries({ queryKey: ["my-store", user?.id] });
            }
        },
        enabled: !!user,
    });

    // Create store
    const createStore = useMutation({
        mutationFn: async (
            data: Partial<InfluencerStore> & { slug: string; title?: string; display_name?: string }
        ) => {
            if (!user) throw new Error("Not authenticated");

            // 1. Get or create influencer profile if it doesn't exist
            const { data: profileRow, error: profileError } = await supabase
                .from("influencer_profiles")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            let profile = profileRow;

            if (profileError || !profile) {
                const now = new Date().toISOString();
                const { data: newProfile, error: createError } = await supabase
                    .from("influencer_profiles")
                    .insert({
                        id: crypto.randomUUID(),
                        user_id: user.id,
                        display_name: user.user_metadata?.full_name || "Influencer",
                        updated_at: now,
                    })
                    .select()
                    .single();
                
                if (createError) throw createError;
                profile = newProfile;
            }

            // 2. Re-use existing storefront if present (unique per influencer_id — avoids 23505 / 409)
            const { data: existingStore } = await supabase
                .from("storefronts")
                .select("*")
                .eq("influencer_id", profile!.id)
                .maybeSingle();

            if (existingStore) {
                return storefrontRowToInfluencerStore(
                    existingStore as Record<string, unknown>
                )!;
            }

            // 3. Insert storefront (Prisma columns: title, logo_url, description — not avatar_url / display_name)
            const { slug, title, display_name } = data;
            const titleFinal = title ?? display_name ?? "My Store";
            const ts = new Date().toISOString();
            const mapped = pickDefined(
                toStorefrontWritePatch(data) as Record<string, unknown>
            ) as Record<string, unknown>;
            delete mapped.title;
            delete mapped.slug;

            const { data: store, error } = await supabase
                .from("storefronts")
                .insert({
                    id: crypto.randomUUID(),
                    influencer_id: profile!.id,
                    slug: slug.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                    title: titleFinal,
                    status: "PUBLISHED",
                    updated_at: ts,
                    ...mapped,
                })
                .select()
                .maybeSingle();

            if (error) {
                if (error.code === "23505") {
                    const { data: row } = await supabase
                        .from("storefronts")
                        .select("*")
                        .eq("influencer_id", profile!.id)
                        .maybeSingle();
                    if (row) {
                        return storefrontRowToInfluencerStore(
                            row as Record<string, unknown>
                        )!;
                    }
                }
                throw error;
            }
            if (!store) throw new Error("Could not retrieve created store. Please try again.");
            return storefrontRowToInfluencerStore(store as Record<string, unknown>)!;
        },
        onSuccess: (store) => {
            queryClient.setQueryData(["my-store", user?.id], store);
        },
    });

    // Update store
    const updateStore = useMutation({
        mutationFn: async (updates: Partial<InfluencerStore>) => {
            if (!storeQuery.data) throw new Error("No store found");
            const patch = pickDefined(
                toStorefrontWritePatch(updates) as Record<string, unknown>
            ) as Record<string, unknown>;
            if (Object.keys(patch).length === 0) {
                return storeQuery.data;
            }
            const { data, error } = await supabase
                .from("storefronts")
                .update(patch)
                .eq("id", storeQuery.data.id)
                .select()
                .maybeSingle();
            if (error) throw error;
            if (!data) throw new Error("Could not update store.");
            return storefrontRowToInfluencerStore(data as Record<string, unknown>)!;
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

            /** Load join rows, then products + images in separate queries (same as usePublicStore).
             *  PostgREST embeds can return null for `product` when nested RLS blocks the join. */
            const { data: linkRows, error: linkErr } = await supabase
                .from("storefront_products")
                .select("id, product_id, sort_order")
                .eq("storefront_id", storeId)
                .order("sort_order", { ascending: true });

            if (linkErr) throw linkErr;
            const rowList = linkRows ?? [];
            if (rowList.length === 0) return [];

            const productIds = rowList
                .map((r) => (r as { product_id?: string }).product_id)
                .filter(Boolean) as string[];

            const { data: prodRows, error: pErr } = await supabase
                .from("products")
                .select("*")
                .in("id", productIds);

            if (pErr) throw pErr;

            const { data: imgRows } = await supabase
                .from("product_images")
                .select("product_id, url, is_primary, sort_order")
                .in("product_id", productIds);

            const imgsByProduct = new Map<
                string,
                { url: string; is_primary: boolean; sort_order?: number }[]
            >();
            for (const im of imgRows ?? []) {
                const pid = (im as { product_id: string }).product_id;
                const arr = imgsByProduct.get(pid) ?? [];
                arr.push(
                    im as {
                        url: string;
                        is_primary: boolean;
                        sort_order?: number;
                    }
                );
                imgsByProduct.set(pid, arr);
            }

            const byProductId = new Map(
                (prodRows ?? []).map((p) => [
                    (p as { id: string }).id,
                    p as Record<string, unknown>,
                ])
            );

            function productFromRaw(
                raw: Record<string, unknown>,
                link: { id: string; sort_order?: number },
                imagesOverride?: {
                    url: string;
                    is_primary: boolean;
                    sort_order?: number;
                }[]
            ): Product {
                const imgs =
                    imagesOverride ??
                    ((raw.images as
                        | {
                              url: string;
                              is_primary: boolean;
                              sort_order?: number;
                          }[]
                        | undefined) ?? []);
                const sortedImgs = [...imgs].sort(
                    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
                );
                const primary =
                    sortedImgs.find((i) => i.is_primary) ?? sortedImgs[0];
                const statusRaw = String(raw.status ?? "").toUpperCase();
                const isVisible = statusRaw === "ACTIVE";
                return {
                    id: raw.id as string,
                    store_id: storeId,
                    name: raw.name as string,
                    slug: String(raw.slug ?? ""),
                    description: (raw.description as string) ?? "",
                    price: Number(raw.base_price ?? 0),
                    compare_at_price:
                        raw.compare_at_price != null
                            ? Number(raw.compare_at_price)
                            : null,
                    image_url: primary?.url ?? "",
                    image_emoji: "📦",
                    category_id: (raw.category_id as string) ?? null,
                    category: null,
                    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
                    is_visible: isVisible,
                    is_featured: Boolean(raw.is_featured),
                    is_digital: raw.type === "DIGITAL",
                    status: isVisible ? "active" : "draft",
                    stock_count: -1,
                    sort_order: link.sort_order ?? 0,
                    weight: null,
                    sku: null,
                    external_url: "",
                    metadata: {},
                    created_at: String(raw.created_at ?? ""),
                    updated_at: String(raw.updated_at ?? ""),
                    storefront_item_id: link.id,
                } as Product;
            }

            return rowList
                .map((r) => {
                    const link = r as {
                        id: string;
                        product_id: string;
                        sort_order?: number;
                    };
                    const raw = byProductId.get(link.product_id);
                    if (!raw) return null;
                    const imgs = imgsByProduct.get(link.product_id) ?? [];
                    return productFromRaw(raw, link, imgs);
                })
                .filter(Boolean) as Product[];
        },
        enabled: !!storeId,
    });

    // Real-time product updates (listen to join table)
    useRealtimeSubscription<any>({
        table: "storefront_products",
        onEvent: () => {
            queryClient.invalidateQueries({ queryKey: ["products", storeId] });
        },
        enabled: !!storeId,
    });

    // Add product (This is the favorite/add to store action)
    const addProduct = useMutation({
        mutationFn: async (product: Partial<Product>) => {
            if (!storeId) throw new Error("No store");

            // Check if already added
            const { data: existing } = await supabase
                .from("storefront_products")
                .select("id")
                .eq("storefront_id", storeId)
                .eq("product_id", product.id)
                .maybeSingle();

            if (existing) return existing;

            const { data, error } = await supabase
                .from("storefront_products")
                .insert({
                    storefront_id: storeId,
                    product_id: product.id,
                    sort_order: 0,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", storeId] });
            queryClient.invalidateQueries({ queryKey: ["my-store-products"] });
        },
    });

    // Update sort order on storefront_products (id = join row id)
    const updateProduct = useMutation({
        mutationFn: async ({
            storefrontItemId,
            sort_order,
        }: {
            storefrontItemId: string;
            sort_order?: number;
        }) => {
            const { data, error } = await supabase
                .from("storefront_products")
                .update({ sort_order })
                .eq("id", storefrontItemId)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", storeId] });
        },
    });

    // Delete product (Remove from store)
    const deleteProduct = useMutation({
        mutationFn: async (id: string) => {
            // id here is the product id or storefront entry id? 
            // In MyStore, it passes product.id. 
            // We should ideally pass storefront_item_id.
            const { error } = await supabase
                .from("storefront_products")
                .delete()
                .match({ storefront_id: storeId, product_id: id });
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", storeId] });
            queryClient.invalidateQueries({ queryKey: ["my-store-products"] });
        },
    });

    const toggleVisibilityMutation = useMutation({
        mutationFn: async (productId: string) => {
            const product = productsQuery.data?.find((p) => p.id === productId);
            if (!product) throw new Error("Product not found");
            const next =
                String(product.status).toLowerCase() === "active"
                    ? "DRAFT"
                    : "ACTIVE";
            const { error } = await supabase
                .from("products")
                .update({ status: next })
                .eq("id", productId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", storeId] });
            queryClient.invalidateQueries({ queryKey: ["marketplace-products"] });
        },
    });

    const toggleVisibility = useCallback(
        (id: string) => {
            toggleVisibilityMutation.mutate(id);
        },
        [toggleVisibilityMutation]
    );

    // Reorder products
    const reorderProducts = useMutation({
        mutationFn: async (orderedIds: string[]) => {
            for (let index = 0; index < orderedIds.length; index++) {
                const productId = orderedIds[index];
                const { data: row } = await supabase
                    .from("storefront_products")
                    .select("id")
                    .eq("storefront_id", storeId!)
                    .eq("product_id", productId)
                    .maybeSingle();
                if (row?.id) {
                    await supabase
                        .from("storefront_products")
                        .update({ sort_order: index })
                        .eq("id", row.id);
                }
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", storeId] });
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
