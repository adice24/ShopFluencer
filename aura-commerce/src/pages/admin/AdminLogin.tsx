import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "../../lib/api";

export default function AdminLogin() {
    const navigate = useNavigate();
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
            const res = await fetchApi('/admin/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (res.error) throw new Error(res.error.message || 'Login failed');

            toast.success("Admin authenticated successfully.");
            // Force reload to apply cookie-based auth changes in admin guards
            window.location.href = "/admin";
        } catch (err: any) {
            setErrorMsg(err.message || 'Invalid admin credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="flex justify-center mb-6 text-red-500">
                    <Shield size={48} strokeWidth={1.5} />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Platform Admin</h1>
                <p className="text-sm text-gray-500 text-center mb-8">Strictly restricted access</p>

                <AnimatePresence>
                    {errorMsg && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="p-3 mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                            {errorMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            placeholder="sysadmin@shopfluence.com" />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
                        <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all pr-12"
                            placeholder="••••••••••••" />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-[34px] p-1 text-gray-400 hover:text-gray-600 outline-none">
                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button type="submit" disabled={loading}
                        className={`mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold shadow-md transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-700 hover:shadow-lg active:scale-[0.98]'}`}>
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
