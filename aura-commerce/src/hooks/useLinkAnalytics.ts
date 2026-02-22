import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useLinkAnalytics(storeId: string | undefined) {
    const { data: analytics, isLoading } = useQuery({
        queryKey: ["link-analytics", storeId],
        queryFn: async () => {
            if (!storeId) return null;

            // Fetch total clicks for this store
            const { data: clicksData, error: clicksError } = await supabase
                .from("link_clicks")
                .select("id, created_at, link_id", { count: "exact" })
                .eq("store_id", storeId);

            if (clicksError) throw clicksError;

            // Group by link_id to find top links
            const clickCounts: Record<string, number> = {};
            clicksData?.forEach(click => {
                const linkId = click.link_id;
                clickCounts[linkId] = (clickCounts[linkId] || 0) + 1;
            });

            // Fetch links to map titles
            const { data: linksData, error: linksError } = await supabase
                .from("links")
                .select("id, title, url, thumbnail_url")
                .eq("store_id", storeId);

            if (linksError) throw linksError;

            const topLinks = Object.entries(clickCounts)
                .map(([linkId, count]) => {
                    const link = linksData?.find(l => l.id === linkId);
                    return {
                        id: linkId,
                        title: link?.title || "Unknown Link",
                        url: link?.url || "",
                        thumbnail_url: link?.thumbnail_url || null,
                        clicks: count
                    };
                })
                .sort((a, b) => b.clicks - a.clicks)
                .slice(0, 5); // top 5

            return {
                totalClicks: clicksData?.length || 0,
                topLinks
            };
        },
        enabled: !!storeId,
    });

    return {
        analytics,
        isLoading
    };
}
