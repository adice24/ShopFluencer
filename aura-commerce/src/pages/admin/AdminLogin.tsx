import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { fetchAdminApi } from "../../lib/api";

/** Registered in App.tsx only — not linked from the public app (see `platformAdminPaths.ts`). */
export default function AdminLogin() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showPass, setShowPass] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        try {
            const res = (await fetchAdminApi("/admin/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            })) as { success?: boolean; message?: string };

            if (res?.success === false) {
                throw new Error(res.message || "Login failed");
            }

            toast.success("Admin authenticated successfully.");
            await queryClient.invalidateQueries({ queryKey: ["admin-session"] });
            navigate("/admin", { replace: true });
        } catch (err: any) {
            const msg = err?.message || String(err);
            if (/fetch|network|failed to load|connection refused/i.test(msg)) {
                setErrorMsg(
                    "Cannot reach the API. (1) Start the Nest API: backend/shopfluence-api → npm run start:dev. (2) Match ports: Vite proxies to localhost:3000 by default — if your API uses PORT=3001, set VITE_PROXY_TARGET=http://localhost:3001 in aura-commerce/.env.local and restart npm run dev. See aura-commerce/docs/DEV_SETUP.md."
                );
            } else {
                setErrorMsg(msg || "Invalid admin credentials");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-card font-sans">
            <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-xl border border-blush/08">
                <div className="flex justify-center mb-6 text-rose">
                    <Shield size={48} strokeWidth={1.5} />
                </div>

                <h1 className="text-2xl font-bold text-blush text-center mb-2">Admin Dashboard</h1>
                <p className="text-sm text-blush/55 text-center mb-1">Operator sign-in</p>
                <p className="text-xs text-blush/40 text-center mb-8">User management, catalog, commissions &amp; analytics — restricted access</p>

                <AnimatePresence>
                    {errorMsg && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="p-3 mb-6 text-sm text-rose bg-rose/10 border border-rose/40 rounded-lg">
                            {errorMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-blush mb-1">Admin Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                            className="w-full px-4 py-3 bg-card border border-blush/12 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            placeholder="admin@shopfluence.com" />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-blush mb-1">Admin Password</label>
                        <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                            className="w-full px-4 py-3 bg-card border border-blush/12 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all pr-12"
                            placeholder="••••••••••••" />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-[34px] p-1 text-blush/40 hover:text-blush/70 outline-none">
                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button type="submit" disabled={loading}
                        className={`mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 text-blush rounded-lg font-semibold shadow-md transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-700 hover:shadow-lg shadow-void/50 active:scale-[0.98]'}`}>
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
