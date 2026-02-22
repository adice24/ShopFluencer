import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Tag } from "lucide-react";

const initialCategories = [
  { id: "1", name: "Fitness", products: 24, color: "bg-green-100 text-green-700" },
  { id: "2", name: "Beauty", products: 18, color: "bg-pink-100 text-pink-700" },
  { id: "3", name: "Home", products: 12, color: "bg-blue-100 text-blue-700" },
  { id: "4", name: "Fashion", products: 32, color: "bg-purple-100 text-purple-700" },
  { id: "5", name: "Tech", products: 8, color: "bg-yellow-100 text-yellow-700" },
];

export default function AdminCategories() {
  const [categories] = useState(initialCategories);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground text-sm">Manage product categories</p>
        </div>
        <button className="flex items-center gap-2 bg-destructive text-destructive-foreground px-5 py-2.5 rounded-full font-semibold text-sm hover:opacity-90">
          <Plus size={18} /> Add Category
        </button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, i) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}><Tag size={18} /></div>
              <div className="flex gap-1">
                <button className="p-1.5 hover:bg-muted rounded-lg"><Edit size={14} className="text-muted-foreground" /></button>
                <button className="p-1.5 hover:bg-destructive/10 rounded-lg"><Trash2 size={14} className="text-destructive" /></button>
              </div>
            </div>
            <h3 className="font-bold text-foreground mt-3">{cat.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{cat.products} products</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
