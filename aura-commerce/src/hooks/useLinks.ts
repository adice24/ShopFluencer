import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Link } from "../lib/types";
import { toast } from "sonner";
import { useEffect } from "react";
import {
    shortLinkRowToLink,
    generateShortCode,
} from "../lib/shortLinkMapper";

export function useLinks(userId: string | undefined, _storeId?: string | undefined) {
    const queryClient = useQueryClient();

    const { data: links = [], isLoading } = useQuery({
        queryKey: ["links", userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from("short_links")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            return (data ?? []).map((row) =>
                shortLinkRowToLink(row as Record<string, unknown>)
            );
        },
        enabled: !!userId,
    });

    const createLink = useMutation({
        mutationFn: async (newLink: Partial<Link> & { url?: string }) => {
            if (!userId) throw new Error("User ID is required to create a link");

            const now = new Date().toISOString();
            let short_code = "";
            for (let attempt = 0; attempt < 12; attempt++) {
                short_code = generateShortCode(8);
                const { data: clash } = await supabase
                    .from("short_links")
                    .select("id")
                    .eq("short_code", short_code)
                    .maybeSingle();
                if (!clash) break;
                if (attempt === 11) throw new Error("Could not allocate short code");
            }

            const { data, error } = await supabase
                .from("short_links")
                .insert({
                    id: crypto.randomUUID(),
                    user_id: userId,
                    title: newLink.title?.trim() || "Link",
                    original_url: newLink.url || "https://example.com",
                    short_code,
                    clicks: 0,
                    is_active: true,
                    updated_at: now,
                })
                .select()
                .single();

            if (error) throw error;
            return shortLinkRowToLink(data as Record<string, unknown>);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", userId] });
            toast.success("Link added successfully");
        },
        onError: (err: Error) => {
            toast.error(err.message || "Failed to add link");
        },
    });

    const updateLink = useMutation({
        mutationFn: async ({
            id,
            updates,
        }: {
            id: string;
            updates: Partial<Link>;
        }) => {
            const patch: Record<string, unknown> = {
                updated_at: new Date().toISOString(),
            };
            if (updates.title !== undefined) patch.title = updates.title;
            if (updates.url !== undefined) patch.original_url = updates.url;
            if (updates.is_visible !== undefined) patch.is_active = updates.is_visible;

            const { data, error } = await supabase
                .from("short_links")
                .update(patch)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return shortLinkRowToLink(data as Record<string, unknown>);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", userId] });
        },
        onError: (err: Error) => {
            toast.error(err.message || "Failed to update link");
        },
    });

    const deleteLink = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("short_links").delete().eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", userId] });
            toast.success("Link removed");
        },
        onError: (err: Error) => {
            toast.error(err.message || "Failed to remove link");
        },
    });

    const reorderLinks = useMutation({
        mutationFn: async (_orderedLinks: { id: string; position: number }[]) => {
            /* Prisma short_links has no position column */
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", userId] });
        },
    });

    const toggleVisibility = useMutation({
        mutationFn: async ({
            id,
            is_visible,
        }: {
            id: string;
            is_visible: boolean;
        }) => {
            const { data, error } = await supabase
                .from("short_links")
                .update({
                    is_active: is_visible,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", userId] });
        },
    });

    const trackClick = async (linkId: string) => {
        const { data: row } = await supabase
            .from("short_links")
            .select("clicks")
            .eq("id", linkId)
            .maybeSingle();
        const n = Number((row as { clicks?: number })?.clicks ?? 0);
        await supabase
            .from("short_links")
            .update({
                clicks: n + 1,
                updated_at: new Date().toISOString(),
            })
            .eq("id", linkId);
    };

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel("public:short_links")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "short_links",
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["links", userId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, queryClient]);

    return {
        links,
        isLoading,
        createLink,
        updateLink,
        deleteLink,
        reorderLinks,
        toggleVisibility,
        trackClick,
    };
}
