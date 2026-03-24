import { motion } from "framer-motion";
import { BookOpen, Palette, ShoppingBag, Settings, Link as LinkIcon, Users, ArrowRight } from "lucide-react";

export default function HelpTopicsPage() {
    const topics = [
        {
            title: "Getting Started",
            description: "Learn how to set up your ShopFluence profile and basic details.",
            icon: BookOpen,
            color: "bg-plum text-gold"
        },
        {
            title: "Store & Products",
            description: "How to find catalogs, add products, and manage your storefront.",
            icon: ShoppingBag,
            color: "bg-violet-100 text-violet-600"
        },
        {
            title: "Design & Appearance",
            description: "Customizing your theme, layout, backgrounds, and aesthetic.",
            icon: Palette,
            color: "bg-rose/15 text-rose"
        },
        {
            title: "Link Management",
            description: "Using the Link Shortener and managing your custom URLs.",
            icon: LinkIcon,
            color: "bg-gold/15 text-gold"
        },
        {
            title: "Audience & Analytics",
            description: "Understanding your clicks, unique visitors, and conversion metrics.",
            icon: Users,
            color: "bg-emerald-100 text-emerald-600"
        },
        {
            title: "Account Settings",
            description: "Managing payouts, profile, passwords, and security.",
            icon: Settings,
            color: "bg-muted text-blush"
        }
    ];

    return (
        <div className="max-w-[1000px] mx-auto pb-40">
            <div className="flex flex-col gap-2 mb-10">
                <h1 className="text-3xl font-extrabold text-[#2F3E46] tracking-tight">Help Center Topics</h1>
                <p className="text-muted-foreground text-[15px] font-medium">Browse our comprehensive guides and tutorials to master ShopFluence.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topics.map((topic, index) => {
                    const Icon = topic.icon;
                    return (
                        <motion.a
                            key={index}
                            href={`#${topic.title.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-card rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-border/40 p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all cursor-pointer group"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${topic.color}`}>
                                <Icon size={24} />
                            </div>
                            <h3 className="text-[17px] font-extrabold text-[#2F3E46] mb-2">{topic.title}</h3>
                            <p className="text-[14px] text-muted-foreground font-medium leading-relaxed">{topic.description}</p>

                            <div className="mt-6 flex items-center gap-2 text-violet-600 font-bold text-[13px] opacity-0 group-hover:opacity-100 transition-opacity">
                                Read Articles <ArrowRight size={14} />
                            </div>
                        </motion.a>
                    );
                })}
            </div>
        </div>
    );
}
