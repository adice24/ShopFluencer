import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Package, 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Edit,
  Trash2,
  ChevronRight,
  Info
} from "lucide-react";

export default function BrandProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      if (!user) return;
      
      const { data: brand } = await supabase
        .from('brands')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (brand) {
        const { data } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(name)
          `)
          .eq('brand_id', brand.id)
          .order('createdAt', { ascending: false });
        
        if (data) setProducts(data);
      }
      setIsLoading(false);
    }
    fetchProducts();
  }, [user]);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'REJECTED': return <XCircle size={16} className="text-rose-500" />;
      case 'NEEDS_MODIFICATION': return <AlertCircle size={16} className="text-amber-500" />;
      default: return <Clock size={16} className="text-indigo-500" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case 'REJECTED': return "bg-rose-50 text-rose-700 border-rose-100";
      case 'NEEDS_MODIFICATION': return "bg-amber-50 text-amber-700 border-amber-100";
      default: return "bg-indigo-50 text-indigo-700 border-indigo-100";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D1B4E] tracking-tight">Product Catalog</h1>
          <p className="text-muted-foreground mt-1">Manage your listings and track approval status.</p>
        </div>
        <Link
          to="/brand/add-product"
          className="flex items-center gap-2 px-6 py-3 bg-[#44174E] text-white rounded-full font-bold text-sm shadow-lg hover:scale-[1.02] transition-all"
        >
          <Plus size={18} /> Add New Product
        </Link>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search your products..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 h-[54px] bg-white/50 backdrop-blur-sm border border-white rounded-2xl outline-none focus:ring-2 focus:ring-[#44174E]/10"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Loading your catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 bg-white/40 border-2 border-dashed border-white rounded-[32px] text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#2D1B4E]">No products found</h3>
            <p className="text-muted-foreground mt-1">Start listing your products to reach affiliates.</p>
            <Link to="/brand/add-product" className="inline-block mt-4 text-[#44174E] font-bold hover:underline">
              Create your first listing
            </Link>
          </div>
        ) : filtered.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group bg-white/50 backdrop-blur-md border border-white hover:border-[#44174E]/20 p-5 rounded-[28px] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6"
          >
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-[#44174E] border border-white shadow-inner overflow-hidden shrink-0">
               <Package size={32} className="opacity-40" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-[#2D1B4E] truncate">{product.name}</h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border flex items-center gap-1.5 ${getStatusStyle(product.status)}`}>
                  {getStatusIcon(product.status)}
                  {product.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {product.category?.name || "No Category"} · ₹{product.base_price} · Stock: {product.stock_quantity || 0}
              </p>
              
              {(product.status === 'REJECTED' || product.status === 'NEEDS_MODIFICATION') && product.rejectionReason && (
                <div className="mt-3 p-3 bg-white/60 rounded-xl border border-current/10 text-xs flex gap-2 items-start animate-in fade-in slide-in-from-left-2 shadow-sm">
                   <Info size={14} className="shrink-0 mt-0.5 text-blue-500" />
                   <div>
                     <span className="font-black uppercase tracking-tighter mr-1">Admin Feedback:</span>
                     <span className="text-muted-foreground italic font-medium">"{product.rejectionReason}"</span>
                   </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 md:pl-6 md:border-l border-white/60">
                <button className="w-10 h-10 rounded-full bg-white border border-white shadow-sm flex items-center justify-center text-muted-foreground hover:text-[#44174E] hover:border-[#44174E]/20 transition-all">
                  <Edit size={18} />
                </button>
                <button className="w-10 h-10 rounded-full bg-white border border-white shadow-sm flex items-center justify-center text-rose-400 hover:text-rose-600 hover:border-rose-100 transition-all">
                  <Trash2 size={18} />
                </button>
                <Link to={`/p/${product.slug}`} target="_blank" className="w-10 h-10 rounded-full bg-[#44174E] text-white flex items-center justify-center hover:scale-110 transition-transform">
                  <ChevronRight size={20} />
                </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
