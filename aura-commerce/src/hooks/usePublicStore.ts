import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { storefrontRowToInfluencerStore } from "../lib/storefrontMapper";
import { shortLinkRowToLink } from "../lib/shortLinkMapper";
import { themeForPublicPage } from "../lib/linktreeTheme";
import type { Product } from "../lib/types";

export function usePublicStore(slug: string | undefined) {
    const storeQuery = useQuery({
        queryKey: ["public-store", slug],
        queryFn: async () => {
            if (!slug) return null;

            const { data: sf, error: storeErr } = await supabase
                .from("storefronts")
                .select(
                    "id, slug, title, description, logo_url, theme_color, custom_css, influencer_id, created_at, updated_at"
                )
                .eq("slug", slug)
                .maybeSingle();

            if (storeErr || !sf) return null;

            const { data: profile } = await supabase
                .from("influencer_profiles")
                .select("user_id")
                .eq("id", sf.influencer_id)
                .maybeSingle();

            const authUid = profile?.user_id;
            if (!authUid) return null;

            const store = storefrontRowToInfluencerStore(
                sf as unknown as Record<string, unknown>
            );

            const { data: linkRows } = await supabase
                .from("short_links")
                .select("*")
                .eq("user_id", authUid)
                .eq("is_active", true)
                .order("created_at", { ascending: true });

            const links = (linkRows ?? []).map((row) =>
                shortLinkRowToLink(row as Record<string, unknown>)
            );

            let products: Product[] = [];
            const { data: sfp } = await supabase
                .from("storefront_products")
                .select("product_id, sort_order")
                .eq("storefront_id", sf.id)
                .order("sort_order", { ascending: true });

            const pids = sfp?.map((r) => r.product_id).filter(Boolean) ?? [];
            if (pids.length > 0) {
                const { data: prodRows } = await supabase
                    .from("products")
                    .select(
                        "id, name, slug, description, short_description, base_price, compare_at_price, status"
                    )
                    .in("id", pids)
                    .eq("status", "ACTIVE");

                const { data: imgRows } = await supabase
                    .from("product_images")
                    .select("product_id, url, is_primary, sort_order")
                    .in("product_id", pids);

                const imgsByProduct = new Map<string, typeof imgRows>();
                for (const im of imgRows ?? []) {
                    const pid = im.product_id as string;
                    const arr = imgsByProduct.get(pid) ?? [];
                    arr.push(im);
                    imgsByProduct.set(pid, arr);
                }

                const byId = new Map((prodRows ?? []).map((p) => [p.id, p]));
                products = pids
                    .map((id) => byId.get(id))
                    .filter(Boolean)
                    .map((row) => {
                        const images = imgsByProduct.get(row!.id as string) ?? [];
                        const sorted = [...images].sort(
                            (a, b) =>
                                (a.sort_order ?? 0) - (b.sort_order ?? 0)
                        );
                        const primary =
                            sorted.find((i) => i.is_primary) ?? sorted[0];
                        return {
                            id: row!.id,
                            store_id: String(sf.id),
                            slug: row!.slug,
                            name: row!.name,
                            description: (row!.description ??
                                row!.short_description ??
                                "") as string,
                            price: Number(row!.base_price),
                            compare_at_price:
                                row!.compare_at_price != null
                                    ? Number(row!.compare_at_price)
                                    : null,
                            image_url: primary?.url ?? "",
                            image_emoji: "",
                            category_id: null,
                            category: null,
                            tags: [],
                            is_visible: true,
                            is_featured: false,
                            is_digital: false,
                            status: "active" as const,
                            stock_count: 0,
                            sort_order: 0,
                            weight: null,
                            sku: null,
                            external_url: "",
                            metadata: {},
                            created_at: "",
                            updated_at: "",
                        };
                    });
            }

            const theme = themeForPublicPage({
                id: sf.id,
                theme_color: sf.theme_color,
                custom_css: sf.custom_css,
            });

            return { store, links, products, theme };
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
