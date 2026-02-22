import { motion } from "framer-motion";
import { Users, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Clock } from "lucide-react";

const stats = [
  { label: "Total Influencers", value: "1,247", change: "+18%", up: true, icon: Users },
  { label: "Total Orders", value: "8,392", change: "+12%", up: true, icon: ShoppingCart },
  { label: "Platform Revenue", value: "$142,580", change: "+22%", up: true, icon: DollarSign },
  { label: "Conversion Rate", value: "3.2%", change: "+0.5%", up: true, icon: TrendingUp },
];

const pendingInfluencers = [
  { id: "1", name: "Alex Johnson", email: "alex@email.com", followers: "45K", applied: "2 hours ago" },
  { id: "2", name: "Maya Patel", email: "maya@email.com", followers: "120K", applied: "5 hours ago" },
  { id: "3", name: "Chris Lee", email: "chris@email.com", followers: "8K", applied: "1 day ago" },
];

const recentOrders = [
  { id: "ORD-001", influencer: "Surya", product: "Protein Shaker Pro", amount: "$24.99", status: "completed" },
  { id: "ORD-002", influencer: "Maya", product: "Glow Serum Set", amount: "$39.99", status: "pending" },
  { id: "ORD-003", influencer: "Alex", product: "Yoga Mat Premium", amount: "$44.00", status: "completed" },
  { id: "ORD-004", influencer: "Chris", product: "Fitness Band", amount: "$12.99", status: "failed" },
];

const fade = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.08 } });

const statusConfig: Record<string, { icon: React.ElementType; class: string }> = {
  completed: { icon: CheckCircle2, class: "text-green-600 bg-green-100" },
  pending: { icon: Clock, class: "text-yellow-600 bg-yellow-100" },
  failed: { icon: XCircle, class: "text-red-600 bg-red-100" },
};

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div {...fade(0)}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and management.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fade(i + 1)} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><s.icon size={20} className="text-muted-foreground" /></div>
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${s.up ? "text-green-600" : "text-red-500"}`}>
                {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{s.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <motion.div {...fade(5)} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Pending Approvals</h2>
          <div className="space-y-3">
            {pendingInfluencers.map(inf => (
              <div key={inf.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">{inf.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{inf.name}</p>
                  <p className="text-xs text-muted-foreground">{inf.followers} followers · {inf.applied}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full hover:opacity-90">Approve</button>
                  <button className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-semibold rounded-full hover:bg-destructive/10 hover:text-destructive">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div {...fade(6)} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {recentOrders.map(order => {
              const sc = statusConfig[order.status];
              return (
                <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sc.class}`}><sc.icon size={14} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{order.product}</p>
                    <p className="text-xs text-muted-foreground">by {order.influencer} · {order.id}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground">{order.amount}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
