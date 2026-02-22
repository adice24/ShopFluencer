import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Link, RealtimeEvent } from "../lib/types";
import { toast } from "sonner";
import { useEffect } from "react";

export function useLinks(userId: string | undefined, storeId?: string | undefined) {
    const queryClient = useQueryClient();

    // Fetch links
    const { data: links = [], isLoading } = useQuery({
        queryKey: ["links", userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from("links")
                .select("*")
                .eq("user_id", userId)
                .order("position", { ascending: true });

            if (error) throw error;
            return data as Link[];
        },
        enabled: !!userId,
    });

    // Create link
    const createLink = useMutation({
        mutationFn: async (newLink: Partial<Link>) => {
            if (!userId) throw new Error("User ID is required to create a link");

            const { data, error } = await supabase
                .from("links")
                .insert([{ ...newLink, user_id: userId, store_id: storeId || null }])
                .select()
                .single();

            if (error) throw error;
            return data as Link;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", userId] });
            toast.success("Link added successfully");
        },
        onError: (err) => {
            toast.error(err.message || "Failed to add link");
        }
    });

    // Update link
    const updateLink = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Link> }) => {
            const { data, error } = await supabase
                .from("links")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Link;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", userId] });
        },
        onError: (err) => {
            toast.error(err.message || "Failed to update link");
        }
    });

    // Delete link
    const deleteLink = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("links")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", userId] });
            toast.success("Link removed");
        },
        onError: (err) => {
            toast.error(err.message || "Failed to delete link");
        }
    });

    // Reorder links
    const reorderLinks = useMutation({
        mutationFn: async (orderedLinks: { id: string; position: number }[]) => {
            // Because Supabase JS doesn't support bulk update easily, we do minimal async updates
            const promises = orderedLinks.map(link =>
                supabase.from("links").update({ position: link.position }).eq("id", link.id)
            );
            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", userId] });
        }
    });

    // Toggle visibility
    const toggleVisibility = useMutation({
        mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
            const { data, error } = await supabase
                .from("links")
                .update({ is_visible })
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", userId] });
        }
    });

    // Track click
    const trackClick = async (linkId: string, userAgent?: string, ipAddress?: string) => {
        const { error } = await supabase.rpc("track_link_click", {
            p_link_id: linkId,
            p_user_agent: userAgent || navigator.userAgent,
            p_ip_address: ipAddress || ""
        });
        if (error) console.error("Error tracking link click:", error);
    };

    // Realtime subscription
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel('public:links')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'links', filter: `user_id=eq.${userId}` },
                (payload) => {
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
        trackClick
    };
}
