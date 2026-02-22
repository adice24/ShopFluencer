import { motion } from "framer-motion";
import { HelpCircle, ChevronDown, MessageCircle } from "lucide-react";
import { useState } from "react";

const faqs = [
    {
        question: "How do I add products to my storefront?",
        answer: "Navigate to the Shop page from your dashboard menu. From there, you can browse available catalog products and click 'Add to Store' to place them directly on your storefront."
    },
    {
        question: "When and how do I get paid?",
        answer: "Payouts are processed automatically at the end of every month for transactions that have cleared the return window. Ensure your banking information is up-to-date in the Settings > Billing tab."
    },
    {
        question: "Can I use my own custom domain?",
        answer: "Yes, users on our upgraded plans can connect their own custom domains. Go to the Link Shortener or Appearance settings to configure your DNS settings."
    },
    {
        question: "How do the affiliate commissions work?",
        answer: "Every time a user clicks a product link from your storefront and completes a purchase, our tracking cookies attribute that sale to your account. You will receive the designated commission percentage for that product."
    },
    {
        question: "How can I customize the look of my Linktree?",
        answer: "Head over to the Design page. You can customize your theme colors, button styles, background, typography, and even toggle between mobile and desktop preview modes."
    }
];

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="max-w-[800px] mx-auto pb-40">
            <div className="flex flex-col gap-2 mb-10">
                <h1 className="text-3xl font-extrabold text-[#2F3E46] tracking-tight">Frequently Asked Questions</h1>
                <p className="text-muted-foreground text-[15px] font-medium">Find answers to the most common questions about setting up and using ShopFluence.</p>
            </div>

            <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-border/40 p-2">
                {faqs.map((faq, index) => (
                    <div key={index} className="border-b border-border/40 last:border-0">
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full text-left py-5 px-6 flex items-center justify-between hover:bg-black/5 transition-colors rounded-xl outline-none"
                        >
                            <h3 className="font-bold text-[15px] text-[#2F3E46]">{faq.question}</h3>
                            <ChevronDown
                                size={18}
                                className={`text-muted-foreground transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""}`}
                            />
                        </button>
                        <motion.div
                            initial={false}
                            animate={{ height: openIndex === index ? "auto" : 0, opacity: openIndex === index ? 1 : 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pb-6 px-6 text-[14.5px] text-muted-foreground font-medium leading-relaxed">
                                {faq.answer}
                            </div>
                        </motion.div>
                    </div>
                ))}
            </div>

            <div className="mt-12 bg-gradient-to-br from-violet-50 to-pink-50 rounded-[24px] p-8 border border-violet-100 flex items-center justify-between">
                <div>
                    <h3 className="text-[18px] font-extrabold text-[#2F3E46] mb-2 flex items-center gap-2">
                        <HelpCircle size={20} className="text-violet-500" />
                        Still have questions?
                    </h3>
                    <p className="text-[14px] text-muted-foreground font-medium">If you couldn't find the answer you were looking for, our support team is happy to help.</p>
                </div>
                <a
                    href="mailto:support@shopfluence.com"
                    className="bg-white hover:bg-black/5 text-[#2F3E46] font-bold py-3 px-6 rounded-full shadow-sm transition-colors border border-border/50 flex items-center gap-2 shrink-0"
                >
                    <MessageCircle size={18} />
                    Contact Support
                </a>
            </div>
        </div>
    );
}
