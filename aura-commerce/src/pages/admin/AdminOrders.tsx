import { motion } from "framer-motion";
import { Search, CheckCircle2, Clock, XCircle, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminApi } from "../../lib/api";

const statusConfig: Record<string, { icon: React.ElementType; class: string }> = {
  DELIVERED: { icon: CheckCircle2, class: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  CONFIRMED: { icon: CheckCircle2, class: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  PROCESSING: { icon: Clock, class: "bg-amber-50 text-amber-600 border border-amber-100" },
  PENDING: { icon: Clock, class: "bg-amber-50 text-amber-600 border border-amber-100" },
  CANCELLED: { icon: XCircle, class: "bg-rose-50 text-rose-600 border border-rose-100" },
  FAILED: { icon: XCircle, class: "bg-rose-50 text-rose-600 border border-rose-100" },
};

export default function AdminOrders() {
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const raw = await fetchAdminApi("/admin/transactions");
      const data = Array.isArray(raw) ? raw : [];
      return data.map((o: any) => ({
        id: o.orderNumber || o.id,
        customer: o.user?.firstName ? `${o.user.firstName} ${o.user.lastName}` : "Guest",
        affiliate: o.affiliateConversion?.influencer?.user
          ? `${o.affiliateConversion.influencer.user.firstName || ""} ${o.affiliateConversion.influencer.user.lastName || ""}`.trim() ||
            o.affiliateConversion.influencer.displayName ||
            "Affiliate"
          : "Direct",
        product: o.items?.[0]?.productName || "Multiple Items",
        amount: `₹${Number(o.totalAmount).toLocaleString()}`,
        date: new Date(o.createdAt).toLocaleDateString(),
        status: o.status
      }));
    }
  });

  const filtered = orders.filter((o: any) => 
    o.product.toLowerCase().includes(search.toLowerCase()) || 
    o.customer.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction Monitor</h1>
          <p className="text-muted-foreground text-sm">{orders.length} total orders across platform</p>
        </div>
      </motion.div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search orders, customers, or status..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Order ID", "Customer", "Affiliate", "Item", "Amount", "Date", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground p-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center p-12 text-muted-foreground">Monitoring transactions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-12 text-muted-foreground italic">No transactions found.</td></tr>
              ) : (
                filtered.map((o: any, i: number) => {
                  const sc = statusConfig[o.status] || statusConfig.PENDING;
                  return (
                    <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-xs font-mono font-bold text-primary">{o.id}</td>
                      <td className="p-4 text-sm text-foreground">{o.customer}</td>
                      <td className="p-4">
                        <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-md">{o.affiliate}</span>
                      </td>
                      <td className="p-4 text-sm text-foreground truncate max-w-[150px]">{o.product}</td>
                      <td className="p-4 text-sm font-bold text-foreground">{o.amount}</td>
                      <td className="p-4 text-xs text-muted-foreground">{o.date}</td>
                      <td className="p-4">
                        <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-1 rounded-md flex items-center gap-1 w-fit ${sc.class}`}>
                          <sc.icon size={10} />
                          {o.status}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
