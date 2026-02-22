import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  MousePointerClick,
  TrendingUp,
  ShoppingCart,
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  ExternalLink,
  MoreHorizontal
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { useMyStore } from "../../hooks/useInfluencerStore";
import { useAnalyticsDashboard } from "../../hooks/useAnalytics";
import { useLinkAnalytics } from "../../hooks/useLinkAnalytics";
import { useOrders } from "../../hooks/useOrders";

const statusColors: Record<string, string> = {
  paid: "bg-[#E6F4EA] text-[#137333]",
  completed: "bg-[#E6F4EA] text-[#137333]",
  pending: "bg-[#FEF7E0] text-[#B06000]",
  processing: "bg-[#E8F0FE] text-[#1A73E8]",
  shipped: "bg-[#F3E8FD] text-[#681DA8]",
  delivered: "bg-[#E6F4EA] text-[#137333]",
  cancelled: "bg-[#FCE8E6] text-[#C5221F]",
  refunded: "bg-[#F1F3F4] text-[#3C4043]",
  failed: "bg-[#FCE8E6] text-[#C5221F]",
};

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: i * 0.05, ease: "easeOut" },
});

export default function AnalyticsAndOrders() {
  const location = useLocation();
  const { store } = useMyStore();
  const { analytics, isLoading } = useAnalyticsDashboard(store?.id);
  const { analytics: linkAnalytics, isLoading: linksLoading } = useLinkAnalytics(store?.id);
  const { orders, isLoading: ordersLoading, updateOrderStatus } = useOrders(store?.id);

  const [activeTab, setActiveTab] = useState<"insights" | "orders">(
    location.pathname.includes("orders") ? "orders" : "insights"
  );

  useEffect(() => {
    setActiveTab(location.pathname.includes("orders") ? "orders" : "insights");
  }, [location.pathname]);

  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "365d">("30d");
  const [search, setSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (isLoading || linksLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-[3px] border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const safe = analytics || {
    pageViews: 0,
    productClicks: 0,
    addToCarts: 0,
    purchases: 0,
    conversionRate: 0,
  };

  // Dummy chart data for Instagram-style premium graph
  const chartData = [
    { name: "Mon", clicks: 120, views: 300 },
    { name: "Tue", clicks: 180, views: 420 },
    { name: "Wed", clicks: 350, views: 600 },
    { name: "Thu", clicks: 200, views: 500 },
    { name: "Fri", clicks: 450, views: 800 },
    { name: "Sat", clicks: 390, views: 650 },
    { name: "Sun", clicks: Math.round(safe.productClicks) || 500, views: Math.round(safe.pageViews) || 900 },
  ];

  const filteredOrders = orders?.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      {/* Header & Tabs */}
      <motion.div {...fadeUp(0)} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#111827] tracking-tight">Performance</h1>
          <p className="text-[#6B7280] font-medium text-[15px] mt-1">Track your audience and sales</p>
        </div>

        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab("insights")}
            className={`px-6 py-2.5 rounded-full text-[14px] font-bold transition-all ${activeTab === "insights" ? "bg-[#111827] text-white shadow-md" : "text-[#4B5563] hover:text-[#111827]"
              }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-2.5 rounded-full text-[14px] font-bold transition-all ${activeTab === "orders" ? "bg-[#111827] text-white shadow-md" : "text-[#4B5563] hover:text-[#111827]"
              }`}
          >
            Orders
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "insights" ? (
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Top Stat Cards - Premium IG Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: "Profile Views", value: safe.pageViews, icon: Eye, color: "#8B5CF6", bg: "#F5F3FF" },
                { label: "Link Clicks", value: safe.productClicks, icon: MousePointerClick, color: "#EC4899", bg: "#FDF2F8" },
                { label: "Add to Cart", value: safe.addToCarts, icon: ShoppingCart, color: "#F59E0B", bg: "#FFFBEB" },
                { label: "Sales Conversion", value: `${safe.conversionRate || 0}%`, icon: TrendingUp, color: "#10B981", bg: "#ECFDF5" }
              ].map((stat, i) => (
                <motion.div {...fadeUp(i + 1)} key={i} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: stat.bg, color: stat.color }}>
                    <stat.icon size={24} strokeWidth={2.5} />
                  </div>
                  <p className="text-[#6B7280] font-medium text-[14px] mb-1">{stat.label}</p>
                  <h3 className="text-[28px] font-extrabold text-[#111827]">{stat.value.toLocaleString()}</h3>
                </motion.div>
              ))}
            </div>

            {/* Premium Chart Area */}
            <motion.div {...fadeUp(5)} className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-[20px] font-bold text-[#111827]">Performance Summary</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[32px] font-extrabold text-[#111827]">{chartData.reduce((acc, curr) => acc + curr.clicks, 0).toLocaleString()}</span>
                    <span className="text-[#10B981] bg-[#ECFDF5] px-2.5 py-1 rounded-full text-[13px] font-bold flex items-center gap-1">+12.5% <TrendingUp size={14} /></span>
                  </div>
                </div>

                {/* Timeframe selector matching SC2 */}
                <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-200">
                  {["7d", "30d", "90d", "365d"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeframe(t as "7d" | "30d" | "90d" | "365d")}
                      className={`px-5 py-2 text-[13px] font-bold rounded-full transition-all ${timeframe === t ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#374151]"
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[320px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EC4899" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13, fontWeight: 500 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px 16px', fontWeight: 600 }}
                      itemStyle={{ color: '#111827', fontSize: '14px' }}
                    />
                    <Area type="monotone" dataKey="views" stroke="#EC4899" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" dataKey="clicks" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#colorClicks)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Top Links Section */}
            <motion.div {...fadeUp(6)} className="bg-white rounded-[28px] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100">
                <div>
                  <h3 className="text-[20px] font-bold text-[#111827]">Top performing links</h3>
                  <p className="text-[#6B7280] text-[14px] mt-1">Measured by click-through rates</p>
                </div>
                <button className="text-[#7C3AED] text-[14px] font-bold hover:underline">View all</button>
              </div>

              <div className="p-6 md:p-8 space-y-4">
                {linkAnalytics?.topLinks && linkAnalytics.topLinks.length > 0 ? (
                  linkAnalytics.topLinks.map((link, idx) => (
                    <div key={link.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                      <div className="flex items-center gap-5">
                        <span className="text-[16px] font-bold text-gray-400 w-4">{idx + 1}</span>
                        {link.thumbnail_url ? (
                          <img src={link.thumbnail_url} alt="" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#E5E7EB] to-[#F3F4F6] flex items-center justify-center text-gray-400 shadow-sm">
                            <ExternalLink size={20} />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-[#111827] text-[15px]">{link.title}</h4>
                          <p className="text-[#6B7280] text-[13px] truncate max-w-[200px] md:max-w-xs">{link.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-bold text-[#111827] text-[16px]">{link.clicks}</p>
                          <p className="text-[#6B7280] text-[12px] uppercase tracking-wider font-semibold">Clicks</p>
                        </div>
                        <MoreHorizontal className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <ExternalLink className="text-gray-400" />
                    </div>
                    <p className="text-[#111827] font-bold">No active links</p>
                    <p className="text-[#6B7280] text-[14px] max-w-sm mt-1">Add links to your page to start tracking their performance here.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="orders"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Orders Header */}
            <motion.div {...fadeUp(1)} className="flex flex-col sm:flex-row gap-4 mb-2">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders by ID, email, or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 bg-white border border-gray-200 rounded-[20px] text-[15px] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all shadow-sm"
                />
              </div>
              <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-gray-200 rounded-[20px] text-[15px] font-bold text-[#4B5563] hover:bg-gray-50 transition-colors shadow-sm shrink-0">
                <Filter size={18} /> Filter Status
              </button>
            </motion.div>

            {/* Orders List */}
            <motion.div {...fadeUp(2)} className="bg-white border border-gray-100 text-gray-900 rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              {/* Header row */}
              <div className="hidden md:grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr_50px] gap-4 px-8 py-5 bg-[#F9FAFB] border-b border-gray-100 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">
                <span>Order ID</span>
                <span>Customer</span>
                <span>Date</span>
                <span>Status</span>
                <span className="text-right">Total</span>
                <span />
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-16 text-center text-gray-500 font-medium">No orders found.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="group hover:bg-[#F9FAFB] transition-colors">
                      <div
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="w-full grid md:grid-cols-[1fr_2fr_1.5fr_1fr_1fr_50px] items-center gap-4 px-8 py-5 cursor-pointer"
                      >
                        <span className="font-mono text-[14px] font-semibold text-gray-500">#{order.id.split('-')[0]}</span>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-[#111827] truncate">{order.customer_name}</span>
                          <span className="text-[13px] text-gray-500 truncate">{order.customer_email}</span>
                        </div>
                        <span className="text-[14px] text-gray-500 hidden md:block font-medium">
                          {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span>
                          <span className={`inline-flex items-center text-[12px] font-bold px-3 py-1 rounded-full capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}>
                            {order.status}
                          </span>
                        </span>
                        <span className="text-[15px] font-extrabold text-[#111827] text-right">${order.total.toFixed(2)}</span>
                        <div className="flex justify-end text-gray-400 group-hover:text-gray-900 transition-colors">
                          {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {/* Expanded Section */}
                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-[#F3F4F6]/50"
                          >
                            <div className="px-8 py-6 border-t border-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                                <div>
                                  <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Update Status</h4>
                                  <select
                                    className={`w-full text-[14px] font-bold px-4 py-2.5 rounded-xl capitalize outline-none cursor-pointer border border-gray-200 appearance-none bg-white shadow-sm ${statusColors[order.status]}`}
                                    value={order.status}
                                    onChange={(e) => updateOrderStatus.mutate({ orderId: order.id, status: e.target.value as import("../../lib/types").OrderStatus })}
                                  >
                                    {Object.keys(statusColors).map(s => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Shipping</h4>
                                  {order.shipping_address ? (
                                    <p className="text-[14px] text-[#4B5563] font-medium leading-relaxed">
                                      {order.shipping_address.line1}<br />
                                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}<br />
                                      {order.shipping_address.country}
                                    </p>
                                  ) : (
                                    <p className="text-[14px] text-gray-500 italic">No physical shipping required.</p>
                                  )}
                                </div>
                                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                  <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Order Details</h4>
                                  <div className="space-y-2">
                                    {(order.order_items || []).map((item) => (
                                      <div key={item.id} className="flex justify-between items-center text-[14px]">
                                        <span className="font-medium text-[#111827]">{item.product_name} <span className="text-gray-400">x{item.quantity}</span></span>
                                        <span className="font-bold text-[#111827]">${item.subtotal.toFixed(2)}</span>
                                      </div>
                                    ))}
                                    <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center">
                                      <span className="text-[14px] font-medium text-gray-500">Subtotal</span>
                                      <span className="text-[14px] font-bold text-[#111827]">${order.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-[14px] font-medium text-gray-500">Tax</span>
                                      <span className="text-[14px] font-bold text-[#111827]">${order.tax.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center bg-[#F9FAFB] -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
                                      <span className="text-[14px] font-extrabold text-[#111827]">Total</span>
                                      <span className="text-[16px] font-black text-[#7C3AED]">${order.total.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}