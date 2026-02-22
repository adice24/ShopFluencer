import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
import { useSetupChecklist } from "../../../hooks/useSetupChecklist";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SetupChecklistModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SetupChecklistModal({ open, onOpenChange }: SetupChecklistModalProps) {
    const { steps, totalSteps } = useSetupChecklist();
    const [expandedStep, setExpandedStep] = useState<number | null>(null);
    const [optimisticComplete, setOptimisticComplete] = useState<Set<number>>(new Set());
    const navigate = useNavigate();

    // Map server steps to our items
    const baseItems = useMemo(() => [
        {
            id: 1,
            title: "Add your name and bio",
            desc: "This will be the first thing visitors see when they land on your Linktree.",
            cta: "Add name and bio",
            link: "/dashboard/appearance",
            serverComplete: steps.hasNameAndBio,
        },
        {
            id: 2,
            title: "Add your profile image",
            desc: "Make your profile recognizable by adding a photo.",
            cta: "Add profile image",
            link: "/dashboard/appearance",
            serverComplete: steps.hasAvatar,
        },
        {
            id: 3,
            title: "Add your socials",
            desc: "Connect your audience to your other platforms.",
            cta: "Add socials",
            link: "/dashboard/appearance",
            serverComplete: steps.hasSocials,
        },
        {
            id: 4,
            title: "Add your other important links",
            desc: "Share your latest content, products, or campaigns.",
            cta: "Add links",
            link: "/dashboard/links",
            serverComplete: steps.hasLinks,
        },
        {
            id: 5,
            title: "Customize your design",
            desc: "Make your page match your unique brand.",
            cta: "Customize design",
            link: "/dashboard/appearance",
            serverComplete: steps.hasCustomDesign,
        },
        {
            id: 6,
            title: "Share your Linktree",
            desc: "Start driving traffic to your new page!",
            cta: "ShareLink",
            link: "#",
            serverComplete: steps.hasShared,
            onClick: () => {
                const userId = localStorage.getItem("shopfluence_role");
                toast.success("Link copied!");
                if (typeof window !== 'undefined' && userId) {
                    localStorage.setItem(`shared_dummy`, 'true');
                }
            }
        }
    ], [steps]);

    const checklistItems = useMemo(() => {
        return baseItems.map(item => ({
            ...item,
            isComplete: item.serverComplete || optimisticComplete.has(item.id)
        }));
    }, [baseItems, optimisticComplete]);

    const completedCount = checklistItems.filter(i => i.isComplete).length;
    const percentage = Math.round((completedCount / totalSteps) * 100) || 0;

    // Auto-expand first incomplete on open
    useEffect(() => {
        if (open) {
            const firstIncomplete = checklistItems.find(item => !item.isComplete);
            setExpandedStep(firstIncomplete ? firstIncomplete.id : null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // When an item completes, automatically expand the next incomplete step after a short delay
    const handleComplete = (id: number) => {
        setOptimisticComplete(prev => new Set(prev).add(id));
        setTimeout(() => {
            const nextIncomplete = checklistItems.find(item => item.id > id && !item.isComplete);
            if (nextIncomplete) {
                setExpandedStep(nextIncomplete.id);
            } else {
                const anyIncomplete = checklistItems.find(item => !item.isComplete);
                setExpandedStep(anyIncomplete ? anyIncomplete.id : null);
            }
        }, 600); // 600ms delay to allow checkmark animation
    };

    const handleSkip = (id: number) => {
        // Just move to the next incomplete one
        const nextIncomplete = checklistItems.find(item => item.id > id && !item.isComplete);
        if (nextIncomplete) {
            setExpandedStep(nextIncomplete.id);
        } else {
            const anyIncomplete = checklistItems.find(item => item.id !== id && !item.isComplete);
            setExpandedStep(anyIncomplete ? anyIncomplete.id : null);
        }
    };

    const handleToggle = (id: number) => {
        setExpandedStep(expandedStep === id ? null : id);
    };

    const modalContent = (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-[#000000]/40 backdrop-blur-[2px]"
                        onClick={() => onOpenChange(false)}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                            mass: 0.8
                        }}
                        className="w-full max-w-[425px] bg-white rounded-[24px] shadow-2xl overflow-hidden relative z-10"
                    >
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700 z-10"
                        >
                            <X size={16} />
                        </button>

                        <div className="p-6 md:p-8 pb-2">
                            <div className="flex items-center gap-4 mb-4">
                                <h2 className="text-[20px] font-bold text-[#111827]">Your setup checklist</h2>
                                <div className="bg-[#8B5CF6] text-white text-[13px] font-bold px-3 py-0.5 rounded-full flex items-center transition-all duration-300">
                                    {completedCount}/{totalSteps}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-[10px] bg-gray-100 rounded-full mb-2 overflow-hidden">
                                <motion.div
                                    className="h-full bg-[#8B5CF6] rounded-full origin-left"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col max-h-[60vh] overflow-y-auto px-6 md:px-8 pb-8 custom-scrollbar">
                            {checklistItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`py-4 ${index !== checklistItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                                >
                                    <div
                                        className="flex items-center justify-between cursor-pointer group"
                                        onClick={() => handleToggle(item.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <motion.div
                                                className={`w-[26px] h-[26px] rounded-full border-[2px] shrink-0 flex items-center justify-center transition-colors duration-300 ${item.isComplete ? 'bg-[#10B981] border-[#10B981]' : 'border-gray-200 group-hover:border-gray-300'}`}
                                            >
                                                <AnimatePresence>
                                                    {item.isComplete && (
                                                        <motion.div
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                        >
                                                            <Check size={16} strokeWidth={3} className="text-white" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                            <span className={`text-[15px] font-medium transition-colors duration-300 ${item.isComplete ? 'text-gray-400 line-through' : 'text-[#111827]'}`}>
                                                {item.title}
                                            </span>
                                        </div>
                                        <div className={`text-gray-400 transition-transform duration-300 ${expandedStep === item.id ? 'rotate-180' : ''}`}>
                                            <ChevronDown size={20} />
                                        </div>
                                    </div>

                                    <AnimatePresence initial={false}>
                                        {expandedStep === item.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pl-[42px] pt-3 pb-2 text-[14px] text-gray-500">
                                                    <p className="mb-5 leading-relaxed">{item.desc}</p>
                                                    <div className="flex items-center gap-4">
                                                        {item.link === "#" ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    item.onClick?.();
                                                                    handleComplete(item.id);
                                                                }}
                                                                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold py-2.5 px-6 rounded-full transition-colors text-[14px]"
                                                            >
                                                                {item.cta}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(item.link);
                                                                    onOpenChange(false);
                                                                }}
                                                                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold py-2.5 px-6 rounded-full transition-colors text-[14px]"
                                                            >
                                                                {item.cta}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSkip(item.id);
                                                            }}
                                                            className="text-[#111827] font-semibold text-[14px] hover:underline transition-all"
                                                        >
                                                            Skip
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
}
