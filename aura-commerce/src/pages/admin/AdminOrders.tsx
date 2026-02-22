import { motion } from "framer-motion";
import { Search, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useState } from "react";

const mockOrders = [
  { id: "ORD-2847", customer: "John Doe", influencer: "Surya", product: "Protein Shaker Pro", amount: "$24.99", date: "2024-01-15", status: "completed" },
  { id: "ORD-2848", customer: "Jane Smith", influencer: "Maya", product: "Glow Serum Set", amount: "$39.99", date: "2024-01-15", status: "pending" },
  { id: "ORD-2849", customer: "Mike Brown", influencer: "Surya", product: "Fitness Band", amount: "$12.99", date: "2024-01-14", status: "completed" },
  { id: "ORD-2850", customer: "Sarah Wilson", influencer: "Alex", product: "Yoga Mat Premium", amount: "$44.00", date: "2024-01-14", status: "failed" },
  { id: "ORD-2851", customer: "Tom Davis", influencer: "Maya", product: "Lip Gloss Collection", amount: "$18.50", date: "2024-01-13", status: "completed" },
];

const statusConfig: Record<string, { icon: React.ElementType; class: string }> = {
  completed: { icon: CheckCircle2, class: "bg-green-100 text-green-700" },
  pending: { icon: Clock, class: "bg-yellow-100 text-yellow-700" },
  failed: { icon: XCircle, class: "bg-red-100 text-red-600" },
};

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const filtered = mockOrders.filter(o => o.product.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">All Orders</h1>
        <p className="text-muted-foreground text-sm">{mockOrders.length} total orders</p>
      </motion.div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Order", "Customer", "Influencer", "Product", "Amount", "Date", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground p-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => {
                const sc = statusConfig[o.status];
                return (
                  <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-mono text-foreground">{o.id}</td>
                    <td className="p-4 text-sm text-foreground">{o.customer}</td>
                    <td className="p-4 text-sm text-foreground">{o.influencer}</td>
                    <td className="p-4 text-sm text-foreground">{o.product}</td>
                    <td className="p-4 text-sm font-semibold text-foreground">{o.amount}</td>
                    <td className="p-4 text-sm text-muted-foreground">{o.date}</td>
                    <td className="p-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${sc.class}`}>{o.status}</span></td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
