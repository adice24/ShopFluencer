import { useState, useRef, useEffect } from "react";
import { useLinks } from "../../hooks/useLinks";
import { useTheme } from "../../hooks/useTheme";
import { useMyStore } from "../../hooks/useInfluencerStore";
import MobilePreview from "../../components/dashboard/MobilePreview";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, LayoutGrid, Share, X, Search, MoreHorizontal,
    PenSquare, ArrowUpRight, Trash2, Copy, ExternalLink, Check
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";

export default function LinksPage() {
    const { user } = useAuth();
    const { store } = useMyStore();
    const { links, isLoading, createLink, updateLink, toggleVisibility, deleteLink } = useLinks(user?.id, store?.id);
    const { theme } = useTheme(store?.id);
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://shopfluence.com';

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId]!.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [openMenuId]);

    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newUrl.trim()) return;
        const formattedUrl = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
        await createLink.mutateAsync({ title: newTitle, url: formattedUrl, position: links.length });
        setNewTitle(""); setNewUrl(""); setIsAdding(false);
    };

    const handleCopy = (slug: string, id: string) => {
        navigator.clipboard.writeText(`${baseUrl}/${slug}`);
        setCopiedId(id);
        toast.success("Short link copied!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleShare = async (slug: string, title: string) => {
        const url = `${baseUrl}/${slug}`;
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch (_) {
                navigator.clipboard.writeText(url);
                toast.success("Link copied!");
            }
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard!");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this link? It will stop working immediately.")) return;
        try {
            await deleteLink.mutateAsync(id);
            setOpenMenuId(null);
        } catch (_) { }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-8 h-8 border-2 border-[#E5976D] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto pb-20 justify-center">
            {/* Left/Center Side: Link Management */}
            <div className="flex-1 w-full max-w-2xl space-y-6 mx-auto lg:mx-0">
                <h1 className="text-[26px] font-bold text-[#2F3E46] mb-2 tracking-tight">Links</h1>

                {/* Add New Link Card */}
                <div className="bg-card/60 backdrop-blur-md rounded-[24px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white">
                    {!isAdding ? (
                        <div className="flex items-center justify-between">
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setIsAdding(true)}
                                className="bg-gradient-to-r from-[#F6A678] to-[#E28362] hover:from-[#E28362] hover:to-[#CF6C4B] text-blush py-[12px] px-6 rounded-full font-bold text-[14px] transition-all flex items-center gap-2 shadow-md shadow-[#E28362]/30"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                                Add New Link
                            </motion.button>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-card/80 rounded-[20px] overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
                                <h3 className="font-bold text-[15px] text-[#2F3E46]">Add Link</h3>
                                <button onClick={() => setIsAdding(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                            <form onSubmit={handleAddLink} className="p-4 space-y-3">
                                <div className="relative">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="URL (e.g. https://example.com)"
                                        className="w-full pl-10 pr-4 py-3 bg-black/5 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#E28362]/40 focus:bg-card transition-all font-medium text-[14px]"
                                        value={newUrl}
                                        onChange={e => setNewUrl(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Title (optional)"
                                    className="w-full px-4 py-3 bg-black/5 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#E28362]/40 focus:bg-card transition-all font-medium text-[14px]"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                />
                                <div className="pt-2 flex justify-end">
                                    <button type="submit" className="bg-[#E28362] text-blush px-6 py-2.5 rounded-full font-bold text-[13px] hover:bg-[#CF6C4B] transition-colors disabled:opacity-50" disabled={!newUrl}>
                                        Save Link
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </div>

                {/* Links List */}
                <div className="space-y-4 pt-4">
                    <AnimatePresence>
                        {links.map((link, idx) => (
                            <motion.div
                                key={link.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.04 }}
                                className={`bg-card/70 backdrop-blur-md rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border transition-all flex items-center justify-between group ${!link.is_visible ? 'border-white/40 opacity-70' : 'border-white'}`}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center shrink-0 border border-black/5 text-muted-foreground">
                                        <LayoutGrid size={16} />
                                    </div>

                                    <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                                        <div className="flex items-center gap-2 group/edit">
                                            <input
                                                className="font-extrabold text-[15px] text-[#2F3E46] bg-transparent outline-none w-auto max-w-[200px] truncate hover:bg-black/5 px-2 py-0.5 -ml-2 rounded-md transition-colors"
                                                defaultValue={link.title}
                                                placeholder="Title"
                                                onBlur={(e) => {
                                                    if (e.target.value !== link.title && e.target.value.trim()) {
                                                        updateLink.mutate({ id: link.id, updates: { title: e.target.value } });
                                                    }
                                                }}
                                            />
                                            <PenSquare size={14} className="text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity cursor-pointer shrink-0" />
                                        </div>
                                        <div className="text-[13px] text-muted-foreground font-medium truncate max-w-[220px] px-2">
                                            {link.url}
                                        </div>
                                        {link.short_slug && (
                                            <button
                                                className="flex items-center gap-1.5 bg-[#E28362]/10 w-fit px-2.5 py-1 rounded-[6px] text-[11px] font-bold text-[#E28362] hover:bg-[#E28362]/20 cursor-pointer transition-all mt-0.5"
                                                onClick={() => handleCopy(link.short_slug!, link.id)}
                                                title="Copy short link"
                                            >
                                                {copiedId === link.id ? <Check size={10} /> : <Share size={10} />}
                                                {baseUrl.replace('https://', '')}/{link.short_slug}
                                                <span className="opacity-60 ml-0.5">{copiedId === link.id ? 'Copied!' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Right Actions */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-1 bg-card px-2 py-1 rounded-full shadow-sm">
                                        <span className="text-[12px] font-bold text-muted-foreground pl-1">{link.click_count || 0}</span>
                                        <ArrowUpRight size={14} className="text-[#32C980]" />
                                    </div>

                                    <button
                                        onClick={() => toggleVisibility.mutate({ id: link.id, is_visible: !link.is_visible })}
                                        className={`relative inline-flex h-[28px] w-[50px] shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-colors duration-200 ${link.is_visible ? 'bg-[#F19875]' : 'bg-border/80'}`}
                                    >
                                        <span className={`inline-block h-[24px] w-[24px] transform rounded-full bg-card shadow-sm ring-0 transition duration-200 ease-in-out ${link.is_visible ? 'translate-x-[10px]' : '-translate-x-[11px]'}`} />
                                    </button>

                                    {/* 3-Dot Menu */}
                                    <div className="relative" ref={el => { menuRefs.current[link.id] = el; }}>
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === link.id ? null : link.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-muted-foreground transition-colors"
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>

                                        <AnimatePresence>
                                            {openMenuId === link.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.92 }}
                                                    className="absolute right-0 top-10 z-50 bg-card rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-black/5 overflow-hidden min-w-[160px]"
                                                >
                                                    <button
                                                        onClick={() => { handleCopy(link.short_slug || link.id, link.id); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-semibold text-[#2F3E46] hover:bg-black/4 transition-colors"
                                                    >
                                                        <Copy size={14} className="text-muted-foreground" />
                                                        Copy Short Link
                                                    </button>
                                                    <button
                                                        onClick={() => { handleShare(link.short_slug || '', link.title || 'Link'); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-semibold text-[#2F3E46] hover:bg-black/4 transition-colors"
                                                    >
                                                        <ExternalLink size={14} className="text-muted-foreground" />
                                                        Share Link
                                                    </button>
                                                    <button
                                                        onClick={() => { window.open(`${baseUrl}/${link.short_slug}`, '_blank'); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-semibold text-[#2F3E46] hover:bg-black/4 transition-colors"
                                                    >
                                                        <ExternalLink size={14} className="text-muted-foreground" />
                                                        Test Redirect
                                                    </button>
                                                    <div className="h-px bg-black/5 mx-3" />
                                                    <button
                                                        onClick={() => handleDelete(link.id)}
                                                        className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-semibold text-rose hover:bg-rose/10 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete Link
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {links.length === 0 && !isAdding && (
                        <div className="text-center py-12 text-muted-foreground">
                            <LayoutGrid size={36} className="mx-auto mb-3 opacity-20" />
                            <p className="font-semibold">No links yet. Add your first one above!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Mobile Preview */}
            <div className="hidden lg:flex flex-col items-center sticky top-[100px] h-[calc(100vh-120px)] w-[360px] lg:ml-8">
                <MobilePreview store={store} theme={theme} links={links} />
            </div>
        </div>
    );
}
