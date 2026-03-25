import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ShoppingBag, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useAffiliateOnboardingStatus, useProfile } from "../components/guards/RouteGuards";

const roles = [
  {
    id: "affiliate",
    title: "Affiliate",
    description: "Promote products and earn commissions on every sale.",
    icon: Users,
    color: "hsl(236, 60%, 50%)",
    bg: "hsl(236, 60%, 90%)",
  },
  {
    id: "brand",
    title: "Brand / Vendor",
    description: "Upload my products and let affiliates sell them for me.",
    icon: ShoppingBag,
    color: "hsl(28, 70%, 55%)",
    bg: "hsl(28, 70%, 90%)",
  },
];

export default function RoleSelect() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: onboardingDone, isLoading: onboardingLoading } = useAffiliateOnboardingStatus();

  // Already completed role + onboarding — skip this screen after login
  useEffect(() => {
    if (!user || profileLoading) return;
    if (!profile) return;

    const r = profile.role?.toLowerCase();
    if (r === "customer" || !r) return;

    if (r === "brand") {
      navigate("/brand", { replace: true });
      return;
    }
    if (r === "admin") {
      navigate("/admin", { replace: true });
      return;
    }
    if (r === "influencer" || r === "affiliate") {
      if (onboardingLoading) return;
      if (onboardingDone === true) {
        navigate("/dashboard", { replace: true });
      } else if (onboardingDone === false) {
        navigate("/onboarding/affiliate", { replace: true });
      }
    }
  }, [user, profile, profileLoading, onboardingLoading, onboardingDone, navigate]);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured. Please check your environment variables.");
      }

      const { data, error: authError } = await supabase.auth.getUser();
      const u = data?.user;

      if (authError || !u) {
        navigate("/auth?mode=login", { replace: true });
        return;
      }

      const dbRole = selected === "affiliate" ? "influencer" : "brand";

      const { error: rpcError } = await supabase.rpc("set_user_role", {
        new_role: dbRole,
      });

      if (rpcError) {
        toast.error(rpcError.message || "Could not save your role. Please try again.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["profile", u.id] });
      await queryClient.refetchQueries({ queryKey: ["profile", u.id] });
      await queryClient.invalidateQueries({ queryKey: ["affiliate-onboarding-status", u.id] });

      toast.success(
        dbRole === "brand"
          ? "Saved — you're set up as a brand."
          : "Saved — you're set up as an affiliate."
      );

      if (selected === "brand") {
        navigate("/brand", { replace: true });
      } else {
        navigate("/onboarding/affiliate", { replace: true });
      }
    } catch (err) {
      console.error("Role transition failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Progress bar */}
      <div className="w-full max-w-md mb-12">
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: selected ? "100%" : "50%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <motion.h1
        className="text-3xl md:text-4xl font-bold text-foreground text-center mb-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Which best describes your role?
      </motion.h1>
      <motion.p
        className="text-muted-foreground text-center mb-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        This helps us personalize your experience.
      </motion.p>

      <div className="w-full max-w-md flex flex-col gap-4">
        {roles.map((role, i) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
            onClick={() => setSelected(role.id)}
            className={`
              relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200
              ${selected === role.id
                ? "border-foreground shadow-lg shadow-void/50 scale-[1.02]"
                : "border-border hover:border-muted-foreground/40 hover:shadow-md"
              }
            `}
            style={{ background: "hsl(var(--card))" }}
            whileHover={{ scale: selected === role.id ? 1.02 : 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">{role.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{role.description}</p>
            </div>
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: role.bg }}
            >
              <role.icon size={28} style={{ color: role.color }} />
            </div>
          </motion.button>
        ))}
      </div>

      <motion.div
        className="w-full max-w-md mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className={`
            w-full py-4 rounded-full text-base font-black transition-all duration-500 flex items-center justify-center gap-2
            ${selected
              ? "bg-[#44174E] text-white shadow-xl shadow-[#44174E]/30 scale-100 hover:scale-[1.02] active:scale-[0.98] cursor-pointer animate-pulse-highlight"
              : "bg-muted text-muted-foreground cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            <>
              Continue
              <motion.span
                animate={{ x: selected ? 4 : 0 }}
                transition={{ repeat: Infinity, duration: 0.8, repeatType: "mirror" }}
              >
                →
              </motion.span>
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
