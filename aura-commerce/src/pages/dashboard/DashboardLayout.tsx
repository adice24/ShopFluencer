import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useRealtimeSubscription } from "../../hooks/useRealtimeSubscription";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import { toast } from "sonner";
import { ShoppingCart, Bell, Palette, ArrowRight, Wand2 } from "lucide-react";
import OptimizeStorefrontModal from "../../components/dashboard/OptimizeStorefrontModal";
import { useMyStore } from "../../hooks/useInfluencerStore";

export default function DashboardLayout() {
  const { user } = useAuth();
  const { store } = useMyStore();
  const [isOptimizeOpen, setIsOptimizeOpen] = React.useState(false);
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || "creator";
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const baseUrl = typeof window !== 'undefined'
    ? window.location.host
    : 'shopfluence.com';

  // Listen for confirmed orders in realtime
  useRealtimeSubscription({
    table: "orders",
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    onEvent: (payload: any) => {
      if (
        payload.eventType === "INSERT" ||
        (payload.eventType === "UPDATE" &&
          payload.new.status === "CONFIRMED" &&
          payload.old.status !== "CONFIRMED")
      ) {
        toast.success(`New order received for $${payload.new.total_amount}!`, {
          icon: <ShoppingCart className="h-4 w-4" />,
        });
      }
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full text-foreground font-sans relative bg-[#FDFBF9]">
        {/* Soft Pastel Mesh Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#E5F2F1] blur-[100px] opacity-70" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#EBF3FC] blur-[100px] opacity-80" />
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-[#FCEBE7] blur-[100px] opacity-60" />
        </div>

        <DashboardSidebar />

        <main className="flex-1 flex flex-col min-h-screen relative z-10 w-full backdrop-blur-[60px] bg-card/20">
          {/* Top Navbar */}
          <header className="h-[76px] flex items-center justify-end px-6 md:px-8 bg-transparent sticky top-0 z-20 gap-3">
            <SidebarTrigger className="md:hidden mr-auto text-foreground/70 bg-card/60 p-2 rounded-full shadow-sm backdrop-blur-md" />

            {/* Palette icon only */}
            <button
              onClick={() => navigate('/dashboard/appearance')}
              className="hidden md:flex mr-2 w-[42px] h-[42px] items-center justify-center bg-card/80 backdrop-blur-md border border-white rounded-full hover:bg-card transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            >
              <Palette size={16} className="text-muted-foreground" />
            </button>

            {/* Optimize Button */}
            <button
              onClick={() => setIsOptimizeOpen(true)}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-card/80 backdrop-blur-md border border-white rounded-full text-[13px] font-bold shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:bg-card transition-all text-[#D67151]"
            >
              <Wand2 size={16} /> Optimize
            </button>

            {/* Circular Actions */}
            <button
              onClick={() => {
                if (store?.slug) {
                  window.open(`/${store.slug}`, '_blank');
                } else {
                  toast.error("Set up your store first!");
                }
              }}
              className="w-[42px] h-[42px] rounded-full bg-card/80 border border-white flex items-center justify-center hover:bg-card transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md"
            >
              <ArrowRight size={18} className="text-foreground/70" />
            </button>

            <button
              onClick={() => navigate('/dashboard/settings?tab=notifications')}
              className="w-[42px] h-[42px] rounded-full bg-card/80 border border-white flex items-center justify-center hover:bg-card transition-colors relative shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md"
            >
              <Bell size={18} className="text-foreground/70" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-blush shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </header>

          <div className="flex-1 z-10 w-full no-scrollbar">
            <div className="p-4 md:px-8 md:py-6 w-full max-w-[1400px] mx-auto">
              <Outlet />
            </div>
          </div>
        </main>

        <OptimizeStorefrontModal open={isOptimizeOpen} onOpenChange={setIsOptimizeOpen} />
      </div>
    </SidebarProvider>
  );
}