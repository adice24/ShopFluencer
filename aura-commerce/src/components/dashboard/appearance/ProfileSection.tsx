import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useMyStore } from "../../../hooks/useInfluencerStore";
import { Loader2, Camera, Instagram, Twitter, Youtube, Link as LinkIcon, Facebook, Twitch } from "lucide-react";
import { toast } from "sonner";

export default function ProfileSection() {
    const { user } = useAuth();
    const { store, updateStore, createStore } = useMyStore();
    const queryClient = useQueryClient();

    // Fetch Profile for Name
    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ["profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    const updateProfile = useMutation({
        mutationFn: async (updates: { full_name?: string; avatar_url?: string; }) => {
            if (!user) throw new Error("No user");
            const { data, error } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", user.id)
                .select();
            if (error) throw error;
            if (!data || data.length === 0) {
                // Upsert if not found (onConflict avoids 409 when row exists or unique clash)
                const { data: upsertData, error: upsertError } = await supabase
                    .from("profiles")
                    .upsert(
                        { id: user.id, email: user.email ?? "", ...updates },
                        { onConflict: "id" }
                    )
                    .select();
                if (upsertError) throw upsertError;
                return upsertData?.[0];
            }
            return data[0];
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["profile", user?.id], data);
        },
    });

    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [avatarInput, setAvatarInput] = useState("");
    const [socials, setSocials] = useState<Record<string, string>>({
        instagram: "",
        twitter: "",
        youtube: "",
        tiktok: "",
        facebook: "",
        twitch: ""
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.full_name || "");
            setAvatarInput(profile.avatar_url || store?.avatar_url || "");
        }
        if (store) {
            setBio(store.bio || "");
            if (store.social_links) {
                setSocials(prev => ({ ...prev, ...(store.social_links as Record<string, string>) }));
            }
        }
    }, [profile, store]);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await updateProfile.mutateAsync({ full_name: name, avatar_url: avatarInput });

            const storeData = { bio, avatar_url: avatarInput, social_links: socials };

            if (store) {
                await updateStore.mutateAsync(storeData);
            } else {
                const rawName = name || user?.user_metadata?.username || user?.email?.split('@')[0] || "user";
                const genericSlug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(Math.random() * 10000);
                await createStore.mutateAsync({
                    slug: genericSlug,
                    title: rawName,
                    ...storeData,
                });
            }

            toast.success("Profile saved!");
        } catch (error: unknown) {
            console.error("Save profile error:", error);
            const errorMessage = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
            toast.error(`Failed to save: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSocialChange = (platform: string, value: string) => {
        setSocials(prev => ({ ...prev, [platform]: value }));
    };

    if (isProfileLoading) {
        return (
            <div className="flex items-center justify-center p-8 bg-card rounded-[24px] border border-border/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-8">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    return (
        <section className="space-y-6 mb-8">
            <h2 className="text-[22px] font-bold text-foreground pl-1">Profile & Socials</h2>

            {/* Profile Information Block */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/60 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">

                {/* Avatar Section */}
                <div className="flex items-start gap-6">
                    <div className="relative group">
                        <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-muted border border-blush/12 shadow-sm shrink-0">
                            {avatarInput ? (
                                <img src={avatarInput} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-[#99D8D0] to-[#FFD8B5] text-blush flex items-center justify-center text-3xl font-bold uppercase">
                                    {(name || "U").charAt(0)}
                                </div>
                            )}
                        </div>
                        {/* Avatar Image URL Input (Since linking requires real uploads, doing simple URL for now) */}
                    </div>
                    <div className="flex-1 space-y-2 pt-2">
                        <label className="text-[13px] font-bold text-foreground/70">Profile Image URL</label>
                        <input
                            type="text"
                            value={avatarInput}
                            onChange={(e) => setAvatarInput(e.target.value)}
                            placeholder="https://example.com/your-image.jpg"
                            className="w-full px-4 py-3 bg-[#FAFAFA] border border-border/60 text-[14px] font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 focus:border-[#8B5CF6]/50"
                        />
                        <p className="text-[12px] text-muted-foreground mt-1">Paste an image URL to update your avatar.</p>
                    </div>
                </div>

                {/* Name & Bio */}
                <div className="space-y-4 pt-4 border-t border-blush/08">
                    <div>
                        <label className="text-[13px] font-bold text-foreground/70 mb-2 block">Profile Title (Name)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-[#FAFAFA] border border-border/60 text-[14px] font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 focus:border-[#8B5CF6]/50"
                            placeholder="Your Name or Brand"
                        />
                    </div>
                    <div>
                        <label className="text-[13px] font-bold text-foreground/70 mb-2 block">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full px-4 py-3 bg-[#FAFAFA] border border-border/60 text-[14px] font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 focus:border-[#8B5CF6]/50 min-h-[100px] resize-y"
                            placeholder="A quick bio about yourself to welcome your visitors..."
                            maxLength={80}
                        />
                        <p className="text-[12px] text-right text-muted-foreground mt-1 font-medium">{bio.length} / 80</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-blush/08">
                    <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-blush font-bold py-3 px-8 rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 w-full sm:w-auto"
                    >
                        {isSaving && <Loader2 size={16} className="animate-spin" />}
                        Save profile
                    </button>
                </div>
            </motion.div>

            {/* Socials Block */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border/60 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                <h3 className="font-semibold text-foreground mb-6">Social Icons</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose/15 flex items-center justify-center shrink-0">
                                <Instagram size={18} className="text-rose" />
                            </div>
                            <input type="text" value={socials.instagram} onChange={(e) => handleSocialChange("instagram", e.target.value)} placeholder="Instagram Username or URL" className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-border/60 text-[14px] font-medium rounded-xl" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-plum flex items-center justify-center shrink-0">
                                <Twitter size={18} className="text-gold" />
                            </div>
                            <input type="text" value={socials.twitter} onChange={(e) => handleSocialChange("twitter", e.target.value)} placeholder="Twitter / X Handle" className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-border/60 text-[14px] font-medium rounded-xl" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose/15 flex items-center justify-center shrink-0">
                                <Youtube size={18} className="text-rose" />
                            </div>
                            <input type="text" value={socials.youtube} onChange={(e) => handleSocialChange("youtube", e.target.value)} placeholder="YouTube Channel URL" className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-border/60 text-[14px] font-medium rounded-xl" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 013.183-4.51v-3.5a6.329 6.329 0 00-5.394 10.692 6.33 6.33 0 0010.857-4.424V8.687a8.182 8.182 0 004.773 1.526V6.79a4.831 4.831 0 01-1.003-.104z" />
                                </svg>
                            </div>
                            <input type="text" value={socials.tiktok} onChange={(e) => handleSocialChange("tiktok", e.target.value)} placeholder="TikTok Username" className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-border/60 text-[14px] font-medium rounded-xl" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center shrink-0">
                                <Facebook size={18} className="text-blush" />
                            </div>
                            <input type="text" value={socials.facebook} onChange={(e) => handleSocialChange("facebook", e.target.value)} placeholder="Facebook Page URL" className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-border/60 text-[14px] font-medium rounded-xl" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-plum flex items-center justify-center shrink-0">
                                <Twitch size={18} className="text-blush" />
                            </div>
                            <input type="text" value={socials.twitch} onChange={(e) => handleSocialChange("twitch", e.target.value)} placeholder="Twitch Channel" className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-border/60 text-[14px] font-medium rounded-xl" />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end pb-2 pt-4">
                    <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-blush font-bold py-3 px-8 rounded-full transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {isSaving && <Loader2 size={16} className="animate-spin" />}
                        Save Profile & Socials
                    </button>
                </div>
            </motion.div>
        </section>
    );
}
