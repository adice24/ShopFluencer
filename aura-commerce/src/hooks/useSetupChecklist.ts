import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export function useSetupChecklist() {
    const { user } = useAuth();

    // 1. Profile Data (Name, Bio, Avatar)
    const { data: profile } = useQuery({
        queryKey: ["profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
            return data;
        },
        enabled: !!user,
    });

    // 2. Store Data (Socials, Bio, Avatar, Theme)
    const { data: store } = useQuery({
        queryKey: ["my-store", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data } = await supabase.from("influencer_stores").select("*").eq("user_id", user.id).single();
            return data;
        },
        enabled: !!user,
    });

    // 3. Links count
    const { data: linksCount } = useQuery({
        queryKey: ["linksCount", user?.id],
        queryFn: async () => {
            if (!user) return 0;
            const { count } = await supabase
                .from("links")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id);
            return count || 0;
        },
        enabled: !!user,
    });

    // 4. Products count (bonus — so "Share" step auto-marks if they already have products)
    const { data: productsCount } = useQuery({
        queryKey: ["productsCount", user?.id],
        queryFn: async () => {
            if (!user) return 0;
            const { count } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .eq("store_id", store?.id);
            return count || 0;
        },
        enabled: !!user && !!store?.id,
    });

    const stepsData = useMemo(() => {
        // Step 1: Name + Bio — check profile full_name and store bio
        const hasNameAndBio = !!(
            (profile?.full_name || store?.display_name) &&
            (profile?.bio || store?.bio)
        );

        // Step 2: Avatar — check both profile and store
        const hasAvatar = !!(profile?.avatar_url || store?.avatar_url);

        // Step 3: Socials — at least one social link must be non-empty
        const socialLinks = store?.social_links || {};
        const hasSocials = Object.values(socialLinks).some(
            (v) => typeof v === "string" && v.trim().length > 0
        );

        // Step 4: Links — at least one link created
        const hasLinks = (linksCount || 0) > 0;

        // Step 5: Custom Design — store has a non-default theme set
        const hasCustomDesign = !!(
            store?.theme &&
            typeof store.theme === "object" &&
            Object.keys(store.theme).length > 0
        );

        // Step 6: Shared — persisted per user in localStorage
        // (Set when they click "ShareLink" in the modal OR if they have products)
        const sharedKey = user?.id ? `sf_shared_${user.id}` : null;
        const hasShared =
            (productsCount || 0) > 0 ||
            (typeof window !== "undefined" && sharedKey
                ? localStorage.getItem(sharedKey) === "true"
                : false);

        return {
            hasNameAndBio,
            hasAvatar,
            hasSocials,
            hasLinks,
            hasCustomDesign,
            hasShared,
        };
    }, [profile, store, linksCount, productsCount, user?.id]);

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
        isLoading: !profile || store === undefined,
    };
}
