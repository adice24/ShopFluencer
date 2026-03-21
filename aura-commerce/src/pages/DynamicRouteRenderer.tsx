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
            const { data: link, error } = await supabase
                .from("short_links")
                .select("id, original_url, clicks, is_active")
                .eq("short_code", slug)
                .eq("is_active", true)
                .maybeSingle();

            if (!error && link?.original_url) {
                const n = Number((link as { clicks?: number }).clicks ?? 0);
                supabase
                    .from("short_links")
                    .update({
                        clicks: n + 1,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", (link as { id: string }).id)
                    .then(() => {});

                supabase
                    .from("link_clicks")
                    .insert({
                        id: crypto.randomUUID(),
                        short_link_id: (link as { id: string }).id,
                        user_agent: navigator.userAgent,
                        referrer: document.referrer || null,
                    })
                    .then(() => {});

                setStatus("redirect");
                window.location.replace(String((link as { original_url: string }).original_url));
                return;
            }

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
