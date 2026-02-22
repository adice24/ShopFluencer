import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

            try {
                const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
                const response = await fetch(`${API_URL}/r/resolve/${slug}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data?.originalUrl) {
                        console.log("Short link found via API:", data.originalUrl);
                        setStatus("redirect");
                        window.location.replace(data.originalUrl);
                        return;
                    }
                }
            } catch (err) {
                console.error("Error resolving shortlink:", err);
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