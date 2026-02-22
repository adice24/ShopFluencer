import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Hourglass, Rocket, Smile, Sparkle, Loader2, ChevronDown, Check, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { fetchApi } from "../../lib/api";
import { toast } from "sonner";
import clsx from "clsx";

const fadeUp = (i: number) => ({
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.05 },
});

export default function PostIdeasPage() {
    const [selectedType, setSelectedType] = useState("Trending");
    const [interestArea, setInterestArea] = useState("");
    const [platform, setPlatform] = useState("Instagram");
    const [isGenerating, setIsGenerating] = useState(false);
    const [ideas, setIdeas] = useState<any[]>([]);
    const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    const contentTypes = [
        { id: "Trending", label: "Trending", icon: Flame, text: "Generate ideas that will create buzz around trending topics." },
        { id: "Evergreen", label: "Evergreen", icon: Hourglass, text: "Ideas that remain relevant long after they're published." },
        { id: "Video hooks", label: "Video hooks", icon: Rocket, text: "Scroll-stopping hooks to capture attention instantly." },
        { id: "Got something in mind?", label: "Got something in mind?", icon: Sparkle, text: "Give us a direction, and we'll refine it into amazing ideas." },
        { id: "Surprise me", label: "Surprise me", icon: Smile, text: "Get unexpected, creative ideas tailored to your niche." },
    ];

    const platforms = ["Instagram", "TikTok", "YouTube", "Affiliate Promotion", "Product Launch"];

    const activeTypeData = contentTypes.find(c => c.id === selectedType);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await fetchApi('/content-ideas');
            if (data && Array.isArray(data)) {
                setHistory(data);
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    const handleGenerate = async () => {
        if (!interestArea) {
            toast.error("Please enter an interest area or niche.");
            return;
        }

        setIsGenerating(true);
        setIdeas([]);
        setSelectedIdeaIndex(null);
        try {
            const data = await fetchApi('/content-ideas/generate', {
                method: 'POST',
                body: JSON.stringify({
                    niche: `${interestArea} (${selectedType})`,
                    platform: platform
                })
            });

            if (data && data.length > 0) {
                setIdeas(data);
                toast.success("Generated amazing ideas for you!");
                loadHistory(); // optional: load history immediately
            } else {
                toast.error("Failed to generate ideas. Please try again.");
            }
        } catch (e: any) {
            toast.error(e.message || "Something went wrong.");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (idea: any) => {
        const content = `${idea.title}\n\nHook: ${idea.hook}\n\nCall To Action: ${idea.cta}\n\nHashtags: ${(idea.hashtags || []).join(' ')}`;
        navigator.clipboard.writeText(content);
        toast.success("Idea copied to clipboard!");
    };

    return (
        <div className="max-w-[900px] mx-auto space-y-8 pb-32">
            <motion.div {...fadeUp(0)}>
                <h1 className="text-[28px] font-extrabold text-[#2F3E46] mb-8">Point us in the right direction and we'll give you ideas</h1>

                {/* Configuration Card */}
                <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-border">
                    {/* Top Pills */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {contentTypes.map((type) => {
                            const Icon = type.icon;
                            const isActive = selectedType === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={clsx(
                                        "px-5 py-2.5 rounded-full flex items-center gap-2 text-[14px] font-bold transition-all",
                                        isActive
                                            ? "bg-[#1C1F1E] text-white shadow-md shadow-black/10"
                                            : "bg-white border border-[#EBEBEB] text-[#4d606B] hover:bg-black/5"
                                    )}
                                >
                                    <Icon size={16} className={isActive ? (type.id === "Trending" ? "text-red-400" : type.id === "Evergreen" ? "text-amber-400" : type.id === "Video hooks" ? "text-orange-400" : "text-sky-400") : "text-muted-foreground"} />
                                    {type.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Gradient Info Banner */}
                    <div className="w-full bg-gradient-to-r from-[#F2EDFF] via-[#F8EDF5] to-[#E9F3FC] rounded-2xl p-6 mb-6 flex items-center justify-between border border-[#E9E4FC]">
                        <div className="flex items-center gap-4">
                            <Sparkle className="text-[#966AF6] fill-[#966AF6] opacity-70" size={24} />
                            <p className="text-[16px] text-[#2F3E46] font-medium max-w-[400px]">
                                {activeTypeData?.text}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="E.g., 3D Architecture, Fitness, Tech Setup..."
                                value={interestArea}
                                onChange={(e) => setInterestArea(e.target.value)}
                                className="w-full h-12 bg-white border border-[#EBEBEB] rounded-xl px-4 text-[15px] font-medium text-[#2F3E46] focus:border-black/20 focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="w-full h-12 bg-white border border-[#EBEBEB] rounded-xl px-4 text-[15px] font-medium text-[#2F3E46] appearance-none focus:border-black/20 focus:outline-none focus:ring-4 focus:ring-black/5 transition-all cursor-pointer"
                            >
                                {platforms.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !interestArea}
                            className="bg-[#1C1F1E] disabled:bg-[#1C1F1E]/50 text-white font-bold h-12 px-8 rounded-full flex items-center gap-2 hover:bg-[#2F3E46] transition-all shadow-md shadow-black/10"
                        >
                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkle size={18} />}
                            Generate Ideas
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Results Section */}
            {(isGenerating || ideas.length > 0) && (
                <motion.div {...fadeUp(1)} className="pt-8 border-t border-border mt-12">
                    <h2 className="text-[24px] font-extrabold text-[#2F3E46] mb-6">Post ideas</h2>
                    <p className="text-[#4D606B] font-medium mb-6">Choose your favorite!</p>

                    {isGenerating ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="min-h-[160px] animate-pulse bg-black/5 rounded-2xl border border-black/5"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AnimatePresence>
                                {ideas.map((idea, index) => {
                                    const isSelected = selectedIdeaIndex === index;
                                    return (
                                        <motion.div
                                            key={idea.id || index}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            onClick={() => setSelectedIdeaIndex(index)}
                                            className={clsx(
                                                "p-6 rounded-2xl cursor-pointer transition-all border-2 relative h-full flex flex-col justify-between",
                                                isSelected
                                                    ? "bg-white border-[#1C1F1E] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
                                                    : "bg-white border-[#EBEBEB] hover:border-[#1C1F1E]/30 text-[#4D606B]/90"
                                            )}
                                        >
                                            {isSelected && (
                                                <div className="absolute -top-3 -right-3 w-7 h-7 bg-[#1C1F1E] rounded-full flex items-center justify-center text-white border-4 border-white">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                            )}

                                            <div>
                                                <div className="text-[12px] uppercase font-bold text-muted-foreground/70 tracking-wider mb-2">Idea #{index + 1}</div>
                                                <h3 className={clsx("text-[17px] font-extrabold mb-3 line-clamp-2", isSelected ? "text-[#2F3E46]" : "text-[#2F3E46]")}>
                                                    {idea.title}
                                                </h3>
                                                <p className="text-[14px] leading-relaxed mb-4 text-[#4D606B]">
                                                    {idea.hook}
                                                </p>
                                                {isSelected && (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 pt-4 border-t border-[#EBEBEB]">
                                                        <div className="text-[13px] font-bold text-[#2F3E46] mb-1">Call to Action:</div>
                                                        <p className="text-[13px] text-[#4D606B] mb-3">{idea.cta}</p>
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {idea.hashtags?.map((tag: string) => (
                                                                <span key={tag} className="text-[11px] font-bold text-[#966AF6] bg-[#966AF6]/10 px-2 py-0.5 rounded flex items-center">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 justify-end mt-4">
                                                {isSelected && (
                                                    <button onClick={(e) => { e.stopPropagation(); copyToClipboard(idea); }} className="p-2 hover:bg-black/5 rounded-full text-muted-foreground group mr-auto transition-colors">
                                                        <Copy size={16} className="group-hover:text-[#2F3E46]" />
                                                    </button>
                                                )}
                                                <button className="p-2 hover:bg-black/5 rounded-full text-muted-foreground group transition-colors">
                                                    <ThumbsUp size={16} className="group-hover:text-[#2F3E46]" />
                                                </button>
                                                <button className="p-2 hover:bg-black/5 rounded-full text-muted-foreground group transition-colors">
                                                    <ThumbsDown size={16} className="group-hover:text-[#2F3E46]" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Bottom Sticky CTA if selected */}
            <AnimatePresence>
                {!isGenerating && ideas.length > 0 && selectedIdeaIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-0 left-0 right-0 bg-[#F4F4F3] border-t border-[#EBEBEB] p-4 flex items-center justify-between z-50 md:pl-[280px]"
                    >
                        <div className="max-w-[900px] w-full mx-auto flex items-center justify-between px-6">
                            <span className="text-[14px] font-medium text-muted-foreground">Choose idea &middot; Step 2 of 3</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleGenerate()}
                                    className="bg-white border border-[#EBEBEB] text-[#1C1F1E] font-bold h-11 px-6 rounded-full flex items-center gap-2 hover:bg-black/5 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
                                >
                                    Regenerate ideas
                                </button>
                                <button className="bg-[#1C1F1E] text-white font-bold h-11 px-8 rounded-full flex items-center gap-2 hover:bg-[#2F3E46] transition-all shadow-md shadow-black/10">
                                    Get captions &rarr;
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
