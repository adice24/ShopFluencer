import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import BrandSidebar from "@/components/brand/BrandSidebar";
import { useAuth } from "../../contexts/AuthContext";
import { Bell, ArrowRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function BrandLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    async function checkBrand() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('brands')
        .select('id, status')
        .eq('owner_id', user.id)
        .single();

      if (error || !data) {
        navigate('/brand/register');
      } else {
        setChecking(false);
      }
    }
    checkBrand();
  }, [user, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full text-foreground font-sans relative bg-[#FDFBF9]">
        {/* Soft Pastel Mesh Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FFF5E6] blur-[100px] opacity-70" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#EBF3FC] blur-[100px] opacity-80" />
        </div>

        <BrandSidebar />

        <main className="flex-1 flex flex-col min-h-screen relative z-10 w-full backdrop-blur-[60px] bg-card/20">
          <header className="h-[76px] flex items-center justify-end px-6 md:px-8 bg-transparent sticky top-0 z-20 gap-3">
            <SidebarTrigger className="md:hidden mr-auto text-foreground/70 bg-card/60 p-2 rounded-full shadow-sm backdrop-blur-md" />
            
            <div className="hidden md:flex items-center gap-2 px-6 py-2 bg-card/60 rounded-full border border-white text-[13px] font-bold shadow-sm">
                Brand Control Center
            </div>

            <button className="w-[42px] h-[42px] rounded-full bg-card/80 border border-white flex items-center justify-center hover:bg-card transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md">
              <Bell size={18} className="text-foreground/70" />
            </button>

            <button className="w-[42px] h-[42px] rounded-full bg-card/80 border border-white flex items-center justify-center hover:bg-card transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md">
              <ArrowRight size={18} className="text-foreground/70" />
            </button>
          </header>

          <div className="flex-1 z-10 w-full no-scrollbar">
            <div className="p-4 md:px-8 md:py-6 w-full max-w-[1400px] mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
