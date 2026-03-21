import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminApi } from "../../lib/api";
import { toast } from "sonner";
import { CheckCircle2, Package, Search, Trash2, Edit, XCircle, AlertCircle, Send } from "lucide-react";

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"REJECT" | "MODIFICATION" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      // Fetching pending product approvals
      const items = await fetchAdminApi("/admin/products/pending");
      const list = Array.isArray(items) ? items : [];
      return list.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category?.name || "Uncategorized",
          brand: p.brand?.name || "Unknown Brand",
          price: `₹${p.basePrice}`,
          status: p.status,
          description: p.description
      }));
    }
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string, status: string, reason?: string }) => {
      // Approve is specialized in controller, but Rejection/Modification can use PATCH /admin/products/:id
      if (status === 'ACTIVE') {
        return fetchAdminApi(`/admin/products/${id}/approve`, { method: 'POST' });
      } else {
        return fetchAdminApi(`/admin/products/${id}`, { 
          method: 'PATCH',
          body: JSON.stringify({ status, rejectionReason: reason })
        });
      }
    },
    onSuccess: (_, variables) => {
      toast.success(`Product ${variables.status.toLowerCase().replace('_', ' ')} successfully.`);
      setFeedbackId(null);
      setFeedbackType(null);
      setFeedbackText("");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchAdminApi(`/admin/products/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast.success("Product removed from catalog.");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", price: "" });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const cleanPrice = typeof data.price === 'string' ? data.price.replace('₹', '') : data.price;
      return fetchAdminApi(`/admin/products/${id}`, { 
        method: 'PATCH',
        body: JSON.stringify({ name: data.name, basePrice: parseFloat(cleanPrice) })
      });
    },
    onSuccess: () => {
      toast.success("Product updated.");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    }
  });

  const filtered = products.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catalog Management</h1>
          <p className="text-muted-foreground text-sm">Approve, edit, and moderate platform products.</p>
        </div>
      </motion.div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search by product or brand..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
            <p className="col-span-full text-center text-muted-foreground py-12">Loading catalog...</p>
        ) : filtered.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-12">No products found.</p>
        ) : filtered.map((p: any, i: number) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative flex flex-col ${editingId === p.id || feedbackId === p.id ? "border-primary ring-2 ring-primary/5 shadow-lg" : "border-border"}`}>
            
            <div className="flex justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:rotate-6`}><Package size={22} className="text-primary" /></div>
              <span className={`text-[9px] px-2 py-0.5 h-fit rounded-full font-black uppercase tracking-widest border border-current opacity-60`}>brand: {p.brand}</span>
            </div>
            
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                   {editingId === p.id ? (
                     <div className="space-y-2">
                       <input 
                         className="w-full text-sm font-bold bg-muted/30 border border-border rounded-lg px-2 py-1 outline-none"
                         value={editData.name}
                         onChange={e => setEditData({ ...editData, name: e.target.value })}
                       />
                       <input 
                         className="w-full text-xs bg-muted/30 border border-border rounded-lg px-2 py-1 outline-none"
                         value={editData.price}
                         onChange={e => setEditData({ ...editData, price: e.target.value })}
                       />
                       <div className="flex gap-2 pt-1">
                         <button
                           type="button"
                           onClick={() =>
                             updateMutation.mutate({
                               id: p.id,
                               data: { name: editData.name, price: editData.price },
                             })
                           }
                           disabled={updateMutation.isPending}
                           className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                         >
                           Save
                         </button>
                         <button
                           type="button"
                           onClick={() => setEditingId(null)}
                           className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
                         >
                           Cancel
                         </button>
                       </div>
                     </div>
                   ) : (
                     <>
                       <h3 className="font-bold text-foreground truncate text-lg">{p.name}</h3>
                       <p className="text-xs text-muted-foreground mt-0.5">{p.category} · {p.price}</p>
                     </>
                   )}
                </div>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 mb-6 flex-1 italic">"{p.description || "No description provided."}"</p>

            <div className="flex flex-col gap-3">
              {feedbackId === p.id ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
                    {feedbackType === "REJECT" ? "Rejection Reason" : "Modification Required"}
                  </label>
                  <div className="relative">
                    <textarea 
                      autoFocus
                      className="w-full text-[12px] bg-muted/50 border border-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      rows={3}
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder="Why is this product being reviewed?"
                    />
                    <button 
                      onClick={() => actionMutation.mutate({ 
                        id: p.id, 
                        status: feedbackType === "REJECT" ? "REJECTED" : "NEEDS_MODIFICATION",
                        reason: feedbackText
                      })}
                      disabled={!feedbackText.trim() || actionMutation.isPending}
                      className="absolute bottom-2 right-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={() => { setFeedbackId(null); setFeedbackType(null); }}
                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors ml-1"
                  >
                    Cancel Action
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-4 border-t border-dashed border-border">
                  <div className="flex gap-2">
                    {p.status === "PENDING_APPROVAL" && (
                      <>
                        <button 
                            onClick={() => actionMutation.mutate({ id: p.id, status: 'ACTIVE' })}
                            disabled={actionMutation.isPending}
                            className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
                            title="Approve & Go Live"
                        >
                            <CheckCircle2 size={16} />
                        </button>
                        <button 
                            onClick={() => { setFeedbackId(p.id); setFeedbackType("MODIFICATION"); }}
                            className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-sm hover:shadow-md"
                            title="Request Modification"
                        >
                            <AlertCircle size={16} />
                        </button>
                        <button 
                            onClick={() => { setFeedbackId(p.id); setFeedbackType("REJECT"); }}
                            className="p-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all shadow-sm hover:shadow-md"
                            title="Reject Product"
                        >
                            <XCircle size={16} />
                        </button>
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-1.5">
                    <button 
                        onClick={() => {
                          setEditingId(p.id);
                          setEditData({ name: p.name, price: p.price });
                        }}
                        className="p-2 bg-white border border-border text-muted-foreground rounded-xl hover:bg-muted/50 transition-colors"
                        title="Edit Details"
                    >
                        <Edit size={16} />
                    </button>
                    <button 
                        onClick={() => {
                            if (confirm("Permanently remove this product?")) {
                                deleteMutation.mutate(p.id);
                            }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-2 bg-white border border-border text-muted-foreground rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all disabled:opacity-50"
                        title="Delete Product"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-widest border border-current transition-colors ${
                p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : 
                p.status === "REJECTED" ? "bg-rose-50 text-rose-600" :
                p.status === "NEEDS_MODIFICATION" ? "bg-amber-50 text-amber-600" :
                "bg-indigo-50 text-indigo-600"
              }`}>
                {p.status.replace('_', ' ')}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">#{p.id.split('-')[0]}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
