import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Eye, ShoppingCart, TrendingUp, DollarSign,
  ArrowUpRight, Plus, Palette, Share2, BarChart3, AlertCircle, Zap, Clock
} from "lucide-react";
import { useMyStore, useStoreStats } from "../../hooks/useInfluencerStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import OptimizeStorefrontModal from "../../components/dashboard/OptimizeStorefrontModal";
import { useAuth } from "../../contexts/AuthContext";
import { Wand2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.05, ease: "easeOut" },
});

/* ── Animated counter ─────────────────── */
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (start === end) return;
    prevRef.current = end;
    const diff = end - start;
    const steps = 30;
    const duration = 600;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (step >= steps) {
        clearInterval(timer);
        setDisplay(end);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  if (prefix === "$") {
    return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
  }
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ── Live pulse dot ─────────────────── */
function LiveDot() {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      Live
    </span>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const { store, isLoading: storeLoading } = useMyStore();
  const { stats, isLoading: statsLoading } = useStoreStats(store?.id);
  const navigate = useNavigate();
  const [isOptimizeOpen, setIsOptimizeOpen] = useState(false);

  // Real-time live counters — mounted separately for instant UI updates
  const [liveViews, setLiveViews] = useState<number | null>(null);
  const [liveOrders, setLiveOrders] = useState<number | null>(null);
  const [liveRevenue, setLiveRevenue] = useState<number | null>(null);
  const [recentActivity, setRecentActivity] = useState<{ type: string; label: string; time: string }[]>([]);

  // Fetch initial live counts directly
  useEffect(() => {
    if (!store?.id) return;

    const fetchCounts = async () => {
      // 1. Get influencer profile info
      const { data: profile } = await supabase
        .from("influencer_profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!profile) return;

      const [viewsRes, ordersRes, revenueRes] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("influencer_id", profile.id)
          .eq("event_type", "PAGE_VIEW"),
        supabase
          .from("affiliate_conversions")
          .select("*", { count: "exact", head: true })
          .eq("influencer_id", profile.id)
          .not("status", "eq", "CANCELLED"),
        supabase
          .from("affiliate_conversions")
          .select("order_amount")
          .eq("influencer_id", profile.id)
          .not("status", "eq", "CANCELLED"),
      ]);
      
      setLiveViews(viewsRes.count || 0);
      setLiveOrders(ordersRes.count || 0);
      const total = (revenueRes.data || []).reduce((sum, o) => sum + Number(o.order_amount || 0), 0);
      setLiveRevenue(total);
    };
    fetchCounts();
  }, [store?.id, user?.id]);

  // Real-time subscription: analytics_events → update views
  useEffect(() => {
    if (!store?.id || !user?.id) return;

    const setupSubscription = async () => {
      const { data: profile } = await supabase
        .from("influencer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const channel = supabase
        .channel(`realtime-analytics-${profile.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "analytics_events",
            filter: `influencer_id=eq.${profile.id}`,
          },
          (payload) => {
            const ev = payload.new as any;
            if (ev.event_type === "PAGE_VIEW") {
              setLiveViews((prev) => (prev !== null ? prev + 1 : 1));
              setRecentActivity((prev) =>
                [{ type: "view", label: "New store visit", time: "Just now" }, ...prev].slice(0, 5)
              );
            } else if (ev.event_type === "PRODUCT_VIEW") {
              setRecentActivity((prev) =>
                [{ type: "product", label: "Product viewed", time: "Just now" }, ...prev].slice(0, 5)
              );
            }
          }
        )
        .subscribe();

      return channel;
    };

    const subPromise = setupSubscription();
    return () => { subPromise.then(ch => ch && supabase.removeChannel(ch)); };
  }, [store?.id, user?.id]);

  // Real-time subscription: affiliate_conversions → update order count + revenue
  useEffect(() => {
    if (!store?.id || !user?.id) return;

    const setupSubscription = async () => {
      const { data: profile } = await supabase
        .from("influencer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const channel = supabase
        .channel(`realtime-conversions-${profile.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "affiliate_conversions",
            filter: `influencer_id=eq.${profile.id}`,
          },
          (payload) => {
            const conversion = payload.new as any;
            setLiveOrders((prev) => (prev !== null ? prev + 1 : 1));
            setLiveRevenue((prev) => (prev !== null ? prev + Number(conversion.order_amount || 0) : Number(conversion.order_amount || 0)));
            setRecentActivity((prev) =>
              [
                {
                  type: "order",
                  label: `New Sale! — ₹${Number(conversion.order_amount || 0).toLocaleString()}`,
                  time: "Just now",
                },
                ...prev,
              ].slice(0, 5)
            );
            toast.success(`💸 Sales alert! ₹${Number(conversion.order_amount || 0).toLocaleString()} order recorded.`, {
              icon: <ShoppingCart size={16} />,
            });
          }
        )
        .subscribe();

      return channel;
    };

    const subPromise = setupSubscription();
    return () => { subPromise.then(ch => ch && supabase.removeChannel(ch)); };
  }, [store?.id, user?.id]);

  // Also subscribe to link_clicks for total link views
  const [liveLinkClicks, setLiveLinkClicks] = useState<number | null>(null);
  useEffect(() => {
    if (!store?.id) return;
    supabase
      .from("link_clicks")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id)
      .then(({ count }) => setLiveLinkClicks(count || 0));

    const channel = supabase
      .channel(`realtime-links-${store.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "link_clicks",
          filter: `store_id=eq.${store.id}`,
        },
        () => {
          setLiveLinkClicks((prev) => (prev !== null ? prev + 1 : 1));
          setRecentActivity((prev) =>
            [{ type: "click", label: "Link clicked", time: "Just now" }, ...prev].slice(0, 5)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [store?.id]);

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Use live counts if available, fall back to RPC stats
  const totalViews = liveViews ?? stats?.total_views ?? 0;
  const totalOrders = liveOrders ?? stats?.total_orders ?? 0;
  const totalEarnings = liveRevenue ?? stats?.total_revenue ?? 0;
  const pendingEarnings = totalEarnings * 0.12; 
  const numberOfSales = totalOrders;
  const conversionRateValue = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(2) : "0.00";
  const topProduct = "Premium Summer Tee"; // Mock top product

  const statCards = [
    {
      label: "Total Earnings",
      value: totalEarnings,
      prefix: "₹",
      suffix: "",
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Pending Earnings",
      value: pendingEarnings,
      prefix: "₹",
      suffix: "",
      icon: Clock, // Import Clock from lucide
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      label: "Number of Sales",
      value: numberOfSales,
      prefix: "",
      suffix: "",
      icon: ShoppingCart,
      color: "text-gold",
      bgColor: "bg-plum/20",
    },
    {
      label: "Conversion Rate",
      value: parseFloat(conversionRateValue),
      prefix: "",
      suffix: "%",
      icon: TrendingUp,
      color: "text-violet-500",
      bgColor: "bg-violet-50",
    },
    {
      label: "Top Product",
      value: topProduct,
      prefix: "",
      suffix: "",
      icon: Wand2,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      isString: true
    },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 pb-20">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-[28px] font-bold text-foreground tracking-tight">
            Welcome back, {store?.display_name || "Creator"} 👋
          </h1>
          <LiveDot />
        </div>

        {/* Admin approval banner removed per user request */}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            {...fadeUp(i + 1)}
            className="bg-card border border-border/60 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#8B5CF6]/5 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />

            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[11px] font-bold flex items-center gap-1 ${stat.color} bg-black/5 px-2 py-0.5 rounded-full`}>
                <ArrowUpRight size={12} />
                Live
              </span>
            </div>

            <p className="text-[14px] text-muted-foreground font-medium mb-1">{stat.label}</p>
            <p className={`${stat.isString ? 'text-[18px]' : 'text-[28px]'} font-bold text-foreground tracking-tight`}>
              {stat.isString ? (
                <span>{stat.value}</span>
              ) : (
                <AnimatedNumber value={stat.value as number} prefix={stat.prefix} suffix={stat.suffix} />
              )}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Conversion Rate Banner */}
      <motion.div {...fadeUp(5)} className="bg-gradient-to-r from-[#8B5CF6]/10 to-[#E28362]/10 border border-[#8B5CF6]/20 rounded-[20px] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
            <Zap size={18} className="text-[#8B5CF6]" />
          </div>
          <div>
            <p className="font-bold text-[15px] text-[#2F3E46]">Conversion Rate</p>
            <p className="text-[13px] text-muted-foreground">Orders ÷ Store Views</p>
          </div>
        </div>
        <span className="text-[26px] font-extrabold text-[#8B5CF6]">{conversionRateValue}%</span>
      </motion.div>

      {/* Live Activity Feed */}
      {recentActivity.length > 0 && (
        <motion.div {...fadeUp(6)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Live Activity</h2>
            <LiveDot />
          </div>
          <div className="bg-card border border-border/60 rounded-[20px] divide-y divide-border/40 overflow-hidden shadow-sm">
            {recentActivity.map((act, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${act.type === "view" ? "bg-plum/20 text-gold" :
                  act.type === "order" ? "bg-emerald-50 text-emerald-500" :
                    act.type === "click" ? "bg-violet-50 text-violet-500" :
                      "bg-orange-50 text-gold"
                  }`}>
                  {act.type === "view" ? "👁" : act.type === "order" ? "💸" : act.type === "click" ? "🔗" : "📦"}
                </div>
                <span className="flex-1 text-[14px] font-medium text-[#2F3E46]">{act.label}</span>
                <span className="text-[12px] text-muted-foreground">{act.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div {...fadeUp(7)}>
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Edit Appearance", icon: Palette, href: "/dashboard/appearance" },
            { label: "View Analytics", icon: BarChart3, href: "/dashboard/analytics" },
            { label: "Optimize", icon: Wand2, action: "optimize" },
            { label: "Share Store", icon: Share2, action: "share" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => {
                if (action.href) navigate(action.href);
                if (action.action === "share") {
                  navigator.clipboard.writeText(`${window.location.origin}/${store?.slug}`);
                  toast.success("Store link copied!");
                }
                if (action.action === "optimize") {
                  setIsOptimizeOpen(true);
                }
              }}
              className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-black/5 transition-colors"
            >
              <action.icon size={20} />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <OptimizeStorefrontModal open={isOptimizeOpen} onOpenChange={setIsOptimizeOpen} />
    </div>
  );
}