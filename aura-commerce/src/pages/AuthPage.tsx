import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Twitter, Youtube, Loader2, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { getPasswordStrengthColor, getPasswordStrengthLabel } from "../lib/security";

/* ─── Tiny TikTok SVG (not in lucide) ───────────────────────────── */
const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z" />
    </svg>
);

/* ─── Google "G" icon ────────────────────────────────────────────── */
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

/* ─── Apple icon ─────────────────────────────────────────────────── */
const AppleIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
);

/* ─── Floating card animations ───────────────────────────────────── */
const float1 = { y: [0, -12, 0] };
const float1T = { duration: 5, repeat: Infinity, ease: "easeInOut" as const };
const float2 = { y: [0, -16, 0] };
const float2T = { duration: 6.5, repeat: Infinity, ease: "easeInOut" as const, delay: 0.8 };
const float3 = { y: [0, -9, 0] };
const float3T = { duration: 7, repeat: Infinity, ease: "easeInOut" as const, delay: 1.5 };
const float4 = { y: [0, -13, 0] };
const float4T = { duration: 5.5, repeat: Infinity, ease: "easeInOut" as const, delay: 2 };

export default function AuthPage() {
    const navigate = useNavigate();
    const {
        signIn, signUp, signInWithGoogle, resetPassword,
        validatePasswordStrength, user, remainingAttempts, retryAfter,
    } = useAuth();
    const [mode, setMode] = useState<"login" | "signup">("login");

    // Initialize mode from URL params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlMode = params.get("mode");
        if (urlMode === "signup") setMode("signup");
        else if (urlMode === "login") setMode("login");
    }, []);

    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState<"affiliate" | "brand">("affiliate");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (user && !loading) {
            const userRole = (user.user_metadata?.role || "").toUpperCase();
            if (userRole === "ADMIN") {
                navigate("/admin", { replace: true });
            } else if (userRole === "AFFILIATE") {
                navigate("/dashboard", { replace: true });
            } else if (userRole === "BRAND") {
                navigate("/brand", { replace: true });
            } else {
                navigate("/role-select", { replace: true });
            }
        }
    }, [user, loading, navigate]);

    // Real-time password strength (signup only)
    const passwordStrength = useMemo(() => {
        if (mode !== "signup" || !password) return null;
        return validatePasswordStrength(password, email);
    }, [password, email, mode, validatePasswordStrength]);

    const isLockedOut = retryAfter !== null && retryAfter > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");
        setLoading(true);

        try {
            if (mode === "signup") {
                if (password !== confirmPass) {
                    setErrorMsg("Passwords do not match");
                    setLoading(false);
                    return;
                }
                // Password policy enforced by AuthContext (validatePassword)
                const { error, requiresEmailConfirmation } = await signUp(email, password, name, role);
                if (error) {
                    setErrorMsg(error);
                    toast.error(error);
                } else {
                    toast.success("Account created successfully!");
                    setSuccessMsg("Account created! Now please log in with your credentials.");
                    setMode("login");
                    setPassword("");
                    setConfirmPass("");
                }
            } else {
                const { error, requiresMFA } = await signIn(email, password);
                if (error) {
                    setErrorMsg(error);
                    toast.error(error);
                } else if (requiresMFA) {
                    toast.info("Please complete MFA verification.");
                    // Future: navigate to MFA challenge page
                } else {
                    toast.success("Welcome back!");

                    // Use user_metadata for role-based routing (no DB query needed)
                    const { data: { user: authUser } } = await import("../lib/supabase").then(m => m.supabase.auth.getUser());
                    if (authUser) {
                        const userRole = (authUser.user_metadata?.role || "").toUpperCase();
                        if (userRole === "ADMIN") {
                            navigate("/admin", { replace: true });
                        } else if (userRole === "AFFILIATE") {
                            navigate("/dashboard", { replace: true });
                        } else if (userRole === "BRAND") {
                            navigate("/brand", { replace: true });
                        } else {
                            navigate("/role-select", { replace: true });
                        }
                    } else {
                        navigate("/role-select", { replace: true });
                    }
                }
            }
        } catch {
            setErrorMsg("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        const { error } = await signInWithGoogle();
        if (error) {
            toast.error(error);
        }
    };

    const handleForgotPassword = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!email) {
            setErrorMsg("Enter your email above, then click Forgot Password.");
            return;
        }
        setLoading(true);
        const { error } = await resetPassword(email);
        setLoading(false);
        if (error) {
            setErrorMsg(error);
        } else {
            // Always show success (user enumeration prevention)
            setSuccessMsg("If that email is registered, you'll receive a password reset link.");
            toast.success("Password reset email sent!");
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                overflow: "hidden",
                background: "#F5F0FF",
            }}
        >
            {/* ════════════════════════════════════════
          LEFT PANEL — Form
      ════════════════════════════════════════ */}
            <div
                style={{
                    position: "relative",
                    width: "50%",
                    background: "#FFFFFF",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "48px 56px",
                    zIndex: 2,
                    /* Curved right edge matching reference */
                    clipPath: "ellipse(100% 100% at 0% 50%)",
                }}
            >
                {/* Logo */}
                <div style={{ position: "absolute", top: "28px", left: "36px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <path d="M13 2C7.48 2 3 6.48 3 12s4.48 10 10 10 10-4.48 10-10S18.52 2 13 2z" fill="#ED9E59" opacity="0.15" />
                        <path d="M8 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#ED9E59" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                        <circle cx="13" cy="8" r="1.5" fill="#ED9E59" />
                        <path d="M13 13v4M10 16h6" stroke="#ED9E59" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span style={{ fontWeight: 700, fontSize: "20px", color: "#2D1B4E", letterSpacing: "-0.02em" }}>
                        ShopFluence
                    </span>
                </div>

                {/* Cookie preferences */}
                <div style={{ position: "absolute", bottom: "16px", left: "36px", fontSize: "11px", color: "rgba(45,27,78,0.4)" }}>
                    Cookie preferences
                </div>

                {/* Form content */}
                <div style={{ maxWidth: "360px", width: "100%" }}>
                    {/* Heading */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <h1
                                style={{
                                    fontSize: "28px",
                                    fontWeight: 800,
                                    color: "#2D1B4E",
                                    margin: "0 0 6px",
                                    letterSpacing: "-0.025em",
                                }}
                            >
                                {mode === "login" ? "Welcome Back" : (role === "brand" ? "Register as Brand" : "Join as Affiliate")}
                            </h1>
                            <p style={{ fontSize: "14px", color: "rgba(45,27,78,0.5)", margin: "0 0 32px" }}>
                                {mode === "login" 
                                    ? "Sign in to your account" 
                                    : (role === "brand" ? "Start selling your products" : "Start earning through sales")}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Authentication Form */}
                    <AnimatePresence mode="wait">
                        <motion.form
                            key={mode + "-form"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            onSubmit={handleSubmit}
                            style={{ display: "flex", flexDirection: "column", gap: "0" }}
                        >
                            {/* Success message */}
                            {successMsg && (
                                <div style={{
                                    padding: "10px 14px",
                                    background: "rgba(16,185,129,0.15)",
                                    border: "1px solid rgba(16,185,129,0.4)",
                                    borderRadius: "8px",
                                    color: "#10B981",
                                    fontSize: "13px",
                                    marginBottom: "12px",
                                }}>
                                    {successMsg}
                                </div>
                            )}

                            {/* Error message */}
                            {errorMsg && (
                                <div style={{
                                    padding: "10px 14px",
                                    background: "rgba(163,64,84,0.15)",
                                    border: "1px solid rgba(163,64,84,0.4)",
                                    borderRadius: "8px",
                                    color: "#A34054",
                                    fontSize: "13px",
                                    marginBottom: "12px",
                                }}>
                                    {errorMsg}
                                </div>
                            )}

                            {/* Role Selector — signup only */}
                            {mode === "signup" && (
                                <div style={{ marginBottom: "20px", display: "flex", background: "rgba(45,27,78,0.05)", borderRadius: "10px", padding: "4px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setRole("affiliate")}
                                        style={{
                                            flex: 1, padding: "10px", border: "none", borderRadius: "8px",
                                            background: role === "affiliate" ? "#44174E" : "transparent",
                                            color: role === "affiliate" ? "#FFFFFF" : "#2D1B4E",
                                            fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                                        }}
                                    >
                                        Affiliate
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole("brand")}
                                        style={{
                                            flex: 1, padding: "10px", border: "none", borderRadius: "8px",
                                            background: role === "brand" ? "#44174E" : "transparent",
                                            color: role === "brand" ? "#FFFFFF" : "#2D1B4E",
                                            fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                                        }}
                                    >
                                        Brand
                                    </button>
                                </div>
                            )}

                            {/* Name — signup only */}
                            {mode === "signup" && (
                                <div style={{ marginBottom: "6px" }}>
                                    <label style={labelStyle}>{role === "brand" ? "Brand/Company Name" : "Full Name"}</label>
                                    <input
                                        type="text"
                                        placeholder={role === "brand" ? "Brand name" : "Your name"}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={inputStyle}
                                        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                                        onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                                    />
                                </div>
                            )}

                            {/* Email */}
                            <div style={{ marginBottom: "6px" }}>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    name="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={inputStyle}
                                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                                />
                            </div>

                            {/* Password */}
                            <div style={{ marginBottom: "6px", position: "relative" }}>
                                <label style={labelStyle}>Password</label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type={showPass ? "text" : "password"}
                                        placeholder="••••••••"
                                        name="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ ...inputStyle, paddingRight: "44px" }}
                                        onFocus={(e) => Object.assign(e.target.style, { ...inputFocusStyle, paddingRight: "44px" })}
                                        onBlur={(e) => Object.assign(e.target.style, { ...inputStyle, paddingRight: "44px" })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        style={{
                                            position: "absolute", right: "14px", top: "50%",
                                            transform: "translateY(-50%)", background: "none",
                                            border: "none", cursor: "pointer", color: "#9ca3af", padding: 0,
                                        }}
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password — signup only */}
                            {mode === "signup" && (
                                <div style={{ marginBottom: "6px", position: "relative" }}>
                                    <label style={labelStyle}>Confirm Password</label>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={confirmPass}
                                            id="confirmPassword"
                                            onChange={(e) => setConfirmPass(e.target.value)}
                                            style={{ ...inputStyle, paddingRight: "44px" }}
                                            onFocus={(e) => Object.assign(e.target.style, { ...inputFocusStyle, paddingRight: "44px" })}
                                            onBlur={(e) => Object.assign(e.target.style, { ...inputStyle, paddingRight: "44px" })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            style={{
                                                position: "absolute", right: "14px", top: "50%",
                                                transform: "translateY(-50%)", background: "none",
                                                border: "none", cursor: "pointer", color: "#9ca3af", padding: 0,
                                            }}
                                        >
                                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Forgot password */}
                            {mode === "login" && (
                                <div style={{ textAlign: "right", marginBottom: "20px" }}>
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        style={{
                                            fontSize: "12px", color: "#ED9E59", textDecoration: "none",
                                            background: "none", border: "none", cursor: "pointer", padding: 0,
                                        }}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            {mode === "signup" && <div style={{ marginBottom: "20px" }} />}

                            {/* Primary CTA */}
                            <motion.button
                                type="submit"
                                disabled={loading || isLockedOut}
                                whileHover={loading ? {} : { scale: 1.015, filter: "brightness(0.96)" }}
                                whileTap={loading ? {} : { scale: 0.98 }}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    background: loading ? "#D4C8E8" : "#44174E",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    color: "#FFFFFF",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    marginBottom: "20px",
                                    letterSpacing: "0.01em",
                                    transition: "background 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                                {loading
                                    ? (mode === "login" ? "Signing in..." : "Creating account...")
                                    : (mode === "login" ? "Log In" : "Create Account")
                                }
                            </motion.button>

                            {/* OR divider */}
                            <div
                                style={{
                                    display: "flex", alignItems: "center", gap: "12px",
                                    margin: "0 0 20px", color: "rgba(45,27,78,0.3)", fontSize: "13px",
                                }}
                            >
                                <div style={{ flex: 1, height: "1px", background: "rgba(45,27,78,0.1)" }} />
                                OR
                                <div style={{ flex: 1, height: "1px", background: "rgba(45,27,78,0.1)" }} />
                            </div>

                            {/* Google */}
                            <motion.button
                                type="button"
                                onClick={handleGoogleSignIn}
                                whileHover={{ scale: 1.015, background: "#f5f5f5" }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: "100%", padding: "12px 16px", marginBottom: "10px",
                                    background: "#FFFFFF", border: "1.5px solid rgba(45,27,78,0.12)",
                                    borderRadius: "10px", cursor: "pointer", display: "flex",
                                    alignItems: "center", justifyContent: "center", gap: "10px",
                                    fontSize: "14px", fontWeight: 500, color: "#2D1B4E",
                                }}
                            >
                                <GoogleIcon />
                                Continue with Google
                            </motion.button>

                            {/* Apple */}
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.015, filter: "brightness(1.1)" }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: "100%", padding: "12px 16px",
                                    background: "#0f172a", border: "none",
                                    borderRadius: "10px", cursor: "pointer", display: "flex",
                                    alignItems: "center", justifyContent: "center", gap: "10px",
                                    fontSize: "14px", fontWeight: 500, color: "#FFFFFF",
                                    marginBottom: "24px",
                                }}
                            >
                                <AppleIcon />
                                Continue with Apple
                            </motion.button>

                            {/* Toggle */}
                            <p style={{ textAlign: "center", fontSize: "14px", color: "rgba(45,27,78,0.6)", margin: 0 }}>
                                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    type="button"
                                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                                    style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        color: "#ED9E59", fontWeight: 600, fontSize: "13px",
                                        textDecoration: "none", padding: 0,
                                    }}
                                >
                                    {mode === "login" ? "Sign Up" : "Sign In"}
                                </button>
                            </p>
                        </motion.form>
                    </AnimatePresence>
                </div>
            </div>

            {/* ════════════════════════════════════════
          RIGHT PANEL — 3D Decorative Visual
      ════════════════════════════════════════ */}
            <div
                style={{
                    width: "50%",
                    flexShrink: 0,
                    background: "linear-gradient(145deg, #44174E 0%, #662249 40%, #1B1931 100%)",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    perspective: "1200px",
                }}
            >
                {/* ── Background ambient blobs ── */}
                <div style={{
                    position: "absolute", top: "5%", right: "10%",
                    width: "380px", height: "380px", borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(237,158,89,0.14) 0%, transparent 65%)",
                    filter: "blur(50px)", pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", bottom: "5%", left: "5%",
                    width: "260px", height: "260px", borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(163,64,84,0.10) 0%, transparent 65%)",
                    filter: "blur(60px)", pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", top: "40%", left: "20%",
                    width: "200px", height: "200px", borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(233,188,185,0.08) 0%, transparent 70%)",
                    filter: "blur(40px)", pointerEvents: "none",
                }} />

                {/* ── 3D Scene Container ── */}
                <div style={{
                    position: "relative",
                    width: "500px",
                    height: "520px",
                    transformStyle: "preserve-3d",
                }}>

                    {/* ════════════════════════
                        CARD 1: Yellow @linkup_flow
                    ════════════════════════ */}
                    <motion.div
                        animate={float1}
                        transition={float1T}
                        whileHover={{ scale: 1.04, rotateY: -4 }}
                        style={{
                            position: "absolute",
                            top: "22%",
                            left: "0%",
                            width: "200px",
                            background: "linear-gradient(135deg, #d4aa3a 0%, #c99a10 55%, #a87c10 100%)",
                            borderRadius: "22px",
                            padding: "18px 20px",
                            boxShadow: [
                                "0 30px 70px rgba(0,0,0,0.45)",
                                "0 8px 20px rgba(0,0,0,0.3)",
                                "inset 0 1px 0 rgba(255,255,255,0.25)",
                            ].join(", "),
                            zIndex: 3,
                            transform: "rotateY(8deg) rotateX(-4deg)",
                            transformOrigin: "center center",
                            cursor: "pointer",
                        }}
                    >
                        {/* Top row: avatar + instagram icon */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {/* Avatar circle */}
                                <div style={{
                                    width: "44px", height: "44px", borderRadius: "50%",
                                    background: "linear-gradient(135deg, #7a4e18, #b87a2a)",
                                    border: "2.5px solid rgba(255,255,255,0.35)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "20px", overflow: "hidden",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                }}>
                                    <span>👤</span>
                                </div>
                                {/* Two line skeleton mock */}
                                <div>
                                    <div style={{ width: "50px", height: "6px", borderRadius: "4px", background: "rgba(255,255,255,0.35)", marginBottom: "5px" }} />
                                    <div style={{ width: "35px", height: "4px", borderRadius: "4px", background: "rgba(255,255,255,0.22)" }} />
                                </div>
                            </div>
                            {/* Instagram icon box */}
                            <div style={{
                                width: "34px", height: "34px", borderRadius: "10px",
                                background: "rgba(255,255,255,0.2)",
                                backdropFilter: "blur(4px)",
                                border: "1px solid rgba(255,255,255,0.3)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                            }}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <rect x="2" y="2" width="20" height="20" rx="6" ry="6" stroke="white" strokeWidth="2" />
                                    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" />
                                    <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
                                </svg>
                            </div>
                        </div>

                        {/* @linkup_flow pill */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            background: "rgba(255,255,255,0.95)",
                            borderRadius: "50px",
                            padding: "9px 16px",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
                        }}>
                            <span style={{
                                fontSize: "14px",
                                color: "#b8901a",
                                fontWeight: 700,
                            }}>✳</span>
                            <span style={{ fontWeight: 700, fontSize: "13px", color: "#1a1a1a", letterSpacing: "-0.01em" }}>@linkup_flow</span>
                        </div>
                    </motion.div>

                    {/* ════════════════════════
                        CARD 2: Alex Chen Green Profile Card (Phone-like)
                    ════════════════════════ */}
                    <motion.div
                        animate={float2}
                        transition={float2T}
                        whileHover={{ scale: 1.03, rotateX: 2 }}
                        style={{
                            position: "absolute",
                            top: "2%",
                            left: "28%",
                            width: "220px",
                            background: "linear-gradient(170deg, #2e8060 0%, #226048 50%, #164535 100%)",
                            borderRadius: "26px",
                            padding: "22px 18px 18px",
                            boxShadow: [
                                "0 40px 80px rgba(0,0,0,0.55)",
                                "0 10px 30px rgba(0,0,0,0.35)",
                                "inset 0 1px 0 rgba(255,255,255,0.18)",
                                "inset 0 -1px 0 rgba(0,0,0,0.2)",
                            ].join(", "),
                            zIndex: 4,
                            transform: "rotateY(-5deg) rotateX(3deg)",
                            transformOrigin: "center center",
                            cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.12)",
                        }}
                    >
                        {/* Profile header */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "18px", gap: "10px" }}>
                            {/* Avatar */}
                            <div style={{
                                width: "54px", height: "54px", borderRadius: "50%",
                                background: "linear-gradient(135deg, #4a7c5a, #2e6040)",
                                border: "3px solid rgba(255,255,255,0.22)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "26px",
                                boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                                overflow: "hidden",
                            }}>
                                👨
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontWeight: 800, fontSize: "15px", color: "#fff", letterSpacing: "-0.01em" }}>Alex Chen</div>
                                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.60)", marginTop: "2px" }}>Wellness Coach</div>
                            </div>
                        </div>

                        {/* Link buttons */}
                        {[
                            { label: "Mindful Movement", bg: "rgba(220,210,185,0.22)", border: "rgba(220,210,185,0.3)" },
                            { label: "Online courses", bg: "rgba(220,210,185,0.18)", border: "rgba(220,210,185,0.25)" },
                            { label: "Wellness retreats", bg: "rgba(195, 110, 65, 0.85)", border: "rgba(220,130,80,0.5)" },
                        ].map((item) => (
                            <div
                                key={item.label}
                                style={{
                                    background: item.bg,
                                    border: `1px solid ${item.border}`,
                                    borderRadius: "10px",
                                    padding: "10px 14px",
                                    marginBottom: "7px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    cursor: "pointer",
                                    backdropFilter: "blur(4px)",
                                    transition: "background 0.2s",
                                }}
                            >
                                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>{item.label}</span>
                                <svg viewBox="0 0 10 6" fill="none" width="10" height="6">
                                    <path d="M1 1L5 5L9 1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        ))}

                        {/* Social icons */}
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px", justifyContent: "center" }}>
                            {[
                                { icon: <Twitter size={13} />, label: "tw" },
                                { icon: <Youtube size={13} />, label: "yt" },
                                { icon: <TikTokIcon />, label: "tt" },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    style={{
                                        width: "36px", height: "36px", borderRadius: "50%",
                                        background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: "#fff",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
                                        cursor: "pointer",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                    }}
                                >
                                    {s.icon}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ════════════════════════
                        CARD 3: Iridescent Sunglasses
                    ════════════════════════ */}
                    <motion.div
                        animate={float3}
                        transition={float3T}
                        whileHover={{ scale: 1.08, rotateZ: -5 }}
                        style={{
                            position: "absolute",
                            top: "0%",
                            right: "2%",
                            width: "120px",
                            height: "105px",
                            borderRadius: "20px",
                            background: "linear-gradient(135deg, rgba(140,170,200,0.15) 0%, rgba(180,160,220,0.12) 50%, rgba(160,200,180,0.1) 100%)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: [
                                "0 16px 40px rgba(0,0,0,0.35)",
                                "inset 0 1px 0 rgba(255,255,255,0.2)",
                                "inset 0 -1px 0 rgba(0,0,0,0.15)",
                            ].join(", "),
                            zIndex: 5,
                            transform: "rotateY(-10deg) rotateX(5deg) rotateZ(8deg)",
                            cursor: "pointer",
                            overflow: "hidden",
                        }}
                    >
                        {/* Iridescent shimmer overlay */}
                        <div style={{
                            position: "absolute", inset: 0, borderRadius: "20px",
                            background: "linear-gradient(120deg, rgba(120,200,255,0.12) 0%, rgba(200,150,255,0.10) 40%, rgba(100,220,180,0.12) 70%, rgba(255,200,100,0.08) 100%)",
                            pointerEvents: "none",
                        }} />
                        <span style={{ fontSize: "52px", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))", position: "relative", zIndex: 1 }}>🕶️</span>
                    </motion.div>

                    {/* ════════════════════════
                        CARD 4: Sports Video Card (Runner)
                    ════════════════════════ */}
                    <motion.div
                        animate={float4}
                        transition={float4T}
                        whileHover={{ scale: 1.04, rotateX: -3 }}
                        style={{
                            position: "absolute",
                            bottom: "4%",
                            right: "0%",
                            width: "185px",
                            height: "130px",
                            borderRadius: "20px",
                            overflow: "hidden",
                            boxShadow: [
                                "0 24px 60px rgba(0,0,0,0.5)",
                                "0 8px 20px rgba(0,0,0,0.3)",
                                "inset 0 1px 0 rgba(255,255,255,0.15)",
                            ].join(", "),
                            zIndex: 3,
                            transform: "rotateY(-6deg) rotateX(-3deg)",
                            cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.12)",
                        }}
                    >
                        {/* Background gradient as photo placeholder */}
                        <div style={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(150deg, #87CEEB 0%, #5ba8d4 20%, #3a8cbf 40%, #4a9a6a 60%, #2d6a3a 80%, #1a4020 100%)",
                        }} />
                        {/* Running figure */}
                        <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "60px",
                        }}>
                            🏃
                        </div>
                        {/* Play button overlay row */}
                        <div style={{
                            position: "absolute",
                            bottom: 0, left: 0, right: 0,
                            padding: "8px 12px",
                            background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                            {/* Play button */}
                            <div style={{
                                width: "30px", height: "30px", borderRadius: "50%",
                                background: "rgba(255,255,255,0.92)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                            }}>
                                <svg viewBox="0 0 24 24" fill="#1a1a1a" width="12" height="12">
                                    <polygon points="6,3 20,12 6,21" />
                                </svg>
                            </div>
                            {/* Progress bar */}
                            <div style={{ flex: 1, marginLeft: "8px", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.3)" }}>
                                <div style={{ width: "35%", height: "100%", background: "#fff", borderRadius: "2px" }} />
                            </div>
                        </div>
                    </motion.div>

                    {/* ════════════════════════
                        Sparkle Star
                    ════════════════════════ */}
                    <motion.div
                        animate={{ rotate: [0, 20, -15, 5, 0], scale: [1, 1.15, 0.9, 1.05, 1] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                        style={{
                            position: "absolute",
                            bottom: "16%",
                            right: "-2%",
                            zIndex: 6,
                            filter: "drop-shadow(0 0 12px rgba(210,230,255,0.8)) drop-shadow(0 0 4px rgba(255,255,255,0.6))",
                            color: "rgba(230,240,255,0.9)",
                            fontSize: "34px",
                            lineHeight: 1,
                        }}
                    >
                        ✦
                    </motion.div>

                    {/* ── Small secondary sparkle ── */}
                    <motion.div
                        animate={{ rotate: [0, -12, 10, 0], scale: [1, 1.2, 0.85, 1] }}
                        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                        style={{
                            position: "absolute",
                            top: "60%",
                            left: "8%",
                            zIndex: 2,
                            fontSize: "16px",
                            color: "rgba(200,220,255,0.5)",
                            filter: "drop-shadow(0 0 6px rgba(180,210,255,0.5))",
                        }}
                    >
                        ✦
                    </motion.div>

                    {/* ── Decorative dot cluster ── */}
                    {[["52%", "6%", 12], ["58%", "10%", 7], ["56%", "14%", 5]].map(([top, left, size], i) => (
                        <div key={i} style={{
                            position: "absolute", top: top as string, left: left as string,
                            width: `${size}px`, height: `${size}px`, borderRadius: "50%",
                            background: "rgba(255,255,255,0.12)",
                        }} />
                    ))}

                    {/* ── Subtle floating ring ── */}
                    <motion.div
                        animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.25, 0.15] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            position: "absolute",
                            bottom: "14%", left: "14%",
                            width: "80px", height: "80px",
                            borderRadius: "50%",
                            border: "1.5px solid rgba(255,255,255,0.2)",
                            zIndex: 1,
                            pointerEvents: "none",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

/* ─── Shared input styles ────────────────────────────────────────── */
const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    color: "#44174E",
    marginBottom: "6px",
    fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid rgba(68,23,78,0.2)",
    borderRadius: "10px",
    fontSize: "15px",
    color: "#2D1B4E",
    background: "#FFFFFF",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
};

const inputFocusStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: "#ED9E59",
    boxShadow: "0 0 0 3px rgba(237,158,89,0.15)",
    background: "#FFFFFF",
};
