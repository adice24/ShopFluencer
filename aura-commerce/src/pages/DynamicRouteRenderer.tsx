import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import LinktreePage from "./LinktreePage";

export default function DynamicRouteRenderer() {
    const { slug } = useParams(); // ✅ Correct param
    const [loading, setLoading] = useState(true);
    const [isShortLink, setIsShortLink] = useState(false);

    useEffect(() => {
        async function resolveSlug() {
            if (!slug) {
                setLoading(false);
                return;
            }

            try {
                // 🔎 1️⃣ Check if slug is a short link
                const { data: linkData, error } = await supabase
                    .from("short_links")
                    .select("id, original_url, clicks")
                    .eq("short_code", slug)
                    .eq("is_active", true)
                    .maybeSingle();

                if (!error && linkData?.original_url) {
                    setIsShortLink(true);

                    // 🚀 Increment clicks safely
                    await supabase
                        .from("short_links")
                        .update({ clicks: (linkData.clicks || 0) + 1 })
                        .eq("id", linkData.id);

                    // 📊 Insert analytics
                    await supabase.from("link_clicks").insert({
                        short_link_id: linkData.id,
                        user_agent: navigator.userAgent,
                        created_at: new Date().toISOString(),
                    });

                    // 🔁 Redirect
                    window.location.replace(linkData.original_url);
                    return;
                }

            } catch (err) {
                console.error("Slug resolve error:", err);
            }

            // If not short link → allow LinktreePage to render
            setLoading(false);
        }

        resolveSlug();
    }, [slug]);

    // 🔄 Loading spinner while checking short link
    if (loading && !isShortLink) {
        return (
            <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-[#E5976D] border-t-transparent rounded-full animate-spin" />
                <p className="text-[14px] text-muted-foreground font-medium animate-pulse">
                    Checking link...
                </p>
            </div>
        );
    }

    // 🏪 Not a short link → render influencer page
    return <LinktreePage />;
}