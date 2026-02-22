import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Theme, RealtimeEvent } from "../lib/types";
import { toast } from "sonner";
import { useEffect } from "react";

export function useTheme(storeId: string | undefined) {
    const queryClient = useQueryClient();

    // Fetch theme
    const { data: theme, isLoading } = useQuery({
        queryKey: ["theme", storeId],
        queryFn: async () => {
            if (!storeId) return null;
            const { data, error } = await supabase
                .from("themes")
                .select("*")
                .eq("store_id", storeId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data as Theme | null;
        },
        enabled: !!storeId,
    });

    // Create theme if it doesn't exist
    const initializeTheme = useMutation({
        mutationFn: async () => {
            if (!storeId) throw new Error("Store ID is required");
            const { data, error } = await supabase
                .from("themes")
                .insert([{ store_id: storeId }])
                .select()
                .single();

            if (error) throw error;
            return data as Theme;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["theme", storeId] });
        }
    });

    // Update theme
    const updateTheme = useMutation({
        mutationFn: async (updates: Partial<Theme>) => {
            if (!storeId) throw new Error("Store ID is required");

            // Upsert mechanism just in case
            const { data, error } = await supabase
                .from("themes")
                .upsert({ store_id: storeId, ...updates }, { onConflict: 'store_id' })
                .select()
                .single();

            if (error) throw error;
            return data as Theme;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["theme", storeId] });
            toast.success("Theme updated");
        },
        onError: (err) => {
            toast.error(err.message || "Failed to update theme");
        }
    });

    // Realtime subscription
    useEffect(() => {
        if (!storeId) return;

        const channel = supabase
            .channel('public:themes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'themes', filter: `store_id=eq.${storeId}` },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ["theme", storeId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [storeId, queryClient]);

    return {
        theme,
        isLoading,
        initializeTheme,
        updateTheme
    };
}
