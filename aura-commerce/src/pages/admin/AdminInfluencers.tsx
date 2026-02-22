import { useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle2, Ban, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Profile } from "../../lib/types";

const statusBadge: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending_approval: "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-600",
};

export default function AdminInfluencers() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: influencers = [], isLoading } = useQuery({
    queryKey: ["admin-influencers"],
    queryFn: async () => {
      // In a full production setup with the backend, we would call fetchApi('/admin/influencers')
      // For now, we will fetch directly since we require RLS enforcement
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'influencer')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return fetchApi(`/admin/influencers/${userId}/approve`, { method: 'POST' });
    },
    onSuccess: () => {
      toast.success("Influencer approved. They can now access their store.");
      queryClient.invalidateQueries({ queryKey: ["admin-influencers"] });
    },
    onError: (err: Error) => {
      toast.error(`Approval failed: ${err.message}`);
    }
  });

  const suspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      return fetchApi(`/admin/influencers/${userId}/suspend`, { method: 'POST' });
    },
    onSuccess: () => {
      toast.success("Influencer suspended. Store locked.");
      queryClient.invalidateQueries({ queryKey: ["admin-influencers"] });
    }
  });

  const filtered = influencers.filter((i: Profile) =>
    i.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Manage Influencers</h1>
        <p className="text-muted-foreground text-sm">{influencers.length} registered influencers</p>
      </motion.div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search influencers..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground p-4">Influencer</th>
                <th className="text-left text-xs font-semibold text-muted-foreground p-4 hidden md:table-cell">Followers</th>
                <th className="text-left text-xs font-semibold text-muted-foreground p-4 hidden lg:table-cell">Products</th>
                <th className="text-left text-xs font-semibold text-muted-foreground p-4 hidden lg:table-cell">Orders</th>
                <th className="text-left text-xs font-semibold text-muted-foreground p-4">Revenue</th>
                <th className="text-left text-xs font-semibold text-muted-foreground p-4">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">Loading influencers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">No influencers found.</td></tr>
              ) : (
                filtered.map((inf: Profile & { follower_count?: string, product_count?: number, order_count?: number, total_revenue?: number }, i: number) => (
                  <motion.tr key={inf.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground overflow-hidden">
                          {inf.avatar_url ? <img src={inf.avatar_url} className="w-full h-full object-cover" /> : (inf.full_name?.[0] || 'I')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{inf.full_name}</p>
                          <p className="text-xs text-muted-foreground">{inf.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground hidden md:table-cell">{inf.follower_count || '-'}</td>
                    <td className="p-4 text-sm text-foreground hidden lg:table-cell">{inf.product_count || '-'}</td>
                    <td className="p-4 text-sm text-foreground hidden lg:table-cell">{inf.order_count || '-'}</td>
                    <td className="p-4 text-sm font-semibold text-foreground">${inf.total_revenue || 0}</td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge[inf.status] || "bg-muted"}`}>{inf.status.replace("_", " ")}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-muted rounded-lg" title="View Details"><Eye size={14} className="text-muted-foreground" /></button>
                        {inf.status === "pending_approval" && (
                          <button
                            onClick={() => approveMutation.mutate(inf.id)}
                            disabled={approveMutation.isPending}
                            className="p-1.5 hover:bg-green-100 rounded-lg" title="Approve Influencer"
                          >
                            <CheckCircle2 size={14} className="text-green-600" />
                          </button>
                        )}
                        {inf.status === "active" && (
                          <button
                            onClick={() => suspendMutation.mutate(inf.id)}
                            disabled={suspendMutation.isPending}
                            className="p-1.5 hover:bg-red-100 rounded-lg" title="Suspend Influencer"
                          >
                            <Ban size={14} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
