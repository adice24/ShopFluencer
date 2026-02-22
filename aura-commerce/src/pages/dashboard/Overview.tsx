import { motion } from "framer-motion";
import {
  Eye,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Palette,
  Share2,
  BarChart3,
  Copy,
  QrCode,
  AlertCircle,
} from "lucide-react";
import { useMyStore, useStoreStats } from "../../hooks/useInfluencerStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import OptimizeStorefrontModal from "../../components/dashboard/OptimizeStorefrontModal";
import { useState } from "react";
import { Sparkles } from "lucide-react";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.05, ease: "easeOut" },
});

export default function Overview() {
  const { store, isLoading: storeLoading } = useMyStore();
  const { stats, isLoading: statsLoading } = useStoreStats(store?.id);
  const navigate = useNavigate();
  const [isOptimizeOpen, setIsOptimizeOpen] = useState(false);

  if (storeLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const safeStats = stats || {
    total_views: 0,
    total_orders: 0,
    conversion_rate: 0,
    total_revenue: 0,
    recent_orders: [],
  };

  const statCards = [
    {
      label: "Total Store Views",
      value: safeStats.total_views.toLocaleString(),
      change: "+0%",
      up: true,
      icon: Eye,
    },
    {
      label: "Total Orders",
      value: safeStats.total_orders.toLocaleString(),
      change: "+0%",
      up: true,
      icon: ShoppingCart,
    },
    {
      label: "Conversion Rate",
      value: `${(safeStats.conversion_rate * 100).toFixed(2)}%`,
      change: "0%",
      up: true,
      icon: TrendingUp,
    },
    {
      label: "Revenue",
      value: `$${safeStats.total_revenue.toLocaleString()}`,
      change: "+0%",
      up: true,
      icon: DollarSign,
    },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 pb-20">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="space-y-4">
        <h1 className="text-[28px] font-bold text-foreground tracking-tight">
          Welcome back, {store?.display_name || "Creator"} 👋
        </h1>

        {!store?.is_approved && (
          <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-[16px] px-5 py-3 text-[14px] font-medium shadow-sm w-fit">
            <AlertCircle size={18} />
            Your store is pending admin approval
          </div>
        )}

      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            {...fadeUp(i + 1)}
            className="bg-white border border-border/60 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            {/* Background decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#8B5CF6]/5 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />

            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center text-foreground/70">
                <stat.icon size={20} />
              </div>
              <span
                className={`text-[13px] font-bold flex items-center gap-1 bg-black/5 px-2.5 py-1 rounded-full ${stat.up ? "text-[#10B981]" : "text-red-500"
                  }`}
              >
                {stat.up ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                {stat.change}
              </span>
            </div>

            <p className="text-[14px] text-muted-foreground font-medium mb-1">{stat.label}</p>
            <p className="text-[28px] font-bold text-foreground tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div {...fadeUp(5)}>
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Add Product", icon: Plus, href: "/dashboard/products" },
            {
              label: "Edit Appearance",
              icon: Palette,
              href: "/dashboard/settings",
            },
            {
              label: "View Analytics",
              icon: BarChart3,
              href: "/dashboard/analytics",
            },
            {
              label: "Optimize",
              icon: Sparkles,
              action: "optimize",
            },
            {
              label: "Share Store",
              icon: Share2,
              action: "share",
            },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => {
                if (action.href) navigate(action.href);
                if (action.action === "share") {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/${store?.slug}`
                  );
                  toast.success("Store link copied!");
                }
                if (action.action === "optimize") {
                  setIsOptimizeOpen(true);
                }
              }}
              className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2"
            >
              <action.icon size={20} />
              <span className="text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <OptimizeStorefrontModal open={isOptimizeOpen} onOpenChange={setIsOptimizeOpen} />
    </div>
  );
}