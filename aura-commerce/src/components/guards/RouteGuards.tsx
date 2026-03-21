/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │  ROUTE GUARDS — Role-based Access Control                   │
 * │  Redirects unauthorized users to /auth                      │
 * └──────────────────────────────────────────────────────────────┘
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../lib/types";
import { fetchAdminSession } from "../../lib/api";
import { PLATFORM_ADMIN_LOGIN_PATH } from "../../lib/platformAdminPaths";

export function isInfluencerRole(role?: string | null) {
    const r = role?.toLowerCase();
    return r === "influencer" || r === "affiliate";
}

/**
 * Fetches the user's profile to determine their role.
 * This is the single source of role truth — never trust client state.
 */
export function useProfile() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();
            if (error) throw error;
            return data as Profile | null;
        },
        enabled: !!user,
        staleTime: 10 * 60 * 1000, // Cache for 10 minutes
        refetchOnWindowFocus: false, // Prevent refetching when switching tabs
    });
}

/** True when affiliate onboarding is finished (metadata or influencer_profiles row). */
export function useAffiliateOnboardingStatus() {
    const { user } = useAuth();
    const { data: profile } = useProfile();

    return useQuery({
        queryKey: ["affiliate-onboarding-status", user?.id],
        queryFn: async (): Promise<boolean> => {
            if (!user) return true;
            if (user.user_metadata?.onboarding_completed === true) return true;
            const { data, error } = await supabase
                .from("influencer_profiles")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();
            if (error) throw error;
            return !!data?.id;
        },
        enabled: !!user && isInfluencerRole(profile?.role),
        staleTime: 60 * 1000,
    });
}

/**
 * Protected Route — requires authentication.
 * Shows loading skeleton while checking auth status.
 */
export function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return <Outlet />;
}

/**
 * Affiliate / Influencer Route — requires affiliate role.
 */
export function InfluencerRoute() {
    const { user, loading: authLoading } = useAuth();
    const { data: profile, isLoading: profileLoading } = useProfile();

    const isLoading = authLoading || (!!user && profileLoading);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Checking access...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    const role = profile?.role?.toLowerCase();

    if (role === "affiliate" || role === "influencer" || role === "admin") {
        return <Outlet />;
    }

    return <Navigate to="/role-select" replace />;
}

/**
 * Brand / Vendor Route — requires brand role.
 */
export function BrandRoute() {
    const { user, loading: authLoading } = useAuth();
    const { data: profile, isLoading: profileLoading } = useProfile();

    const isLoading = authLoading || (!!user && profileLoading);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Checking brand access...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    const role = profile?.role?.toLowerCase();

    if (role === "brand" || role === "admin") {
        return <Outlet />;
    }

    return <Navigate to="/role-select" replace />;
}

/**
 * Affiliate dashboard — requires completed onboarding (DB or metadata).
 * Admins pass through; non-influencer roles should not reach here via InfluencerRoute.
 */
export function AffiliateDashboardGate() {
    const { user, loading: authLoading } = useAuth();
    const { data: profile, isLoading: profileLoading } = useProfile();
    const {
        data: onboardingDone,
        isLoading: onboardingLoading,
        isError: onboardingError,
    } = useAffiliateOnboardingStatus();

    const role = profile?.role?.toLowerCase();
    const isLoading =
        authLoading || (!!user && profileLoading) || (!!user && isInfluencerRole(profile?.role) && onboardingLoading);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    if (role === "admin") {
        return <Outlet />;
    }

    if (isInfluencerRole(profile?.role)) {
        if (onboardingError) {
            return <Outlet />;
        }
        if (onboardingDone === false) {
            return <Navigate to="/onboarding/affiliate" replace />;
        }
    }

    return <Outlet />;
}

/**
 * Admin Route — Nest JWT cookie (`/admin/auth/login`) OR Supabase `profiles.role === admin`.
 */
export function AdminRoute() {
    const { user, loading: authLoading } = useAuth();
    const { data: profile, isLoading: profileLoading } = useProfile();

    const { data: adminSession, isLoading: adminLoading } = useQuery({
        queryKey: ["admin-session"],
        queryFn: fetchAdminSession,
        staleTime: 0,
        refetchOnMount: "always",
        retry: false,
    });

    const isLoading =
        authLoading || adminLoading || (!!user && profileLoading);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    if (adminSession?.authenticated) {
        return <Outlet />;
    }

    const role = profile?.role?.toLowerCase();
    if (role === "admin") {
        return <Outlet />;
    }

    return <Navigate to={PLATFORM_ADMIN_LOGIN_PATH} replace />;
}
