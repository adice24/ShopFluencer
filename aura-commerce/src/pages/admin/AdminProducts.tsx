import { motion } from "framer-motion";
import { Plus, Search, Package } from "lucide-react";
import { useState } from "react";

const mockProducts = [
  { id: "1", name: "Protein Shaker Pro", category: "Fitness", price: "$24.99", assigned: 12, orders: 340, status: "active" },
  { id: "2", name: "Glow Serum Set", category: "Beauty", price: "$39.99", assigned: 8, orders: 210, status: "active" },
  { id: "3", name: "Ceramic Vase", category: "Home", price: "$59.00", assigned: 3, orders: 42, status: "active" },
  { id: "4", name: "Fitness Band", category: "Fitness", price: "$12.99", assigned: 22, orders: 890, status: "active" },
  { id: "5", name: "Yoga Mat Premium", category: "Fitness", price: "$44.00", assigned: 6, orders: 156, status: "draft" },
];

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const filtered = mockProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm">Manage platform products and assignments</p>
        </div>
        <button className="flex items-center gap-2 bg-destructive text-destructive-foreground px-5 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity">
          <Plus size={18} /> Add Product
        </button>
      </motion.div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3"><Package size={22} className="text-muted-foreground" /></div>
            <h3 className="font-bold text-foreground">{p.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{p.category} · {p.price}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>{p.assigned} influencers</span>
              <span>{p.orders} orders</span>
            </div>
            <div className="mt-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
