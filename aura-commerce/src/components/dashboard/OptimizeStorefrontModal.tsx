import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface Suggestion {
    type: string;
    title: string;
    description: string;
    actionText: string;
    actionLink: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export default function OptimizeStorefrontModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (open) {
            loadSuggestions();
        }
    }, [open]);

    const loadSuggestions = async () => {
        setIsLoading(true);
        try {
            const data = await fetchApi('/analytics/suggestions');
            setSuggestions(data);
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionClick = (link: string) => {
        onOpenChange(false);
        navigate(link);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-card/95 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[32px]">

                <div className="bg-gradient-to-br from-[#80DADA] to-[#FFD8B5] p-6 pb-8 relative">
                    <div className="absolute top-4 right-4 w-24 h-24 bg-card/20 blur-2xl rounded-full" />
                    <DialogHeader className="relative z-10 text-left">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-card/30 rounded-xl">
                                <Sparkles className="text-blush w-6 h-6" />
                            </div>
                            <DialogTitle className="text-2xl font-black text-[#2F3E46]">Optimize Your Store</DialogTitle>
                        </div>
                        <DialogDescription className="text-[#2F3E46]/80 font-medium">
                            Data-driven suggestions to boost your conversions and revenue.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 pt-4 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-8 h-8 rounded-full border-4 border-[#2F3E46]/20 border-t-[#2F3E46] animate-spin" />
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-[#80DADA]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-[#80DADA]" />
                            </div>
                            <h3 className="text-lg font-bold text-[#2F3E46] mb-2">Looking Good!</h3>
                            <p className="text-sm text-[#4D606B]">Your storefront is fully optimized. Keep driving traffic!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {suggestions.map((s, i) => (
                                <div key={i} className="group relative bg-[#F8F9FA] rounded-2xl p-5 border border-black/5 hover:bg-card hover:shadow-lg shadow-void/50 transition-all duration-300">
                                    <div className="flex gap-4">
                                        <div className="pt-1">
                                            {s.priority === 'HIGH' ? (
                                                <AlertCircle className="w-5 h-5 text-[#E5976D]" />
                                            ) : (
                                                <Sparkles className="w-5 h-5 text-[#80DADA]" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[#2F3E46] text-[15px] mb-1">{s.title}</h4>
                                            <p className="text-[13px] text-[#4D606B] leading-relaxed mb-3">
                                                {s.description}
                                            </p>
                                            <button
                                                onClick={() => handleActionClick(s.actionLink)}
                                                className="inline-flex items-center gap-2 text-[13px] font-bold text-[#80DADA] hover:text-[#6BC4C4] transition-colors"
                                            >
                                                {s.actionText}
                                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
