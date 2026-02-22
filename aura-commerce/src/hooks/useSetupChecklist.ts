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

    // 3. Links Data
    const { data: linksCount } = useQuery({
        queryKey: ["linksCount", user?.id],
        queryFn: async () => {
            if (!user) return 0;
            const { count } = await supabase.from("links").select("*", { count: "exact", head: true }).eq("user_id", user.id);
            return count || 0;
        },
        enabled: !!user,
    });

    // Determine completion status of each step
    const stepsData = useMemo(() => {
        const hasNameAndBio = !!(profile?.full_name && store?.bio);
        const hasAvatar = !!(profile?.avatar_url || store?.avatar_url);
        const hasSocials = !!(store?.social_links && Object.keys(store.social_links).length > 0);
        const hasLinks = (linksCount || 0) > 0;
        const hasCustomDesign = !!(store?.theme && Object.keys(store.theme).length > 0);

        // Retrieve "shared" status from local storage as a quick frontend state, or default false
        const hasShared = typeof window !== 'undefined' ? localStorage.getItem(`shared_${user?.id}`) === 'true' : false;

        return {
            hasNameAndBio,
            hasAvatar,
            hasSocials,
            hasLinks,
            hasCustomDesign,
            hasShared,
        };
    }, [profile, store, linksCount, user?.id]);

    const completedCount = Object.values(stepsData).filter(Boolean).length;
    const totalSteps = 6;
    const percentage = Math.round((completedCount / totalSteps) * 100);

    return {
        steps: stepsData,
        completedCount,
        totalSteps,
        percentage,
        isLoading: !profile || store === undefined, // undefined means still loading, null means no store
    };
}
