import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, ShoppingBag, ShoppingCart, BarChart2, Layers, Building2, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Affiliates", href: "/admin/influencers" },
  { icon: Building2, label: "Brands", href: "/admin/brands" },
  { icon: ShoppingBag, label: "Products", href: "/admin/products" },
  { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
  { icon: BarChart2, label: "Analytics", href: "/admin/analytics" },
  { icon: Layers, label: "Categories", href: "/admin/categories" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="h-14 flex flex-col justify-center px-6 border-b border-border py-2">
        <span className="font-bold text-lg tracking-tight">
          Shop<span className="text-destructive">Fuence</span>
        </span>
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Admin dashboard</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => {
                const isActive = location.pathname === item.href || (location.pathname.startsWith(item.href) && item.href !== "/admin");
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href} className="flex items-center gap-3 w-full">
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
