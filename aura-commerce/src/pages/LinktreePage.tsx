import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ExternalLink, Share, Copy, Check, Link as LinkIcon } from "lucide-react";
import { usePublicStore } from "../hooks/usePublicStore";
import { useTrackEvent } from "../hooks/useAnalytics";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export default function LinktreePage() {
    const { username: slug } = useParams();
    const navigate = useNavigate();
    const { store, theme, links, isStoreLoading, products } = usePublicStore(slug);
    const { track } = useTrackEvent(store?.id);
    const ipRef = useRef<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch("https://api.ipify.org?format=json")
            .then(res => res.json())
            .then(data => ipRef.current = data.ip)
            .catch(() => { });
    }, []);

    // Track page view once store is loaded
    useEffect(() => {
        if (store?.id && slug) {
            track("page_view", undefined, { slug });
        }
    }, [store?.id, slug, track]);

    const handleLinkClick = async (linkId: string, url: string) => {
        // Track the click before opening
        await supabase.rpc("track_link_click", {
            p_link_id: linkId,
            p_user_agent: navigator.userAgent,
            p_ip_address: ipRef.current || ""
        });
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleShare = async () => {
        const pageUrl = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${store?.display_name || slug}'s Linktree`,
                    text: 'Check out my links!',
                    url: pageUrl,
                });
            } else {
                await navigator.clipboard.writeText(pageUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
                toast.success('Link copied!', { description: 'Paste it in your Instagram bio 🔗' });
            }
        } catch (_) {
            await navigator.clipboard.writeText(pageUrl).catch(() => { });
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    if (isStoreLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!store) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl mb-4">🏪</div>
                <h1 className="text-xl font-bold text-foreground">Store Not Found</h1>
                <p className="text-muted-foreground mt-2 max-w-sm">
                    The user you're looking for doesn't exist or is currently inactive.
                </p>
            </div>
        );
    }

    // Helper to get background style
    const getBackgroundStyle = () => {
        if (!theme) return { background: '#f8fafc' }; // Default Light

        switch (theme.background_type) {
            case 'flat': return { background: theme.background_value };
            case 'gradient': return { background: theme.background_value };
            case 'image': return { backgroundImage: `url(${theme.background_value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
            default: return { background: '#f8fafc' };
        }
    };

    // Helper to get button style classes
    const getButtonStyle = () => {
        if (!theme) return "rounded-[24px] shadow-sm"; // default

        switch (theme.button_style) {
            case 'flat': return "rounded-none";
            case 'glass': return "rounded-xl backdrop-blur-md bg-white/20 border border-white/30 shadow-lg";
            case 'rounded': return "rounded-[24px] shadow-md";
            default: return "rounded-[24px] shadow-sm";
        }
    };

    const fontFamily = theme?.font_family || "Inter, sans-serif";
    const buttonBg = theme?.button_style === 'glass' ? "transparent" : (theme?.button_color || "#ffffff");
    const textColor = theme?.text_color || "#000000";

    const hasStore = products && products.length > 0;

    return (
        <div className="min-h-screen w-full flex flex-col items-center" style={{ ...getBackgroundStyle(), fontFamily }}>
            {/* Main Container - Mobile Constrained */}
            <div className="w-full max-w-[600px] min-h-screen flex flex-col px-4 pt-12 pb-24 relative z-10">

                {/* Share button top right — copies link for Instagram bio */}
                <div className="absolute top-6 right-6">
                    <button
                        onClick={handleShare}
                        className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur-md flex items-center justify-center transition-all active:scale-95 shadow-sm"
                        style={{ color: textColor }}
                        title="Share this page"
                    >
                        {copied ? <Check size={18} className="text-emerald-400" /> : <Share size={18} />}
                    </button>
                </div>

                {/* Floating copy-link pill — appears after copy */}
                <AnimatePresence>
                    {copied && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#111] text-white text-[13px] font-semibold px-4 py-2.5 rounded-full shadow-xl"
                        >
                            <Check size={14} className="text-emerald-400" />
                            Link copied — paste in Instagram bio!
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Profile */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center mt-4">
                    <div className="w-24 h-24 rounded-full border-2 overflow-hidden bg-muted flex items-center justify-center text-4xl shadow-sm mb-4" style={{ borderColor: `${textColor}20` }}>
                        {store?.avatar_url ? (
                            <img src={store.avatar_url} alt={store.display_name} className="w-full h-full object-cover" />
                        ) : (
                            store?.display_name?.charAt(0)?.toUpperCase() || "S"
                        )}
                    </div>
                    <h1 className="text-xl font-bold tracking-tight m-0" style={{ color: textColor }}>
                        {store?.display_name || "Your Name"}
                    </h1>
                    <p className="text-sm opacity-80 mt-2 leading-relaxed font-medium max-w-sm" style={{ color: textColor }}>
                        {store?.bio || "Influencer on ShopFluence"}
                    </p>
                </motion.div>

                {/* Social Icons Placeholder */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center justify-center gap-5 mt-6 mb-8" style={{ color: textColor }}>
                    {['Instagram', 'Twitter', 'TikTok'].map((social) => (
                        <div key={social} className="w-10 h-10 rounded-full bg-black/5 backdrop-blur-sm flex items-center justify-center opacity-80 cursor-pointer hover:opacity-100 transition-opacity">
                            <span className="text-xs font-bold">{social[0]}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Links */}
                <div className="w-full flex flex-col gap-4 mt-2">
                    {/* Storefront Link if products exist */}
                    {hasStore && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            onClick={() => navigate(`/store/${store.slug}`)}
                            className={`w-full p-4 flex items-center justify-center text-[15px] font-bold transition-transform hover:scale-[1.02] active:scale-95 group relative ${getButtonStyle()}`}
                            style={{
                                backgroundColor: buttonBg,
                                color: theme?.button_style === 'glass' ? textColor : (buttonBg === '#ffffff' ? '#000000' : '#ffffff'),
                                border: theme?.button_style === 'glass' ? `1px solid ${textColor}40` : 'none'
                            }}
                        >
                            <div className="absolute left-1.5 w-[46px] h-[46px] shrink-0 rounded-[20px] bg-black/5 flex items-center justify-center">
                                <ShoppingBag size={20} />
                            </div>
                            <span className="text-center w-full px-14 truncate line-clamp-1 group-hover:drop-shadow-sm transition-all">Shop My Store</span>
                        </motion.button>
                    )}

                    {links.filter(l => l.is_visible).length === 0 && !hasStore ? (
                        <div className="text-center mt-10 opacity-50 text-sm" style={{ color: textColor }}>
                            No links available right now.
                        </div>
                    ) : (
                        links.filter(l => l.is_visible).map((link, i) => (
                            <motion.button
                                key={link.id}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: (hasStore ? 0.2 : 0.1) + (i * 0.05) }}
                                onClick={() => handleLinkClick(link.id, link.url)}
                                className={`w-full p-4 flex items-center justify-center text-[15px] font-semibold transition-transform hover:scale-[1.02] active:scale-95 group relative ${getButtonStyle()}`}
                                style={{
                                    backgroundColor: buttonBg,
                                    color: theme?.button_style === 'glass' ? textColor : (buttonBg === '#ffffff' ? '#000000' : '#ffffff'),
                                    border: theme?.button_style === 'glass' ? `1px solid ${textColor}40` : 'none'
                                }}
                            >
                                {link.thumbnail_url || link.icon ? (
                                    <div className="absolute left-1.5 w-[46px] h-[46px] shrink-0 rounded-[20px] bg-black/5 flex items-center justify-center overflow-hidden">
                                        {link.thumbnail_url ? <img src={link.thumbnail_url} className="w-full h-full object-cover" /> : <span className="text-xl">{link.icon}</span>}
                                    </div>
                                ) : null}
                                <span className="text-center w-full px-14 truncate line-clamp-1 group-hover:drop-shadow-sm transition-all">{link.title}</span>
                                <div className="absolute right-5 opacity-30 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink size={18} />
                                </div>
                            </motion.button>
                        ))
                    )}
                </div>

                {/* Watermark branding */}
                <div className="mt-auto pt-16 font-bold text-sm opacity-60 tracking-tight flex items-center justify-center gap-1 w-full" style={{ color: textColor }}>
                    Shop<span className="opacity-60">Fluence</span>
                </div>
            </div>
        </div>
    );
}
