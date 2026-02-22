import { motion } from "framer-motion";
import type { Link, Theme } from "../../lib/types";
import { ExternalLink, Star } from "lucide-react";

interface MobilePreviewProps {
    store: any;
    theme: Theme | null;
    links: Link[];
    products?: any[]; // For optional product rendering
}

export default function MobilePreview({ store, theme, links }: MobilePreviewProps) {

    const username = store?.slug || "username";

    // Helper to get background style
    const getBackgroundStyle = () => {
        if (!theme || (theme.background_type === 'flat' && theme.background_value === '#f8fafc')) {
            return { background: 'linear-gradient(to bottom right, #CEE6E6, #FDF1E9, #EBC5C5)' };
        }

        switch (theme.background_type) {
            case 'flat': return { background: theme.background_value };
            case 'gradient': return { background: theme.background_value };
            case 'image': return { backgroundImage: `url(${theme.background_value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
            default: return { background: 'linear-gradient(to bottom right, #CEE6E6, #FDF1E9, #EBC5C5)' };
        }
    };

    // Helper to get button style classes
    const getButtonStyle = () => {
        if (!theme) return "rounded-[32px] shadow-sm"; // default

        switch (theme.button_style) {
            case 'flat': return "rounded-none";
            case 'glass': return "rounded-xl backdrop-blur-md bg-white/20 border border-white/30 shadow-lg";
            case 'rounded': return "rounded-[32px] shadow-sm";
            default: return "rounded-[32px] shadow-sm";
        }
    };

    const fontFamily = theme?.font_family || "Inter, sans-serif";
    const buttonBg = theme?.button_style === 'glass' ? "transparent" : (theme?.button_color || "#ffffff");
    const textColor = theme?.text_color || "#000000";

    return (
        <div className="w-full flex justify-center mt-[-20px] 2xl:mt-10">
            {/* Realistic iPhone Case */}
            <div className="relative w-[320px] h-[660px] bg-neutral-900 rounded-[50px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] shrink-0 flex flex-col group ring-1 ring-black/20 p-[8px]">

                {/* Physical Hardware Buttons */}
                <div className="absolute left-[-2px] top-[100px] w-[3px] h-[26px] bg-neutral-700 rounded-l-md" /> {/* Mute Toggle */}
                <div className="absolute left-[-2px] top-[140px] w-[3px] h-[46px] bg-neutral-700 rounded-l-md" /> {/* Vol Up */}
                <div className="absolute left-[-2px] top-[195px] w-[3px] h-[46px] bg-neutral-700 rounded-l-md" /> {/* Vol Down */}
                <div className="absolute right-[-2px] top-[160px] w-[3px] h-[60px] bg-neutral-700 rounded-r-md" /> {/* Power Button */}

                {/* iPhone Screen Area */}
                <div className="w-full h-full rounded-[42px] relative overflow-hidden bg-white" style={{ ...getBackgroundStyle(), fontFamily }}>

                    {/* Dynamic Island Notch */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[100px] h-[30px] bg-black rounded-full z-50 shadow-inner flex items-center justify-between px-3">
                        {/* Camera Lens Glare */}
                        <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.1)] relative overflow-hidden">
                            <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-blue-500/30 rounded-full blur-[1px]"></div>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/80 mr-1" /> {/* Active cam dot */}
                    </div>

                    {/* Scrollable Content Inside Screen */}
                    <div className="w-full h-full overflow-y-auto no-scrollbar scroll-smooth flex flex-col pt-12 items-center">

                        {/* Share icon top right */}
                        <div className="w-full flex justify-end px-5 pt-1 relative z-10">
                            <button className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center transition-colors shadow-sm backdrop-blur-md" style={{ color: textColor }}>
                                <ExternalLink size={16} />
                            </button>
                        </div>

                        {/* Profile Section */}
                        <div className="flex flex-col items-center text-center px-6 mt-2">
                            <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-muted flex items-center justify-center text-4xl mb-4 shadow-sm border-2 border-white/50 relative group-hover:scale-105 transition-transform duration-500">
                                {store?.avatar_url ? (
                                    <img src={store.avatar_url} alt={store.display_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="bg-[#EABAA0] w-full h-full flex items-center justify-center text-white shrink-0">
                                        <span className="text-3xl font-bold">{store?.display_name?.charAt(0)?.toUpperCase() || "S"}</span>
                                    </div>
                                )}
                            </div>
                            <h2 className="text-[20px] font-bold tracking-tight m-0" style={{ color: textColor }}>
                                @{username}
                            </h2>
                        </div>

                        {/* Links Mapping */}
                        <div className="w-full px-5 flex flex-col gap-4 mt-8 flex-1 pb-16">
                            {links.filter(l => l.is_visible).length === 0 ? (
                                <div className="flex flex-col gap-4 mt-4 animate-pulse">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-full h-[60px] bg-black/5 rounded-[32px]"></div>
                                    ))}
                                </div>
                            ) : (
                                links.filter(l => l.is_visible).map((link, i) => (
                                    <motion.a
                                        key={link.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`w-full p-4 flex items-center justify-center text-[15px] font-semibold transition-transform hover:scale-[1.02] group/link relative cursor-pointer ${getButtonStyle()}`}
                                        style={{
                                            backgroundColor: buttonBg,
                                            color: theme?.button_style === 'glass' ? textColor : (buttonBg === '#ffffff' || buttonBg === 'transparent' ? '#000000' : '#ffffff'),
                                            border: theme?.button_style === 'glass' ? `1px solid ${textColor}30` : (buttonBg === 'transparent' ? '2px solid' : 'none'),
                                            borderColor: buttonBg === 'transparent' ? textColor : undefined
                                        }}
                                    >
                                        {link.thumbnail_url ? (
                                            <div className="absolute left-1.5 w-[46px] h-[46px] shrink-0 rounded-[28px] bg-black/5 flex items-center justify-center overflow-hidden">
                                                <img src={link.thumbnail_url} className="w-full h-full object-cover" />
                                            </div>
                                        ) : null}
                                        <span className="text-center w-full px-14 truncate line-clamp-1">{link.title}</span>
                                        {/* Link Extra options (eg. ellipsis) */}
                                        <div className="absolute right-4 w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors opacity-60 group-hover/link:opacity-100">
                                            <span className="text-[14px]">›</span>
                                        </div>
                                    </motion.a>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                {/* Home indicator bar */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[120px] h-[4px] bg-black/20 rounded-full z-50 pointer-events-none" />
            </div>
        </div>
    );
}
