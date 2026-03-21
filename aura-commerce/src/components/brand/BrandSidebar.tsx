import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  Settings,
  Package,
  LineChart,
  LayoutGrid,
  TrendingUp,
  User,
  Zap,
  HelpCircle,
  FileText,
  Lightbulb,
  LogOut,
  PlusCircle,
  BarChart3
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { useAuth } from "../../contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BrandSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const displayUsername = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Brand Owner";

  const isCurrent = (path: string) => {
    return location.pathname === path || (location.pathname.startsWith(path) && path !== "/brand");
  }

  return (
    <Sidebar className="border-none bg-transparent pt-4 w-[280px]">
      <SidebarHeader className="px-6 py-4">
        <div className="flex items-center gap-3 w-full hover:bg-card/40 p-2.5 rounded-[20px] cursor-pointer transition-colors group backdrop-blur-md">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#FFD8B5] to-[#FFB5B5] shadow-sm flex items-center justify-center overflow-hidden shrink-0 border border-white/40">
            <span className="text-[16px] font-bold text-blush mb-0.5">{displayUsername.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[16px] font-bold leading-none truncate text-[#2F3E46]">{displayUsername}</p>
            <p className="text-[12px] text-muted-foreground truncate opacity-80 font-medium mt-1">Brand Account</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 gap-2 mt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/brand"}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-card/80 data-[active=true]:text-[#8B645A] text-[#4D606B] hover:text-[#2F3E46] hover:bg-card/40 py-5 px-4 h-11"
                >
                  <Link to="/brand" className="text-[14px] flex items-center gap-3">
                    <LayoutGrid size={18} />
                    Overview
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/brand/products")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-card/80 data-[active=true]:text-[#8B645A] text-[#4D606B] hover:text-[#2F3E46] hover:bg-card/40 py-5 px-4 h-11"
                >
                  <Link to="/brand/products" className="text-[14px] flex items-center gap-3">
                    <Package size={18} />
                    Manage Products
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/brand/add-product")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-card/80 data-[active=true]:text-[#8B645A] text-[#4D606B] hover:text-[#2F3E46] hover:bg-card/40 py-5 px-4 h-11"
                >
                  <Link to="/brand/add-product" className="text-[14px] flex items-center gap-3">
                    <PlusCircle size={18} />
                    Upload Listing
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/brand/affiliates")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-card/80 data-[active=true]:text-[#8B645A] text-[#4D606B] hover:text-[#2F3E46] hover:bg-card/40 py-5 px-4 h-11"
                >
                  <Link to="/brand/affiliates" className="text-[14px] flex items-center gap-3">
                    <Users size={18} />
                    Affiliate Performance
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/brand/analytics")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-card/80 data-[active=true]:text-[#8B645A] text-[#4D606B] hover:text-[#2F3E46] hover:bg-card/40 py-5 px-4 h-11"
                >
                  <Link to="/brand/analytics" className="text-[14px] flex items-center gap-3">
                    <LineChart size={18} />
                    Sales Insights
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/brand/settings")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-card/80 data-[active=true]:text-[#8B645A] text-[#4D606B] hover:text-[#2F3E46] hover:bg-card/40 py-5 px-4 h-11"
                >
                  <Link to="/brand/settings" className="text-[14px] flex items-center gap-3">
                    <Settings size={18} />
                    Brand Settings
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-5 pb-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors px-4 py-2 hover:bg-black/5 rounded-lg outline-none">
              <User size={18} />
              <span className="text-[14px] font-medium">Account</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" sideOffset={10} className="w-[200px] rounded-[16px] shadow-lg p-2 z-50 bg-card">
            <DropdownMenuItem onClick={signOut} className="p-3 cursor-pointer rounded-xl hover:bg-rose/10 flex items-center gap-3 text-rose">
              <LogOut size={18} strokeWidth={2.5} />
              <span className="font-semibold text-[14.5px]">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
