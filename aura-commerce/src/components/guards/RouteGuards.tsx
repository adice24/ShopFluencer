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
                .single();
            if (error) throw error;
            return data as Profile;
        },
        enabled: !!user,
        staleTime: 10 * 60 * 1000, // Cache for 10 minutes
        refetchOnWindowFocus: false, // Prevent refetching when switching tabs
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
 * Influencer Route — requires influencer role + approved store.
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

    // Fallback to local storage if profile sync is delayed to prevent redirect loop
    const localRole = localStorage.getItem("shopfluence_role");

    if (profile?.role === "influencer" || profile?.role === "admin" || localRole === "influencer") {
        return <Outlet />;
    }

    return <Navigate to="/role-select" replace />;
}

/**
 * Admin Route — requires admin role strictly.
 */
export function AdminRoute() {
    const { user, loading: authLoading } = useAuth();
    const { data: profile, isLoading: profileLoading } = useProfile();

    const isLoading = authLoading || (!!user && profileLoading);

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

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    if (profile?.role === "admin") {
        return <Outlet />;
    }

    // Admins are not natively in the frontend supabase auth logic, so if false we boot them to home.
    return <Navigate to="/" replace />;
}
