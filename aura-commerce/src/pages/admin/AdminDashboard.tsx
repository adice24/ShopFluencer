import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, DollarSign, TrendingUp, CheckCircle2, XCircle, Clock, Activity, Database, ArrowRight, Building2, Package, Percent, BarChart2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchAdminApi } from "@/lib/api";
import { toast } from "sonner";

const fade = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.08 } });

const quickLinks = [
  { to: "/admin/influencers", label: "Affiliates", desc: "View & manage affiliates" },
  { to: "/admin/brands", label: "Brands", desc: "Approve registrations & margins" },
  { to: "/admin/products", label: "Products", desc: "Approve, edit & remove" },
  { to: "/admin/orders", label: "Orders", desc: "Transactions & fulfillment" },
  { to: "/admin/analytics", label: "Analytics", desc: "Platform metrics" },
  { to: "/admin/settings", label: "Settings", desc: "Platform fee & rules" },
];

const adminFeatureAreas = [
  {
    title: "User management",
    icon: Users,
    bullets: ["View affiliates", "Suspend users", "Approve brand registrations"],
    links: [
      { to: "/admin/influencers", label: "Affiliates" },
      { to: "/admin/brands", label: "Brands" },
    ],
  },
  {
    title: "Product management",
    icon: Package,
    bullets: ["Approve products", "Edit product info", "Remove products"],
    links: [{ to: "/admin/products", label: "Products" }],
  },
  {
    title: "Commission control",
    icon: Percent,
    bullets: ["Adjust margins", "Set platform fee"],
    links: [
      { to: "/admin/brands", label: "Brand margins" },
      { to: "/admin/settings", label: "Platform fee" },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart2,
    bullets: ["Total affiliates", "Total brands", "Total products", "Total sales", "Total commissions"],
    links: [{ to: "/admin/analytics", label: "Open analytics" }],
  },
] as const;

const statusConfig: Record<string, { icon: React.ElementType; class: string }> = {
  completed: { icon: CheckCircle2, class: "text-emerald-500 bg-emerald-500/15" },
  CONFIRMED: { icon: CheckCircle2, class: "text-emerald-500 bg-emerald-500/15" },
  pending: { icon: Clock, class: "text-gold bg-gold/15" },
  PENDING: { icon: Clock, class: "text-gold bg-gold/15" },
  failed: { icon: XCircle, class: "text-rose bg-rose/15" },
  FAILED: { icon: XCircle, class: "text-rose bg-rose/15" },
};

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const { data: apiHealth } = useQuery({
    queryKey: ["admin-api-health"],
    queryFn: async () => {
      try {
        const live = await fetch(`${API_URL}/health/live`);
        const ready = await fetch(`${API_URL}/health/ready`);
        const liveJson = live.ok ? await live.json() : null;
        const readyJson = ready.ok ? await ready.json() : null;
        return {
          live: live.ok,
          ready: ready.ok && readyJson?.status === "ok",
          liveJson,
          readyJson,
        };
      } catch {
        return { live: false, ready: false, liveJson: null, readyJson: null };
      }
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // 1. Fetch Overview Stats
  const { data: overview, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchAdminApi("/admin/overview"),
  });

  // 2. Fetch Pending Approvals (Users)
  const { data: pendingUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-approvals"],
    queryFn: async () => {
      const raw = await fetchAdminApi("/admin/approvals");
      return Array.isArray(raw) ? raw : [];
    },
  });

  // 3. Fetch Recent Transactions
  const { data: transactions, isLoading: transLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const raw = await fetchAdminApi("/admin/transactions");
      return Array.isArray(raw) ? raw : [];
    },
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => 
      fetchAdminApi(`/admin/${role.toLowerCase()}s/${id}/approve`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Registration approved");
      queryClient.invalidateQueries({ queryKey: ["admin-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const stats = [
    { label: "Total affiliates", value: String(overview?.totalAffiliates ?? "0"), icon: Users },
    { label: "Total brands", value: String(overview?.totalBrands ?? "0"), icon: Building2 },
    { label: "Total products", value: String(overview?.totalProducts ?? "0"), icon: Package },
    {
      label: "Total sales",
      value: overview?.totalRevenue != null ? `₹${Number(overview.totalRevenue).toLocaleString()}` : "₹0",
      icon: DollarSign,
    },
    {
      label: "Total commissions",
      value: overview?.totalCommissions != null ? `₹${Number(overview.totalCommissions).toLocaleString()}` : "₹0",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div {...fade(0)} className="space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Admin dashboard</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Operate the platform: user management, product moderation, commissions and fees, and analytics — all in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border ${
              apiHealth?.live
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            API {apiHealth?.live ? "reachable" : "unreachable"}
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border ${
              apiHealth?.ready
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Database {apiHealth?.ready ? "connected" : "check /health/ready"}
          </div>
        </div>
      </motion.div>

      {/* Analytics snapshot — matches overview API */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fade(i + 1)} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><s.icon size={20} className="text-muted-foreground" /></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{statsLoading ? "…" : s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Admin feature areas (spec) */}
      <motion.div {...fade(2)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminFeatureAreas.map((area) => (
          <div
            key={area.title}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <area.icon size={18} className="text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{area.title}</h2>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside mb-4">
              {area.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {area.links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {l.label}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div {...fade(3)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickLinks.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div>
              <p className="font-semibold text-foreground">{q.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{q.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <motion.div {...fade(5)} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Pending Registrations</h2>
            <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full text-muted-foreground">
              {pendingUsers?.length || 0} waiting
            </span>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {usersLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading approvals...</div>
            ) : pendingUsers?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm italic">No pending registrations.</div>
            ) : (
              pendingUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{u.firstName?.[0] || "U"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.role} · {u.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => approveMutation.mutate({ id: u.id, role: u.role })}
                      disabled={approveMutation.isPending}
                      className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full hover:opacity-90 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div {...fade(6)} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Recent Transactions</h2>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {transLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading transactions...</div>
            ) : transactions?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm italic">No recent transactions.</div>
            ) : (
              transactions?.map((order: any) => {
                const sc = statusConfig[order.status] || statusConfig.pending;
                return (
                  <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sc.class}`}><sc.icon size={14} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{order.orderNumber || order.id}</p>
                      <p className="text-xs text-muted-foreground truncate">₹{Number(order.totalAmount).toLocaleString()} · {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-bold text-foreground">₹{Number(order.totalAmount).toLocaleString()}</span>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
