import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import LinktreePage from "./LinktreePage";

export default function DynamicRouteRenderer() {
    const { username: slug } = useParams();

    // Attempt to resolve as a storefront/linktree slug via Supabase
    const { data: redirectUrl, isLoading } = useQuery({
        queryKey: ["short-link", slug],
        queryFn: async () => {
            if (!slug) return null;
            try {
                // Check if it's a short-link code stored in our DB via Supabase
                const { data: linkData, error: linkErr } = await supabase
                    .from("short_links")
                    .select("original_url, id")
                    .eq("short_code", slug)
                    .eq("is_active", true)
                    .maybeSingle();

                if (!linkErr && linkData?.original_url) {
                    // Async increment clicks (fire-and-forget, no await)
                    supabase
                        .from("short_links")
                        .update({ clicks: undefined }) // handled by backend route if needed
                        .eq("id", linkData.id);

                    // Record the click
                    supabase.from("link_clicks").insert({
                        short_link_id: linkData.id,
                        user_agent: navigator.userAgent,
                    });

                    return linkData.original_url;
                }
            } catch (err) {
                console.error("Short link resolve error:", err);
            }
            return null;
        },
        retry: false,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (redirectUrl) {
            window.location.replace(redirectUrl);
        }
    }, [redirectUrl]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-[#E5976D] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (redirectUrl) {
        return (
            <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-[#E5976D] border-t-transparent rounded-full animate-spin" />
                <p className="text-[14px] text-muted-foreground font-medium animate-pulse">Taking you there...</p>
            </div>
        );
    }

    // Otherwise treat slug as influencer username and render their Linktree
    return <LinktreePage />;
}
