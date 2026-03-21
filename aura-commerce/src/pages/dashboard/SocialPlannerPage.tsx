import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";

const fadeUp = (i: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.08 },
});

export default function SocialPlannerPage() {
    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <motion.div {...fadeUp(0)}>
                <h1 className="text-3xl font-extrabold text-[#2F3E46] mb-2">Social Planner</h1>
                <p className="text-[#4D606B]">
                    Schedule and manage your social media posts to grow your audience.
                </p>
            </motion.div>

            <motion.div {...fadeUp(1)} className="bg-card/80 backdrop-blur-md border border-white rounded-[24px] p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="mx-auto w-16 h-16 bg-[#D67151]/10 text-[#D67151] rounded-full flex items-center justify-center mb-6">
                    <CalendarDays size={32} />
                </div>
                <h2 className="text-2xl font-bold text-[#2F3E46] mb-4">Coming Soon</h2>
                <p className="text-[#4D606B] max-w-md mx-auto mb-8">
                    We're building an intelligent social planner to help you auto-post products, reels, and stories directly to your linked accounts.
                </p>
                <button className="px-6 py-3 bg-[#D67151] text-blush font-bold rounded-full hover:bg-[#c46142] transition-colors">
                    Notify Me When Live
                </button>
            </motion.div>
        </div>
    );
}
