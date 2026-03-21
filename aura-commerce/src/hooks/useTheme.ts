import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Theme } from "../lib/types";
import { toast } from "sonner";
import { useEffect } from "react";
import {
    parseThemeFromStorefront,
    serializeLinktreeThemeToCustomCss,
    DEFAULT_LINKTREE_THEME_BODY,
    themeForPublicPage,
} from "../lib/linktreeTheme";

export function useTheme(storeId: string | undefined) {
    const queryClient = useQueryClient();

    const { data: theme, isLoading } = useQuery({
        queryKey: ["theme", storeId],
        queryFn: async () => {
            if (!storeId) return null;
            const { data: row, error } = await supabase
                .from("storefronts")
                .select("id, theme_color, custom_css")
                .eq("id", storeId)
                .maybeSingle();

            if (error) throw error;
            if (!row) return null;
            return parseThemeFromStorefront(row as { id: string; theme_color?: string | null; custom_css?: string | null });
        },
        enabled: !!storeId,
    });

    const initializeTheme = useMutation({
        mutationFn: async () => {
            if (!storeId) throw new Error("Store ID is required");
            const body = { ...DEFAULT_LINKTREE_THEME_BODY };
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from("storefronts")
                .update({
                    theme_color: body.button_color,
                    custom_css: serializeLinktreeThemeToCustomCss(body as Partial<Theme>),
                    updated_at: now,
                })
                .eq("id", storeId)
                .select("id, theme_color, custom_css")
                .single();

            if (error) throw error;
            return parseThemeFromStorefront(
                data as { id: string; theme_color?: string | null; custom_css?: string | null }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["theme", storeId] });
        },
    });

    const updateTheme = useMutation({
        mutationFn: async (updates: Partial<Theme>) => {
            if (!storeId) throw new Error("Store ID is required");

            const { data: row, error: loadErr } = await supabase
                .from("storefronts")
                .select("id, theme_color, custom_css")
                .eq("id", storeId)
                .single();
            if (loadErr) throw loadErr;

            const base = themeForPublicPage(
                row as { id: string; theme_color?: string | null; custom_css?: string | null }
            );
            const mergedBody = {
                background_type:
                    (updates.background_type as typeof DEFAULT_LINKTREE_THEME_BODY.background_type) ??
                    base.background_type,
                background_value: updates.background_value ?? base.background_value,
                button_style:
                    (updates.button_style as typeof DEFAULT_LINKTREE_THEME_BODY.button_style) ??
                    base.button_style,
                font_family: updates.font_family ?? base.font_family,
                button_color: updates.button_color ?? base.button_color,
                text_color: updates.text_color ?? base.text_color,
            };

            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from("storefronts")
                .update({
                    theme_color: mergedBody.button_color,
                    custom_css: serializeLinktreeThemeToCustomCss(mergedBody as Partial<Theme>),
                    updated_at: now,
                })
                .eq("id", storeId)
                .select("id, theme_color, custom_css")
                .single();

            if (error) throw error;
            return parseThemeFromStorefront(
                data as { id: string; theme_color?: string | null; custom_css?: string | null }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["theme", storeId] });
            toast.success("Theme updated");
        },
        onError: (err: Error) => {
            toast.error(err.message || "Failed to update theme");
        },
    });

    useEffect(() => {
        if (!storeId) return;

        const channel = supabase
            .channel(`public:storefronts:theme:${storeId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "storefronts",
                    filter: `id=eq.${storeId}`,
                },
                () => {
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
        updateTheme,
    };
}
