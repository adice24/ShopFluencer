import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import RoleSelect from "./pages/RoleSelect";
import StorefrontPage from "./pages/StorefrontPage";
import DynamicRouteRenderer from "./pages/DynamicRouteRenderer";
import MarketingPage from "./pages/MarketingPage";

import { InfluencerRoute, AdminRoute } from "./components/guards/RouteGuards";

import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import MyStore from "./pages/dashboard/MyStore";
import Analytics from "./pages/dashboard/Analytics";

import AppearancePage from "./pages/dashboard/AppearancePage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import LinksPage from "./pages/dashboard/LinksPage";
import SocialPlannerPage from "./pages/dashboard/SocialPlannerPage";
import PostIdeasPage from "./pages/dashboard/PostIdeasPage";
import LinkShortenerPage from "./pages/dashboard/LinkShortenerPage";
import FAQPage from "./pages/dashboard/FAQPage";
import HelpTopicsPage from "./pages/dashboard/HelpTopicsPage";
import ProductPage from "./pages/ProductPage";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInfluencers from "./pages/admin/AdminInfluencers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCategories from "./pages/admin/AdminCategories";

import AdminLogin from "./pages/admin/AdminLogin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // Cache session and data for 10 minutes
      refetchOnWindowFocus: false, // Prevent "Checking access" loaders when switching browser tabs
      retry: 1, // Minimize aggressive retries
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/role-select" element={<RoleSelect />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Influencer Dashboard */}
            <Route element={<InfluencerRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Overview />} />
                <Route path="store" element={<MyStore />} />
                <Route path="products" element={<MyStore />} />
                <Route path="orders" element={<Analytics />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="links" element={<LinksPage />} />
                <Route path="appearance" element={<AppearancePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="social-planner" element={<SocialPlannerPage />} />
                <Route path="post-ideas" element={<PostIdeasPage />} />
                <Route path="shortener" element={<LinkShortenerPage />} />
                <Route path="faq" element={<FAQPage />} />
                <Route path="help" element={<HelpTopicsPage />} />
              </Route>
            </Route>

            {/* Admin Dashboard */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="influencers" element={<AdminInfluencers />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="categories" element={<AdminCategories />} />
              </Route>
            </Route>

            <Route path="/customer" element={<Index />} />
            <Route path="/customer/cart" element={<Index />} />
            <Route path="/customer/orders" element={<Index />} />
            <Route path="/store/:slug" element={<StorefrontPage />} />

            {/* Public Amazon-style Product Page */}
            <Route path="/p/:slug" element={<ProductPage />} />

            {/* Marketing Pages */}
            <Route path="/products" element={<MarketingPage />} />
            <Route path="/templates" element={<MarketingPage />} />
            <Route path="/marketplace" element={<MarketingPage />} />
            <Route path="/pricing" element={<MarketingPage />} />
            <Route path="/learn" element={<MarketingPage />} />
            <Route path="/about" element={<MarketingPage />} />
            <Route path="/careers" element={<MarketingPage />} />
            <Route path="/press" element={<MarketingPage />} />
            <Route path="/blog" element={<MarketingPage />} />
            <Route path="/contact" element={<MarketingPage />} />
            <Route path="/features" element={<MarketingPage />} />
            <Route path="/integrations" element={<MarketingPage />} />
            <Route path="/help" element={<MarketingPage />} />
            <Route path="/community" element={<MarketingPage />} />
            <Route path="/status" element={<MarketingPage />} />
            <Route path="/developers" element={<MarketingPage />} />
            <Route path="/privacy" element={<MarketingPage />} />
            <Route path="/terms" element={<MarketingPage />} />
            <Route path="/cookies" element={<MarketingPage />} />
            <Route path="/gdpr" element={<MarketingPage />} />

            {/* Public Linktree / Short Link Router */}
            <Route path="/:username" element={<DynamicRouteRenderer />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
