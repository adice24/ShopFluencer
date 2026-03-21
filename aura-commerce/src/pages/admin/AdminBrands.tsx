import { useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle2, Ban, Eye, Building2, Percent, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminApi } from "../../lib/api";
import { toast } from "sonner";

const statusBadge: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700",
  SUSPENDED: "bg-rose-100 text-rose-700",
};

export default function AdminBrands() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
        const users = await fetchAdminApi("/admin/users/BRAND");
        const list = Array.isArray(users) ? users : [];
        return list.map((u: any) => {
            const b = u.managedBrands?.[0] || {};
            return {
                id: u.id,
                brandId: b.id,
                name: b.name || `${u.firstName} ${u.lastName}`,
                email: u.email,
                businessType: b.businessType || "N/A",
                gstNumber: b.gstNumber || "N/A",
                status: b.status || u.status || "PENDING_APPROVAL",
                commission: b.commissionRate || 0,
                created_at: u.createdAt
            };
        });
    }
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async ({ id, rate }: { id: string, rate: number }) => {
        return fetchAdminApi(`/admin/brands/${id}/commission`, { 
            method: 'PATCH',
            body: JSON.stringify({ rate })
        });
    },
    onSuccess: () => {
        toast.success("Commission rate updated.");
        queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return fetchAdminApi(`/admin/brands/${userId}/approve`, { method: 'POST' });
    },
    onSuccess: () => {
      toast.success("Brand approved successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
    }
  });

  const suspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Use the generic user suspend
      return fetchAdminApi(`/admin/users/${userId}/suspend`, { method: 'POST' });
    },
    onSuccess: () => {
      toast.success("Brand account suspended.");
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
    }
  });

  const filtered = brands.filter((b: any) =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#111827]">Vendor Management</h1>
        <p className="text-[#6B7280] text-sm">Review registrations and set platform agreements</p>
      </motion.div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search by brand or email..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm" />
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                <th className="text-left text-[11px] font-black text-[#6B7280] uppercase tracking-wider p-4">Brand Information</th>
                <th className="text-left text-[11px] font-black text-[#6B7280] uppercase tracking-wider p-4">Business Details</th>
                <th className="text-left text-[11px] font-black text-[#6B7280] uppercase tracking-wider p-4">Commission %</th>
                <th className="text-left text-[11px] font-black text-[#6B7280] uppercase tracking-wider p-4">Status</th>
                <th className="text-right text-[11px] font-black text-[#6B7280] uppercase tracking-wider p-4 pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-[#9CA3AF] font-bold">Fetching verified vendors...</td></tr>
              ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-[#9CA3AF] font-bold italic">No vendors matching your search.</td></tr>
              ) : filtered.map((brand: any) => (
                <tr key={brand.id} className="hover:bg-[#F9FAFB] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:scale-110 transition-transform">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-[#111827]">{brand.name}</p>
                        <p className="text-[12px] text-[#6B7280]">{brand.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-0.5">
                      <p className="text-[13px] font-bold text-[#374151]">{brand.businessType}</p>
                      <p className="text-[11px] text-[#9CA3AF]">GST: {brand.gstNumber}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <input 
                          type="number" 
                          defaultValue={brand.commission} 
                          className="w-16 h-8 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm font-black text-center focus:border-indigo-500 outline-none transition-all"
                          onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (val !== brand.commission) {
                                  updateCommissionMutation.mutate({ id: brand.brandId, rate: val });
                              }
                          }}
                      />
                      <span className="text-xs font-bold text-[#9CA3AF]">%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] uppercase tracking-[0.05em] font-black px-2.5 py-1 rounded-full shadow-sm border ${statusBadge[brand.status] || "bg-gray-100 text-gray-600"}`}>
                      {brand.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white border-transparent hover:border-[#E5E7EB] border rounded-lg transition-all" title="View Profile">
                           <Eye size={16} className="text-[#6B7280]" />
                      </button>
                      {brand.status === "PENDING_APPROVAL" && (
                          <button 
                              onClick={() => approveMutation.mutate(brand.id)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg shadow-sm hover:shadow-emerald-500/20 transition-all"
                              title="Approve Brand"
                          >
                              <CheckCircle2 size={16} />
                          </button>
                      )}
                      {brand.status === "ACTIVE" && (
                          <button 
                              onClick={() => suspendMutation.mutate(brand.id)}
                              className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-all"
                              title="Suspend Brand"
                          >
                              <Ban size={16} />
                          </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
