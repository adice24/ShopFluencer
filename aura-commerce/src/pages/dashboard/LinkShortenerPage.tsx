import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Copy, BarChart2, Plus, ArrowRight, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

// ── Types ───────────────────────────────────────────────────────────────────
interface LinkRow {
    id: string;
    title: string;
    url: string;               // the original destination URL
    short_slug: string;        // the short code (e.g. "zeCzxudf")
    click_count: number;
    created_at: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function generateSlug(len = 8): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── Supabase CRUD ────────────────────────────────────────────────────────────
async function fetchLinks(): Promise<LinkRow[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");

    const { data, error } = await supabase
        .from("short_links")
        .select("id, title, original_url, short_code, clicks, created_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        url: row.original_url,
        short_slug: row.short_code,
        click_count: row.clicks ?? 0,
        created_at: row.created_at,
    }));
}

async function createLink(payload: { originalUrl: string; title: string }): Promise<LinkRow> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");

    let short_slug = "";
    for (let attempts = 0; attempts < 12; attempts++) {
        const candidate = generateSlug(8);
        const { data: clash } = await supabase
            .from("short_links")
            .select("id")
            .eq("short_code", candidate)
            .maybeSingle();
        if (!clash) {
            short_slug = candidate;
            break;
        }
    }

    if (!short_slug) throw new Error("Failed to generate unique slug");

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from("short_links")
        .insert({
            id: crypto.randomUUID(),
            user_id: user.id,
            title: payload.title,
            original_url: payload.originalUrl,
            short_code: short_slug,
            clicks: 0,
            is_active: true,
            updated_at: now,
        })
        .select("id, title, original_url, short_code, clicks, created_at")
        .single();

    if (error) throw new Error(error.message);
    return {
        id: data!.id,
        title: data!.title,
        url: data!.original_url,
        short_slug: data!.short_code,
        click_count: data!.clicks ?? 0,
        created_at: data!.created_at,
    };
}

async function deleteLink(id: string): Promise<void> {
    const { error } = await supabase.from("short_links").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function LinkShortenerPage() {
    const queryClient = useQueryClient();
    const [newTitle, setNewTitle] = useState("");
    const [newUrl, setNewUrl] = useState("");

    const { data: links = [], isLoading, isError, refetch, isFetching } = useQuery<LinkRow[]>({
        queryKey: ["shortlinks"],
        queryFn: fetchLinks,
        retry: 1,
    });

    const createMutation = useMutation({
        mutationFn: createLink,
        onSuccess: (newLink) => {
            queryClient.setQueryData<LinkRow[]>(["shortlinks"], (old) => [newLink, ...(old ?? [])]);
            setNewTitle("");
            setNewUrl("");
            toast.success("Short link created!", {
                description: `${window.location.host}/${newLink.short_slug}`,
            });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLink,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["shortlinks"] });
            const prev = queryClient.getQueryData<LinkRow[]>(["shortlinks"]);
            queryClient.setQueryData<LinkRow[]>(["shortlinks"], (old) => old?.filter(l => l.id !== id) ?? []);
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

    const handleCopy = (slug: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
        toast.success("Copied!", { description: `${shortDomain}/${slug}` });
    };

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
            <div className="bg-card rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-border/40 p-6 mb-10 overflow-hidden relative">
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
                            Generated: <span className="text-violet-500 font-bold">{shortDomain}/xxxxxxxx</span>
                        </p>
                        <button
                            onClick={handleCreate}
                            disabled={createMutation.isPending}
                            className="bg-[#2F3E46] hover:bg-black text-blush font-bold py-3 px-8 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50 text-[14px]"
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
                <div className="bg-rose/10 border border-red-100 rounded-[20px] p-6 text-center">
                    <p className="text-[14px] font-bold text-rose mb-3">Could not load links</p>
                    <button onClick={() => refetch()} className="text-[13px] font-bold underline text-rose">
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
                                const shortUrl = `${shortDomain}/${link.short_slug}`;
                                const redirectUrl = `${window.location.origin}/${link.short_slug}`;

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96 }}
                                        transition={{ delay: i * 0.04 }}
                                        key={link.id}
                                        className="bg-card rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-border/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[15px] text-[#2F3E46] truncate">{link.title}</h3>

                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-violet-600 font-bold text-[13px] bg-violet-50 px-2.5 py-0.5 rounded-full">
                                                    {shortUrl}
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(link.short_slug)}
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
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="truncate hover:underline"
                                                >
                                                    {link.url}
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 border-t sm:border-t-0 border-border/30 pt-4 sm:pt-0 shrink-0">
                                            <div className="bg-black/5 px-3 py-2 rounded-xl flex items-center gap-1.5">
                                                <BarChart2 size={14} className="text-muted-foreground" />
                                                <span className="font-extrabold text-[14px] text-[#2F3E46]">
                                                    {(link.click_count ?? 0).toLocaleString()}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    Clicks
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => deleteMutation.mutate(link.id)}
                                                disabled={deleteMutation.isPending}
                                                className="text-red-400 hover:text-rose p-2 transition-colors disabled:opacity-40"
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
