import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ShoppingBag, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

const roles = [
  {
    id: "influencer",
    title: "Influencer",
    description: "Build my following and monetize my audience with my store.",
    icon: Users,
    color: "hsl(236, 60%, 50%)",
    bg: "hsl(236, 60%, 90%)",
  },
  {
    id: "customer",
    title: "Customer",
    description: "Discover products and shop from my favorite creators.",
    icon: ShoppingBag,
    color: "hsl(0, 70%, 55%)",
    bg: "hsl(0, 70%, 90%)",
  },
];

export default function RoleSelect() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);

    try {
      // 1. Call secure RPC to upgrade the role on the backend (bypassing strict RLS constraint safely)
      const { error } = await supabase.rpc('set_user_role', { new_role: selected });

      if (error && error.code !== 'PGRST202') {
        console.error("Failed to update role:", error);
      }

      // 2. Local fallback for immediate redirect evaluation
      localStorage.setItem("shopfluence_role", selected);

      // 3. Force hard redirect to proper decoupled layout
      if (selected === "customer") {
        window.location.href = "/customer";
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
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
            animate={{ width: selected ? "66%" : "33%" }}
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
                ? "border-foreground shadow-lg scale-[1.02]"
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
            w-full py-4 rounded-full text-base font-bold transition-all duration-300 flex items-center justify-center gap-2
            ${selected
              ? "bg-secondary text-secondary-foreground hover:opacity-90 shadow-lg cursor-pointer"
              : "bg-muted text-muted-foreground cursor-not-allowed"
            }
          `}
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Continue"}
        </button>
      </motion.div>
    </div>
  );
}
