import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useLinkAnalytics(storeId: string | undefined) {
    const { data: analytics, isLoading } = useQuery({
        queryKey: ["link-analytics", storeId],
        queryFn: async () => {
            if (!storeId) return null;

            const { data: sf, error: sfErr } = await supabase
                .from("storefronts")
                .select("influencer_id")
                .eq("id", storeId)
                .maybeSingle();
            if (sfErr || !sf) throw sfErr ?? new Error("Store not found");

            const { data: prof, error: pErr } = await supabase
                .from("influencer_profiles")
                .select("user_id")
                .eq("id", sf.influencer_id)
                .maybeSingle();
            if (pErr || !prof?.user_id) throw pErr ?? new Error("Profile not found");

            const uid = prof.user_id;

            const { data: linksData, error: linksError } = await supabase
                .from("short_links")
                .select("id, title, original_url, clicks")
                .eq("user_id", uid);

            if (linksError) throw linksError;

            const list = linksData ?? [];
            const totalClicks = list.reduce((s, l) => s + Number(l.clicks ?? 0), 0);
            const topLinks = [...list]
                .sort((a, b) => Number(b.clicks ?? 0) - Number(a.clicks ?? 0))
                .slice(0, 5)
                .map((l) => ({
                    id: l.id,
                    title: l.title || "Link",
                    url: l.original_url || "",
                    thumbnail_url: null as string | null,
                    clicks: Number(l.clicks ?? 0),
                }));

            return {
                totalClicks,
                topLinks,
            };
        },
        enabled: !!storeId,
    });

    return {
        analytics,
        isLoading,
    };
}
