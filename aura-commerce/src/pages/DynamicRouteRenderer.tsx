import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import LinktreePage from "./LinktreePage";

export default function DynamicRouteRenderer() {
    const { username: slug } = useParams();
    const [status, setStatus] = useState<"checking" | "redirect" | "store">("checking");

    useEffect(() => {
        if (!slug) {
            setStatus("store");
            return;
        }

        async function resolveSlug() {
            // ── Check the `links` table (where short_slug = slug) ──────────
            const { data: link, error } = await supabase
                .from("links")
                .select("id, url, click_count, store_id, user_id")
                .eq("short_slug", slug)
                .eq("is_visible", true)
                .maybeSingle();

            if (!error && link?.url) {
                // Fire-and-forget click tracking (don't block the redirect)
                supabase
                    .from("links")
                    .update({ click_count: (link.click_count || 0) + 1 })
                    .eq("id", link.id)
                    .then(() => { });

                // Also record in link_clicks for analytics
                supabase
                    .from("link_clicks")
                    .insert({
                        link_id: link.id,
                        store_id: link.store_id,
                        user_id: link.user_id,
                        user_agent: navigator.userAgent,
                        ip_address: "",
                        referer: document.referrer || "",
                        country: "",
                    })
                    .then(() => { });

                setStatus("redirect");
                window.location.replace(link.url);
                return;
            }

            // ── Not a short link → try as an influencer store slug ─────────
            setStatus("store");
        }

        resolveSlug();
    }, [slug]);

    if (status === "checking") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (status === "redirect") {
        return null;
    }

    return <LinktreePage />;
}