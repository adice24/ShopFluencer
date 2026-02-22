import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Copy, BarChart2, Plus, ArrowRight, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

interface ShortLink {
    id: string;
    title: string;
    original_url: string;
    short_code: string;
    clicks: number;
    created_at: string;
    _count?: { linkClicks: number };
}

async function getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
    };
}

async function fetchLinks(): Promise<ShortLink[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/links`, { headers });
    if (!res.ok) throw new Error("Failed to load links");
    const body = await res.json();
    return body.data ?? body;
}

async function createLink(payload: { originalUrl: string; title: string }): Promise<ShortLink> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/links`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create link");
    }
    const body = await res.json();
    return body.data ?? body;
}

async function deleteLink(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/links/${id}`, { method: "DELETE", headers });
    if (!res.ok && res.status !== 204) throw new Error("Failed to delete link");
}

export default function LinkShortenerPage() {
    const queryClient = useQueryClient();
    const [newTitle, setNewTitle] = useState("");
    const [newUrl, setNewUrl] = useState("");

    const { data: links = [], isLoading, isError, refetch, isFetching } = useQuery<ShortLink[]>({
        queryKey: ["shortlinks"],
        queryFn: fetchLinks,
        retry: 1,
    });

    const createMutation = useMutation({
        mutationFn: createLink,
        onSuccess: (newLink) => {
            queryClient.setQueryData<ShortLink[]>(["shortlinks"], (old) => [newLink, ...(old ?? [])]);
            setNewTitle("");
            setNewUrl("");
            const shortDomain = window.location.host;
            toast.success("Short link generated!", {
                description: `${shortDomain}/${newLink.short_code} is ready!`,
            });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLink,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["shortlinks"] });
            const prev = queryClient.getQueryData<ShortLink[]>(["shortlinks"]);
            queryClient.setQueryData<ShortLink[]>(["shortlinks"], (old) => old?.filter(l => l.id !== id) ?? []);
            return { prev };
        },
        onError: (_e, _id, ctx) => {
            queryClient.setQueryData(["shortlinks"], ctx?.prev);
            toast.error("Failed to delete link");
        },
        onSuccess: () => toast.success("Link deleted"),
    });

    const handleCreate = () => {
        if (!newUrl) return toast.error("Please enter a destination URL");
        if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
            return toast.error("URL must start with http:// or https://");
        }
        createMutation.mutate({ originalUrl: newUrl, title: newTitle || "Untitled Link" });
    };

    const shortDomain = window.location.host;

    const handleCopy = (code: string) => {
        const urlToCopy = `${window.location.origin}/${code}`;
        navigator.clipboard.writeText(urlToCopy);
        toast.success("Copied!", { description: `${shortDomain}/${code}` });
    };

    const redirectBase = `${window.location.origin.replace(/:\d+$/, '')}/r`;

    return (
        <div className="max-w-[720px] mx-auto pb-40">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-[28px] font-extrabold text-[#2F3E46] tracking-tight">Link Shortener</h1>
                    <p className="text-muted-foreground text-[14px] font-medium mt-1">
                        Create trackable short links. Anyone can click — no login needed.
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="p-2.5 rounded-xl bg-black/5 hover:bg-black/10 transition-colors text-muted-foreground"
                    title="Refresh links"
                >
                    <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Creation Box */}
            <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-border/40 p-6 mb-10 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-fuchsia-400" />

                <h2 className="text-[16px] font-bold text-[#2F3E46] mb-5 flex items-center gap-2">
                    <Link2 size={18} className="text-violet-500" />
                    Create New Shortlink
                </h2>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="font-bold text-foreground/70 text-[13px]">Link Title (Internal Label)</Label>
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="e.g. Instagram Bio Link"
                            className="rounded-xl px-4 py-3 h-auto font-medium bg-[#FAFAFA] border-border/60"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-foreground/70 text-[13px]">Destination URL *</Label>
                        <Input
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            placeholder="https://example.com/very/long/url..."
                            className="rounded-xl px-4 py-3 h-auto font-medium bg-[#FAFAFA] border-border/60"
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                        <p className="text-[12px] text-muted-foreground font-medium">
                            Generated: <span className="text-violet-500 font-bold">{shortDomain}/xxxxxxx</span>
                        </p>
                        <button
                            onClick={handleCreate}
                            disabled={createMutation.isPending}
                            className="bg-[#2F3E46] hover:bg-black text-white font-bold py-3 px-8 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50 text-[14px]"
                        >
                            <Plus size={16} />
                            {createMutation.isPending ? "Generating..." : "Shorten Link"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Links List */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-extrabold text-[#2F3E46]">Your Links</h2>
                {links.length > 0 && (
                    <span className="text-[13px] font-bold text-muted-foreground bg-black/5 px-3 py-1 rounded-full">
                        {links.length} link{links.length !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-black/5 rounded-[20px] h-24 animate-pulse" />
                    ))}
                </div>
            ) : isError ? (
                <div className="bg-red-50 border border-red-100 rounded-[20px] p-6 text-center">
                    <p className="text-[14px] font-bold text-red-600 mb-3">
                        Could not load links — is the backend running?
                    </p>
                    <button onClick={() => refetch()} className="text-[13px] font-bold underline text-red-500">
                        Try again
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {links.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-black/5 rounded-[24px] p-10 text-center border border-border/40 border-dashed"
                            >
                                <Link2 size={28} className="text-muted-foreground/40 mx-auto mb-3" />
                                <p className="text-muted-foreground font-bold text-[15px]">No links yet</p>
                                <p className="text-[13px] text-muted-foreground mt-1">Create your first short link above</p>
                            </motion.div>
                        ) : (
                            links.map((link, i) => {
                                const clickCount = link._count?.linkClicks ?? link.clicks ?? 0;
                                const shortUrl = `${shortDomain}/${link.short_code}`;
                                const redirectUrl = `${window.location.origin}/${link.short_code}`;

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96 }}
                                        transition={{ delay: i * 0.04 }}
                                        key={link.id}
                                        className="bg-white rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-border/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[15px] text-[#2F3E46] truncate">{link.title}</h3>

                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-violet-600 font-bold text-[13px] bg-violet-50 px-2.5 py-0.5 rounded-full">
                                                    {shortUrl}
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(link.short_code)}
                                                    className="text-muted-foreground hover:text-violet-600 transition-colors p-1"
                                                    title="Copy short link"
                                                >
                                                    <Copy size={13} />
                                                </button>
                                                <a
                                                    href={redirectUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-muted-foreground hover:text-violet-600 transition-colors p-1"
                                                    title="Test redirect"
                                                >
                                                    <ExternalLink size={13} />
                                                </a>
                                            </div>

                                            <div className="flex items-center gap-1 mt-1.5 text-muted-foreground text-[12px] truncate">
                                                <ArrowRight size={11} className="shrink-0" />
                                                <a
                                                    href={link.original_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="truncate hover:underline"
                                                >
                                                    {link.original_url}
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 border-t sm:border-t-0 border-border/30 pt-4 sm:pt-0 shrink-0">
                                            <div className="bg-black/5 px-3 py-2 rounded-xl flex items-center gap-1.5">
                                                <BarChart2 size={14} className="text-muted-foreground" />
                                                <span className="font-extrabold text-[14px] text-[#2F3E46]">
                                                    {clickCount.toLocaleString()}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    Clicks
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => deleteMutation.mutate(link.id)}
                                                disabled={deleteMutation.isPending}
                                                className="text-red-400 hover:text-red-600 p-2 transition-colors disabled:opacity-40"
                                                title="Delete link"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
