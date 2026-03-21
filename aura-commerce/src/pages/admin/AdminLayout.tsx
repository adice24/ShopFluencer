import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";
import { Radio } from "lucide-react";

export default function AdminLayout() {
  const { connected } = useAdminRealtime(true);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center border-b border-border px-4 md:px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden sm:block text-sm font-medium text-foreground truncate max-w-[min(40vw,320px)]">
              Admin Dashboard
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${
                  connected
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-muted-foreground/25 bg-muted/40 text-muted-foreground"
                }`}
                title={connected ? "Live updates connected" : "Reconnecting live updates…"}
              >
                <Radio size={12} className={connected ? "animate-pulse" : ""} />
                {connected ? "Live" : "Offline"}
              </span>
              <span className="text-xs font-semibold text-muted-foreground bg-destructive/10 text-destructive px-3 py-1 rounded-full">Admin</span>
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                <span className="text-xs font-bold text-destructive">A</span>
              </div>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-8 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
