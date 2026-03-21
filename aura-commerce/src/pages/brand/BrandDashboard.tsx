import React, { useEffect, useState } from "react";
import { 
  Package, 
  Users, 
  TrendingUp, 
  Plus, 
  ArrowRight,
  ShoppingCart,
  Percent,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function BrandDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<any>(null);
  const [stats, setStats] = useState([
    { label: "Active Affiliates", value: "0", change: "+0%", icon: Users, color: "#4F46E5" },
    { label: "Total Sales", value: "₹0", change: "+0%", icon: ShoppingCart, color: "#10B981" },
    { label: "Products Listed", value: "0", change: "0 new", icon: Package, color: "#F59E0B" },
    { label: "Avg. Commission", value: "10%", change: "Default", icon: Percent, color: "#EC4899" },
  ]);

  useEffect(() => {
    async function fetchBrandData() {
      if (!user) return;
      
      try {
        setLoading(true);
        // 1. Check if brand exists
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (brandError || !brandData) {
          console.log("No brand found, redirecting to registration...");
          navigate('/brand/register');
          return;
        }

        setBrand(brandData);

        // 2. Fetch real stats
        // Products count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brandData.id);

        // This is where real sales/affiliate data would be fetched
        // Since we are setting up, we'll keep placeholders for sales but use real product count
        setStats([
          { label: "Active Affiliates", value: "0", change: "+0%", icon: Users, color: "#4F46E5" },
          { label: "Total Sales", value: "₹0", change: "+0.0%", icon: ShoppingCart, color: "#10B981" },
          { label: "Products Listed", value: (productsCount || 0).toString(), change: "Live", icon: Package, color: "#F59E0B" },
          { label: "Avg. Commission", value: `${brandData.commission_rate || 10}%`, change: "Configured", icon: Percent, color: "#EC4899" },
        ]);

      } catch (err) {
        console.error("Error fetching brand dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBrandData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D1B4E] tracking-tight">
            {brand?.name || "Brand"} Insights
          </h1>
          <p className="text-muted-foreground mt-1">Manage your professional products and track affiliate success.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/brand/add-product"
            className="flex items-center gap-2 px-6 py-3 bg-[#44174E] text-white rounded-full font-bold text-sm shadow-lg shadow-[#44174E]/20 hover:scale-[1.02] transition-transform active:scale-[0.98]"
          >
            <Plus size={18} /> Add New Product
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card/50 backdrop-blur-md border border-white p-6 rounded-[28px] shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
              >
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-[#2D1B4E] mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Graph Placeholder */}
        <div className="bg-card/40 backdrop-blur-md border border-white rounded-[32px] p-8 h-[400px] flex flex-col justify-center items-center text-center">
             <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 mb-4">
                <TrendingUp size={32} />
             </div>
             <h3 className="text-xl font-bold text-[#2D1B4E]">Performance Overview</h3>
             <p className="text-muted-foreground max-w-[300px] mt-2">Visual insights of your sales and affiliate performance will appear here.</p>
        </div>

        {/* Recent Affiliate Activity */}
        <div className="bg-card/40 backdrop-blur-md border border-white rounded-[32px] p-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#2D1B4E]">Top Affiliates</h3>
                <Link to="/brand/affiliates" className="text-sm font-bold text-[#44174E] hover:underline flex items-center gap-1">
                    View all <ArrowRight size={14} />
                </Link>
            </div>
            <div className="space-y-4">
                {/* Real-time affiliates check could go here, but for now we keep it empty or with a message if 0 */}
                {stats[0].value === "0" ? (
                   <div className="text-center py-10">
                     <Users size={40} className="mx-auto text-gray-300 mb-3" />
                     <p className="text-muted-foreground font-medium">No active affiliates yet.</p>
                     <p className="text-xs text-gray-400 mt-1">Your products will appear in the marketplace for influencers.</p>
                   </div>
                ) : (
                  [
                    { name: "Priya Sharma", niche: "Lifestyle", sales: "₹45,200", avatar: "P" },
                  ].map((aff, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center font-bold text-violet-700">
                                  {aff.avatar}
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-[#2D1B4E]">{aff.name}</p>
                                  <p className="text-xs text-muted-foreground">{aff.niche}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="text-sm font-bold text-[#2D1B4E]">{aff.sales}</p>
                              <p className="text-[10px] text-emerald-600 font-bold">Top performer</p>
                          </div>
                      </div>
                  ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
