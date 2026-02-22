import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function usePublicStore(slug: string | undefined) {

    const storeQuery = useQuery({
        queryKey: ["public-store", slug],
        queryFn: async () => {
            if (!slug) return null;

            // 1. Fetch the influencer store by slug
            const { data: store, error: storeErr } = await supabase
                .from("influencer_stores")
                .select("*")
                .eq("slug", slug)
                .maybeSingle();

            if (storeErr || !store) return null;

            // 2. Fetch visible links for the store (ordered by position)
            const { data: links } = await supabase
                .from("links")
                .select("id, title, url, short_slug, click_count, is_visible, icon, thumbnail_url, position")
                .eq("store_id", store.id)
                .eq("is_visible", true)
                .order("position", { ascending: true });

            // 3. Fetch active products
            const { data: products } = await supabase
                .from("products")
                .select("id, name, description, price, compare_at_price, image_url, image_emoji, slug, status, stock_count, is_visible")
                .eq("store_id", store.id)
                .eq("status", "active")
                .eq("is_visible", true)
                .order("sort_order", { ascending: true });

            // 4. Fetch the store's custom theme
            const { data: theme } = await supabase
                .from("themes")
                .select("*")
                .eq("store_id", store.id)
                .maybeSingle();

            return { store, links: links || [], products: products || [], theme: theme || null };
        },
        enabled: !!slug,
        staleTime: 30 * 1000,
    });

    const data = storeQuery.data;

    return {
        store: data?.store || null,
        links: data?.links || [],
        products: data?.products || [],
        theme: data?.theme || null,
        isStoreLoading: storeQuery.isLoading,
        isProductsLoading: storeQuery.isLoading,
    };
}
