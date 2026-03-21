import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { storefrontRowToInfluencerStore } from "../lib/storefrontMapper";
import type { InfluencerStore } from "../lib/types";

// A reactive signal that increments when localStorage checklist state changes
let _listeners: Array<() => void> = [];
export function notifyChecklistChange() {
    _listeners.forEach(fn => fn());
}

function useChecklistVersion() {
    const [version, setVersion] = useState(0);
    // Register this component to re-render when skip/complete fires
    useMemo(() => {
        const handler = () => setVersion(v => v + 1);
        _listeners.push(handler);
        return () => {
            _listeners = _listeners.filter(l => l !== handler);
        };
    }, []);
    return version;
}

export function useSetupChecklist() {
    const { user } = useAuth();
    // This version bump re-triggers useMemo whenever skip/complete fires
    const checklistVersion = useChecklistVersion();

    const { data: profile } = useQuery({
        queryKey: ["profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data } = await supabase.from("influencer_profiles").select("*").eq("user_id", user.id).maybeSingle();
            return data;
        },
        enabled: !!user,
    });

    const { data: store } = useQuery({
        queryKey: ["my-store", profile?.id],
        queryFn: async () => {
            if (!profile) return null;
            const { data } = await supabase.from("storefronts").select("*").eq("influencer_id", profile.id).maybeSingle();
            return storefrontRowToInfluencerStore(data as Record<string, unknown> | null) as InfluencerStore | null;
        },
        enabled: !!profile,
    });

    const { data: linksCount } = useQuery({
        queryKey: ["linksCount", user?.id],
        queryFn: async () => {
            if (!user) return 0;
            const { count } = await supabase
                .from("short_links")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id);
            return count || 0;
        },
        enabled: !!user,
    });

    const { data: productsCount } = useQuery({
        queryKey: ["productsCount", store?.id],
        queryFn: async () => {
            if (!store) return 0;
            const { count } = await supabase
                .from("storefront_products")
                .select("*", { count: "exact", head: true })
                .eq("storefront_id", store.id);
            return count || 0;
        },
        enabled: !!store?.id,
    });

    const isSkipped = (stepId: number) => {
        if (!user) return false;
        return localStorage.getItem(`sf_skipped_${user.id}_${stepId}`) === "true";
    };

    const stepsData = useMemo(() => {
        // checklistVersion is referenced so this memo re-runs on skip
        void checklistVersion;

        const hasNameAndBio = isSkipped(1) || !!(
            (user?.user_metadata?.full_name || store?.display_name) ||
            (profile?.bio || store?.bio)
        );

        const hasAvatar = isSkipped(2) || !!(
            profile?.avatar_url || store?.avatar_url || user?.user_metadata?.avatar_url
        );

        const socialLinks = profile?.social_links || {};
        const hasSocials = isSkipped(3) || Object.keys(socialLinks).length > 0;

        const hasLinks = isSkipped(4) || (linksCount || 0) > 0;

        const hasCustomDesign = isSkipped(5) || !!(
            store?.theme &&
            typeof store.theme === "object" &&
            Object.keys(store.theme).length > 0
        );

        const sharedKey = user?.id ? `sf_shared_${user.id}` : null;
        const hasShared = isSkipped(6) ||
            (productsCount || 0) > 0 ||
            (typeof window !== "undefined" && sharedKey
                ? localStorage.getItem(sharedKey) === "true"
                : false);

        return { hasNameAndBio, hasAvatar, hasSocials, hasLinks, hasCustomDesign, hasShared };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile, store, linksCount, productsCount, user, checklistVersion]);

    const completedCount = Object.values(stepsData).filter(Boolean).length;
    const totalSteps = 6;
    const percentage = Math.round((completedCount / totalSteps) * 100);
    const isAllDone = completedCount === totalSteps;

    return {
        steps: stepsData,
        completedCount,
        totalSteps,
        percentage,
        isAllDone,
        storeSlug: store?.slug,
        userId: user?.id,
        isLoading: false,
    };
}
