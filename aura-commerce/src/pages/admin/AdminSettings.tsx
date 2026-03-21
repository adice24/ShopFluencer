import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Percent, ShieldCheck, CreditCard, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminApi } from "@/lib/api";
import { toast } from "sonner";

const fade = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.08 } });

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [platformFee, setPlatformFee] = useState<string>("5");
  const [minPayout, setMinPayout] = useState<string>("1000");

  // Fetch current settings
  const { data: feeSetting, isLoading: feeLoading } = useQuery({
    queryKey: ["admin-setting", "platform_fee"],
    queryFn: () => fetchAdminApi("/admin/settings/platform_fee"),
  });

  const { data: payoutSetting, isLoading: payoutLoading } = useQuery({
    queryKey: ["admin-setting", "min_payout"],
    queryFn: () => fetchAdminApi("/admin/settings/min_payout"),
  });

  useEffect(() => {
    if (feeSetting?.value != null && feeSetting.value !== undefined) {
      setPlatformFee(String(feeSetting.value));
    }
  }, [feeSetting]);

  useEffect(() => {
    if (payoutSetting?.value != null && payoutSetting.value !== undefined) {
      setMinPayout(String(payoutSetting.value));
    }
  }, [payoutSetting]);

  const settingMutation = useMutation({
    mutationFn: (data: { key: string; value: number }) =>
      fetchAdminApi("/admin/settings", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      toast.success(`${variables.key.replace("_", " ")} updated`);
      queryClient.invalidateQueries({ queryKey: ["admin-setting"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSaveFee = () => {
    settingMutation.mutate({ key: "platform_fee", value: parseFloat(platformFee) });
  };

  const handleSavePayout = () => {
    settingMutation.mutate({ key: "min_payout", value: parseFloat(minPayout) });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div {...fade(0)}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global platform parameters and fees.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commission Settings */}
        <motion.div {...fade(1)} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Percent size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Platform Fees</h2>
              <p className="text-xs text-muted-foreground">Commission taken from each sale.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">Default Platform Fee (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={platformFee}
                  onChange={(e) => setPlatformFee(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  placeholder="5.0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
              </div>
            </div>
            
            <button 
              onClick={handleSaveFee}
              disabled={settingMutation.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {settingMutation.isPending && settingMutation.variables?.key === "platform_fee" ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </motion.div>

        {/* Payout Settings */}
        <motion.div {...fade(2)} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Payout Thresholds</h2>
              <p className="text-xs text-muted-foreground">Minimum balance for affiliate withdrawals.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">Minimum Payout (₹)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={minPayout}
                  onChange={(e) => setMinPayout(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  placeholder="1000"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                <style>{`input[type=number]::-webkit-inner-spin-button { padding-left: 20px; }`}</style>
              </div>
            </div>
            
            <button 
              onClick={handleSavePayout}
              disabled={settingMutation.isPending}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {settingMutation.isPending && settingMutation.variables?.key === "min_payout" ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Update Threshold
            </button>
          </div>
        </motion.div>

        {/* Security / Audit */}
        <motion.div {...fade(3)} className="bg-card border border-border rounded-2xl p-6 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Platform Compliance</h2>
              <p className="text-xs text-muted-foreground">System-wide security and audit controls.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All setting changes are recorded in the system audit logs with the timestamp and administrator ID. 
            Modifying platform fees will apply to all <strong>future</strong> transactions and will not retroactively affect existing orders.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
