import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { fetchApi } from "../lib/api";

export function usePublicStore(slug: string | undefined) {
    const location = useLocation();

    // Check if valid store route or username root route
    const isStoreRoute = location.pathname.startsWith('/store/');
    const isRootRoute = location.pathname === `/${slug}`;
    const isValidRoute = isStoreRoute || isRootRoute;

    const storeQuery = useQuery({
        queryKey: ["public-store", slug],
        queryFn: async () => {
            if (!slug || !isValidRoute) return null;
            try {
                // Fetch from NestJS backend
                const response = await fetchApi(`/storefront/${slug}`);
                if (!response.data) throw new Error("Storefront not found");
                return response.data;
            } catch (error) {
                console.error("Failed to fetch storefront:", error);
                throw error;
            }
        },
        enabled: !!slug && isValidRoute,
    });

    const data = storeQuery.data;

    // Transform backend data to match frontend expectations
    const store = data ? {
        id: data.id,
        user_id: data.influencerId,
        slug: data.slug,
        display_name: data.title,
        bio: data.description || data.tagline,
        avatar_url: data.logoUrl || data.influencer?.user?.avatarUrl,
        banner_url: data.bannerUrl,
        themeColor: data.themeColor,
        is_approved: data.status === 'PUBLISHED',
        is_active: data.status === 'PUBLISHED',
        theme: { mode: 'light', ...data.theme }, // mock theme fallback
    } : null;

    const products = data?.products?.map((sp: any) => ({
        id: sp.product.id,
        name: sp.product.name,
        description: sp.product.shortDescription || sp.product.description,
        price: Number(sp.product.basePrice),
        image_url: sp.product.images?.[0]?.url || '',
        category: sp.product.brand?.name,
    })) || [];

    return {
        store,
        isStoreLoading: storeQuery.isLoading,
        products,
        isProductsLoading: storeQuery.isLoading,
        links: [], // Links not yet in new prisma schema, default to empty
        theme: store?.theme || null,
    };
}
