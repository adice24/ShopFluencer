import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Plus, TrendingUp, IndianRupee, Package, Building2, Loader2, Star, CheckCircle2, Calculator, Link2, Eye, Heart, X, ExternalLink, ShoppingCart, MessageSquare } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { useMyStore } from "../../hooks/useInfluencerStore";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";

function EarningsCalculatorModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [price, setPrice] = useState(1000);
  const [margin, setMargin] = useState(250);
  const [salesPerDay, setSalesPerDay] = useState(10);

  const daily = margin * salesPerDay;
  const monthly = daily * 30;
  const yearly = daily * 365;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition-colors"><X size={16} /></button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500"><Calculator size={24} /></div>
          <div><h2 className="text-xl font-black text-gray-900">Earnings Calculator</h2><p className="text-sm font-medium text-gray-500">Estimate potential profits</p></div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Product Price (₹)</label>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:border-indigo-500 outline-none transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Affiliate Margin (₹)</label>
            <input type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:border-indigo-500 outline-none transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estimated Sales / Day</label>
            <input type="number" value={salesPerDay} onChange={(e) => setSalesPerDay(Number(e.target.value))} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:border-indigo-500 outline-none transition-colors" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#E1F5EE] to-emerald-50 rounded-2xl p-6 border border-[#5DCAA5]/30">
           <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-600">Daily Earnings:</span>
              <span className="font-black text-lg text-[#1D9E75]">₹{daily.toLocaleString()}</span>
           </div>
           <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-600">Monthly Earnings:</span>
              <span className="font-black text-lg text-[#1D9E75]">₹{monthly.toLocaleString()}</span>
           </div>
           <div className="h-px w-full bg-[#5DCAA5]/20 my-4" />
           <div className="flex justify-between items-center">
              <span className="font-black text-gray-900">Yearly Earnings:</span>
              <span className="font-black text-2xl text-[#1D9E75]">₹{yearly.toLocaleString()}</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Marketplace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterMargin, setFilterMargin] = useState("ALL");
  const [filterBrand, setFilterBrand] = useState("ALL");
  const [sortTrending, setSortTrending] = useState(false);
  const [sortEarnings, setSortEarnings] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  /** Same source as My Store — avoids embed shape bugs (`storefronts` as object vs array). */
  const { store: influencerStore } = useMyStore();
  const storefrontId = influencerStore?.id;

  const { data: myProducts = [] } = useQuery({
    queryKey: ["my-store-products", storefrontId],
    queryFn: async () => {
      const { data } = await supabase.from('storefront_products').select('product_id').eq('storefront_id', storefrontId);
      return (data || []).map(d => d.product_id);
    },
    enabled: !!storefrontId,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["marketplace-products", sortTrending, sortEarnings],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(name),
          brand:brands(name, website_url),
          images:product_images(url)
        `)
        .eq('status', 'ACTIVE');
        
      if (sortEarnings) {
         query = query.order('affiliate_margin', { ascending: false });
      } else if (sortTrending) {
         query = query.order('total_sold', { ascending: false });
      } else {
         query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const addToStoreMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from('storefront_products').insert({
        storefront_id: storefrontId,
        product_id: productId,
        sort_order: myProducts.length
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Added to your store!");
      queryClient.invalidateQueries({ queryKey: ["my-store-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["my-store", user.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["public-store"] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Unique categories and brands for filters
  const categories = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)));
  const brands = Array.from(new Set(products.map(p => p.brand?.name).filter(Boolean)));

  const filteredProducts = products.filter(p => {
    // Search
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    // Category
    if (filterCategory !== "ALL" && p.category?.name !== filterCategory) return false;
    // Brand
    if (filterBrand !== "ALL" && p.brand?.name !== filterBrand) return false;
    // Margin
    if (filterMargin !== "ALL") {
      const margin = parseFloat(p.affiliate_margin);
      if (filterMargin === ">10" && margin < 10) return false;
      if (filterMargin === ">20" && margin < 20) return false;
      if (filterMargin === ">30" && margin < 30) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-black text-[#111827]">Marketplace</h1>
           <p className="text-[#6B7280] font-medium mt-1">Discover highly-converting products to add to your storefront.</p>
        </div>
        <button onClick={() => setCalcOpen(true)} className="hidden md:flex items-center gap-2 bg-[#111827] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#111827]/90 transition-transform active:scale-95 shadow-md">
           <Calculator size={18} /> Earnings Calculator
        </button>
      </motion.div>

      {/* Filters Bar */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input 
            type="text" 
            placeholder="Search products or brands..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 h-[52px] bg-white border border-[#E5E7EB] rounded-2xl shadow-sm text-[15px] font-medium focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-[52px] px-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm text-[14px] font-bold text-[#4B5563] outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c: any) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={filterBrand} 
            onChange={(e) => setFilterBrand(e.target.value)}
            className="h-[52px] px-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm text-[14px] font-bold text-[#4B5563] outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Brands</option>
            {brands.map((b: any) => <option key={b} value={b}>{b}</option>)}
          </select>

          <select 
            value={filterMargin} 
            onChange={(e) => setFilterMargin(e.target.value)}
            className="h-[52px] px-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm text-[14px] font-bold text-[#4B5563] outline-none focus:border-indigo-500"
          >
            <option value="ALL">Any Margin</option>
            <option value=">10">&gt; 10% Margin</option>
            <option value=">20">&gt; 20% Margin</option>
            <option value=">30">&gt; 30% Margin</option>
          </select>
        </div>
      </div>

      {/* Quick Sorting Toggles */}
      <div className="flex items-center gap-3">
         <button 
           onClick={() => { setSortTrending(!sortTrending); setSortEarnings(false); }}
           className={`px-4 py-2 rounded-xl text-[13px] font-black tracking-wide border transition-all flex items-center gap-2 ${sortTrending ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50'}`}
         >
           <TrendingUp size={16} /> Trending Products
         </button>
         <button 
           onClick={() => { setSortEarnings(!sortEarnings); setSortTrending(false); }}
           className={`px-4 py-2 rounded-xl text-[13px] font-black tracking-wide border transition-all flex items-center gap-2 ${sortEarnings ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50'}`}
         >
           <IndianRupee size={16} /> Highest Earnings
         </button>
         <button 
           onClick={() => setCalcOpen(true)}
           className={`md:hidden px-4 py-2 rounded-xl text-[13px] font-black tracking-wide border transition-all flex items-center gap-2 bg-[#111827] text-white shadow-sm`}
         >
           <Calculator size={16} /> Calculator
         </button>
      </div>

      {/* Product Grid */}
      <div className="flex flex-wrap justify-center gap-6">
        {isLoading ? (
           <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
        ) : filteredProducts.length === 0 ? (
           <div className="col-span-full py-20 text-center text-[#9CA3AF] font-bold">No products match your filters.</div>
        ) : (
           filteredProducts.map((product: any, idx) => {
             const isAdded = myProducts.includes(product.id);
             const image = product.images?.[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";

             return (
               <motion.div 
                 key={product.id}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 whileHover={{ y: -4 }}
                 transition={{ delay: idx * 0.05 }}
                 className="w-[215px] bg-gradient-to-b from-white to-[#F9FAFB] rounded-[18px] border border-[#E5E7EB] hover:border-[#1D9E75]/30 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all group overflow-hidden flex flex-col"
               >
                 {/* Thumbnail area with Wishlist Icon */}
                 <div className="relative aspect-square overflow-hidden bg-slate-100/50">
                   <img 
                     src={image} 
                     alt={product.name} 
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                   />
                   
                   {/* Wishlist Icon - Glassmorphism */}
                   <button className="absolute top-2.5 right-2.5 w-8 h-8 backdrop-blur-md bg-white/80 rounded-full flex items-center justify-center text-[#1D9E75] shadow-sm hover:scale-110 active:scale-90 transition-all border border-white/50">
                     <Heart size={15} />
                   </button>
                   
                   {/* Margin Badge - Gradient Glass */}
                   <div className="absolute bottom-2.5 left-2.5 backdrop-blur-md bg-[#1D9E75]/90 text-white px-2.5 py-1 rounded-lg text-[10px] font-black shadow-lg border border-white/20">
                     {product.margin_type === 'PERCENT' ? `${product.affiliate_margin}%` : `₹${product.affiliate_margin}`} MARGIN
                   </div>
                 </div>

                 <div className="p-3.5 flex-1 flex flex-col gap-3">
                   {/* Brand Badge */}
                   <div className="flex items-center gap-1.5 opacity-80">
                     <div className="w-4 h-4 rounded-full bg-[#E1F5EE] flex items-center justify-center text-[#1D9E75] border border-[#5DCAA5]/20">
                       <Building2 size={10} />
                     </div>
                     <span className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-tighter">Verified Creator</span>
                   </div>

                   <div className="space-y-0.5">
                     <h3 className="font-bold text-[#111827] text-[14px] leading-tight line-clamp-2 group-hover:text-[#1D9E75] transition-colors">{product.name}</h3>
                     <p className="text-[11px] text-[#9CA3AF] font-semibold tracking-tight uppercase truncate">{product.category?.name || "General"}</p>
                   </div>
                   
                   <div className="flex items-baseline gap-1">
                     <span className="text-[11px] font-bold text-[#9CA3AF]">₹</span>
                     <span className="font-black text-[#111827] text-[18px] tracking-tight">{product.base_price}</span>
                   </div>

                   <div className="flex flex-col gap-2 mt-auto">
                     {/* Row 1: Add to My Store (Full Width) */}
                     <button
                       onClick={() => !isAdded && addToStoreMutation.mutate(product.id)}
                       disabled={isAdded || addToStoreMutation.isPending || !storefrontId}
                       className={`w-full h-[36px] rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-[12px] shadow-sm ${
                         isAdded 
                          ? 'bg-[#E1F5EE] text-[#1D9E75] border border-[#5DCAA5] cursor-default' 
                          : 'bg-[#1D9E75] text-white hover:bg-[#15805d] hover:shadow-md active:scale-95'
                       }`}
                     >
                       {isAdded ? (
                         <><CheckCircle2 size={14} /> In Store</>
                       ) : addToStoreMutation.isPending ? (
                         <Loader2 size={14} className="animate-spin" />
                       ) : (
                         <><ShoppingCart size={14} /> Add to Store</>
                       )}
                     </button>

                     {/* Row 2: Enquire Brand + Eye Icon */}
                     <div className="flex items-center gap-2">
                       <button
                         onClick={() => {
                           if (product.brand?.website_url) {
                             window.open(product.brand.website_url.startsWith('http') ? product.brand.website_url : `https://${product.brand.website_url}`, '_blank');
                           } else {
                             toast.error("Brand website not available.");
                           }
                         }}
                         className="flex-1 h-[36px] bg-white border border-[#E5E7EB] text-[#4B5563] rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50 active:scale-95 transition-all text-[12px] overflow-hidden px-2 shadow-sm"
                       >
                         <MessageSquare size={14} className="text-[#1D9E75]" />
                         <span className="truncate">Enquire</span>
                       </button>

                       <button
                         onClick={() => toast.info("Opening details...")}
                         className="w-[36px] h-[36px] shrink-0 bg-[#E1F5EE]/50 text-[#1D9E75] rounded-xl flex items-center justify-center hover:bg-[#E1F5EE] border border-[#5DCAA5]/20 active:scale-90 transition-all shadow-sm"
                       >
                         <Eye size={16} />
                       </button>
                     </div>
                   </div>
                 </div>
               </motion.div>
             )
           })
        )}
      </div>

      {calcOpen && <EarningsCalculatorModal isOpen={calcOpen} onClose={() => setCalcOpen(false)} />}
    </div>
  );
}
