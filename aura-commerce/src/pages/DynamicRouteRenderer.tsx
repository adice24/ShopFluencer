import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import LinktreePage from "./LinktreePage";

export default function DynamicRouteRenderer() {
    const { username: slug } = useParams();
    const [status, setStatus] = useState<"checking" | "redirect" | "store">("checking");

    useEffect(() => {
        async function resolveSlug() {
            if (!slug) {
                setStatus("store");
                return;
            }

            console.log("Slug received:", slug); // DEBUG

            const { data, error } = await supabase
                .from("short_links")
                .select("id, original_url, clicks")
                .eq("short_code", slug)
                .eq("is_active", true)
                .maybeSingle();

            if (!error && data?.original_url) {
                console.log("Short link found:", data.original_url);

                await supabase
                    .from("short_links")
                    .update({ clicks: (data.clicks || 0) + 1 })
                    .eq("id", data.id);

                setStatus("redirect");
                window.location.replace(data.original_url);
                return;
            }

            console.log("Not a short link, loading store...");
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