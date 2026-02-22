import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  Settings,
  Link as LinkIcon,
  Palette,
  Megaphone,
  TrendingUp,
  CircleDashed,
  ShoppingBag,
  Bell,
  LayoutGrid,
  Scissors,
  MessageCircle,
  CalendarDays,
  Sparkles,
  User,
  Zap,
  HelpCircle,
  FileText,
  Lightbulb,
  LogOut
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
import { useSetupChecklist } from "../../hooks/useSetupChecklist";
import { useMyStore } from "../../hooks/useInfluencerStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SetupChecklistModal from "./checklist/SetupChecklistModal";

export default function DashboardSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { store } = useMyStore();
  const rawUsername = user?.user_metadata?.username || user?.email?.split('@')[0] || "kanthara25";
  const displayUsername = store?.display_name || store?.slug || rawUsername;
  const displayAvatar = store?.avatar_url || user?.user_metadata?.avatar_url;

  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const { percentage, completedCount, totalSteps } = useSetupChecklist();

  const isCurrent = (path: string) => {
    return location.pathname === path || (location.pathname.startsWith(path) && path !== "/dashboard");
  }

  return (
    <Sidebar className="border-none bg-transparent pt-4 w-[280px]">
      <SidebarHeader className="px-6 py-4">
        <div className="flex items-center gap-3 w-full hover:bg-white/40 p-2.5 rounded-[20px] cursor-pointer transition-colors group backdrop-blur-md">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#99D8D0] to-[#FFD8B5] shadow-sm flex items-center justify-center overflow-hidden shrink-0 border border-white/40">
            {displayAvatar ? (
              <img src={displayAvatar} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[16px] font-bold text-white mb-0.5">{displayUsername.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <p className="text-[16px] font-bold leading-none truncate text-[#2F3E46]">{displayUsername}</p>
              <Bell size={14} className="text-[#2F3E46] opacity-70" />
            </div>
            <p className="text-[12px] text-muted-foreground truncate opacity-80 font-medium mt-1">Free Plan</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 gap-2 mt-4">
        {/* Main Nav Group */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/dashboard") && location.pathname === "/dashboard"}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-white/80 data-[active=true]:text-[#8B645A] data-[active=true]:shadow-sm data-[active=true]:border data-[active=true]:border-white/60 text-[#4D606B] hover:text-[#2F3E46] hover:bg-white/40 py-5 px-4 h-11"
                >
                  <Link to="/dashboard" className="text-[14px] flex items-center gap-3">
                    <LayoutGrid size={18} />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <div className="h-[1px] bg-black/5 mx-4 my-2" />

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/dashboard/links")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-white/80 data-[active=true]:text-[#8B645A] data-[active=true]:shadow-sm data-[active=true]:border data-[active=true]:border-white/60 text-[#4D606B] hover:text-[#2F3E46] hover:bg-white/40 py-5 px-4 h-11"
                >
                  <Link to="/dashboard/links" className="text-[14px] flex items-center gap-3 relative">
                    <div className="absolute left-[-26px] h-4 w-1 bg-[#2F3E46] rounded-full" style={{ opacity: isCurrent("/dashboard/links") ? 1 : 0 }} />
                    <LinkIcon size={18} />
                    Links
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/dashboard/products")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-white/80 data-[active=true]:text-[#8B645A] data-[active=true]:shadow-sm data-[active=true]:border data-[active=true]:border-white/60 text-[#4D606B] hover:text-[#2F3E46] hover:bg-white/40 py-5 px-4 h-11 justify-between"
                >
                  <Link to="/dashboard/products" className="text-[14px] flex w-full items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShoppingBag size={18} />
                      Shop
                    </div>
                    <span className="text-[10px]">&gt;</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/dashboard/appearance")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-white/80 data-[active=true]:text-[#8B645A] data-[active=true]:shadow-sm data-[active=true]:border data-[active=true]:border-white/60 text-[#4D606B] hover:text-[#2F3E46] hover:bg-white/40 py-5 px-4 h-11"
                >
                  <Link to="/dashboard/appearance" className="text-[14px] flex items-center gap-3">
                    <Palette size={18} />
                    Design
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/dashboard/orders")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-white/80 data-[active=true]:text-[#8B645A] data-[active=true]:shadow-sm data-[active=true]:border data-[active=true]:border-white/60 text-[#4D606B] hover:text-[#2F3E46] hover:bg-white/40 py-5 px-4 h-11 justify-between"
                >
                  <Link to="/dashboard/orders" className="text-[14px] flex w-full items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp size={18} />
                      Earn
                    </div>
                    <span className="text-[10px]">&gt;</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/dashboard/analytics")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-white/80 data-[active=true]:text-[#8B645A] data-[active=true]:shadow-sm data-[active=true]:border data-[active=true]:border-white/60 text-[#4D606B] hover:text-[#2F3E46] hover:bg-white/40 py-5 px-4 h-11"
                >
                  <Link to="/dashboard/analytics" className="text-[14px] flex items-center gap-3">
                    <Users size={18} />
                    Audience
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/dashboard/settings")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-white/80 data-[active=true]:text-[#8B645A] data-[active=true]:shadow-sm data-[active=true]:border data-[active=true]:border-white/60 text-[#4D606B] hover:text-[#2F3E46] hover:bg-white/40 py-5 px-4 h-11"
                >
                  <Link to="/dashboard/settings" className="text-[14px] flex items-center gap-3">
                    <Settings size={18} />
                    Insights
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <div className="text-[13px] font-bold text-muted-foreground ml-5 mt-4 opacity-70 cursor-pointer hover:opacity-100 transition-opacity">
                More &rarr;
              </div>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Group from screenshot */}
        <SidebarGroup className="mt-2">
          <div className="px-5 mb-2 text-[12px] font-bold text-muted-foreground/70 uppercase tracking-wider">
            Tools
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/dashboard/social-planner")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-violet-50 data-[active=true]:text-violet-700 text-[#4D606B] hover:text-[#2F3E46] hover:bg-white/40 py-2.5 px-4 h-auto"
                >
                  <Link to="/dashboard/social-planner" className="text-[13px] flex items-center gap-3">
                    <CalendarDays size={16} className="text-muted-foreground" />
                    Social planner
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="rounded-full font-bold transition-all text-[#4D606B] hover:text-[#2F3E46] hover:bg-white/40 py-2.5 px-4 h-auto"
                >
                  <Link to="/dashboard" className="text-[13px] flex items-center gap-3">
                    <MessageCircle size={16} className="text-muted-foreground" />
                    Instagram auto-reply
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/dashboard/shortener")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-violet-50 data-[active=true]:text-violet-700 text-[#4D606B] hover:text-[#2F3E46] hover:bg-white/40 py-2.5 px-4 h-auto"
                >
                  <Link to="/dashboard/shortener" className="text-[13px] flex items-center gap-3">
                    <Scissors size={16} className="text-violet-500" />
                    Link shortener
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/dashboard/post-ideas")}
                  className="rounded-full font-bold transition-all data-[active=true]:bg-violet-50 data-[active=true]:text-violet-700 text-[#4D606B] hover:text-[#2F3E46] hover:bg-white/40 py-2.5 px-4 h-auto"
                >
                  <Link to="/dashboard/post-ideas" className="text-[13px] flex items-center gap-3">
                    <Sparkles size={16} className={isCurrent("/dashboard/post-ideas") ? "text-violet-500" : "text-muted-foreground"} />
                    Post Ideas
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-5 pb-10">
        <div className="bg-white/70 backdrop-blur-md rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/80 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              {/* Dynamic SVG ring based on percentage */}
              <svg className="w-12 h-12 transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-black/5" />
                <circle
                  cx="24" cy="24" r="20"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * percentage) / 100}
                  className="text-[#F1A28A] drop-shadow-sm transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7CD0D3" />
                    <stop offset="50%" stopColor="#FBBC86" />
                    <stop offset="100%" stopColor="#F1A28A" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-extrabold text-[#2F3E46]">{percentage}%</span>
              </div>
            </div>
          </div>
          <h4 className="font-extrabold text-[#2F3E46] text-[15px] mb-[4px]">Your setup checklist</h4>
          <p className="text-[13px] text-muted-foreground mb-6 font-medium">{completedCount} of {totalSteps} complete</p>
          <button
            onClick={() => setIsChecklistOpen(true)}
            className="w-full bg-[#E5976D] hover:bg-[#D4855C] text-white font-bold text-[14px] py-[12px] rounded-full transition-colors shadow-md shadow-[#E5976D]/20 cursor-pointer border border-white/20"
          >
            Finish setup
          </button>
        </div>

        <SetupChecklistModal open={isChecklistOpen} onOpenChange={setIsChecklistOpen} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="mt-4 flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors px-4 py-2 hover:bg-black/5 rounded-lg outline-none">
              <Settings size={18} />
              <span className="text-[14px] font-medium">Settings</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" sideOffset={10} className="w-[260px] rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] bg-white/95 backdrop-blur-md border-border/40 p-2 z-50">
            <DropdownMenuItem asChild className="p-3 cursor-pointer rounded-xl hover:bg-black/5 focus:bg-black/5 outline-none transition-colors">
              <Link to="/dashboard/settings?tab=profile" className="flex items-center gap-3">
                <User size={18} strokeWidth={2.5} className="text-foreground/70" />
                <span className="font-semibold text-[14.5px] text-foreground">Account</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="p-3 cursor-pointer rounded-xl hover:bg-black/5 focus:bg-black/5 outline-none transition-colors">
              <Link to="/dashboard/settings?tab=billing" className="flex items-center gap-3">
                <Zap size={18} strokeWidth={2.5} className="text-foreground/70" />
                <span className="font-semibold text-[14.5px] text-foreground">Upgrade</span>
              </Link>
            </DropdownMenuItem>

            <div className="h-[1px] bg-black/5 my-1.5 mx-2" />

            <DropdownMenuItem asChild className="p-3 cursor-pointer rounded-xl hover:bg-black/5 focus:bg-black/5 outline-none transition-colors">
              <Link to="/dashboard/faq" className="flex items-center gap-3 w-full">
                <HelpCircle size={18} strokeWidth={2.5} className="text-foreground/70" />
                <span className="font-semibold text-[14.5px] text-foreground">Ask a question</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="p-3 cursor-pointer rounded-xl hover:bg-black/5 focus:bg-black/5 outline-none transition-colors">
              <Link to="/dashboard/help" className="flex items-center gap-3 w-full">
                <FileText size={18} strokeWidth={2.5} className="text-foreground/70" />
                <span className="font-semibold text-[14.5px] text-foreground">Help topics</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="p-3 cursor-pointer rounded-xl hover:bg-black/5 focus:bg-black/5 outline-none transition-colors">
              <a href="mailto:support@shopfluence.com?subject=ShopFluence%20Feedback" className="flex items-center gap-3 w-full">
                <Lightbulb size={18} strokeWidth={2.5} className="text-foreground/70" />
                <span className="font-semibold text-[14.5px] text-foreground">Share feedback</span>
              </a>
            </DropdownMenuItem>

            <div className="h-[1px] bg-black/5 my-1.5 mx-2" />

            <DropdownMenuItem onClick={signOut} className="p-3 cursor-pointer rounded-xl hover:bg-red-50 focus:bg-red-50 outline-none transition-colors flex items-center gap-3 text-red-600 focus:text-red-700">
              <LogOut size={18} strokeWidth={2.5} />
              <span className="font-semibold text-[14.5px]">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
