import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Layout, Zap, Shield, Globe, Users, ShoppingBag, BarChart3, Code2, HeartHandshake } from "lucide-react";
import { CTASection } from "../components/CTASection";

// Content map for all marketing pages
const pageContent: Record<string, any> = {
    products: {
        title: "Everything you need to sell online.",
        subtitle: "Turn your audience into customers with our all-in-one commerce platform for creators.",
        features: [
            { icon: ShoppingBag, title: "Digital Products", desc: "Sell ebooks, presets, and courses instantly." },
            { icon: BarChart3, title: "Advanced Analytics", desc: "Track every click, view, and sale in real-time." },
            { icon: Globe, title: "Custom Domains", desc: "Use your own domain for a professional look." }
        ],
        previewColor: "bg-blue-500/10",
        previewImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
    },
    templates: {
        title: "Start stunning. Finish faster.",
        subtitle: "Choose from dozens of premium, highly converting templates tailored for your niche.",
        features: [
            { icon: Layout, title: "One-Click Install", desc: "Apply any theme instantly with all settings prepopulated." },
            { icon: Zap, title: "Lightning Fast", desc: "Optimized for speed and mobile responsiveness out of the box." },
            { icon: Shield, title: "SEO Optimized", desc: "Built-in structured data and meta tags for search engines." }
        ],
        previewColor: "bg-purple-500/10",
        previewImage: "https://images.unsplash.com/photo-1542744094-24638ea0b35a?q=80&w=2070&auto=format&fit=crop"
    },
    marketplace: {
        title: "The Creator Ecosystem.",
        subtitle: "Discover plugins, brand deals, and collaborations in the ShopFluence marketplace.",
        features: [
            { icon: Users, title: "Brand Deals", desc: "Connect directly with brands looking for your audience." },
            { icon: Code2, title: "Plugins & Apps", desc: "Extend your store with powerful third-party tools." },
            { icon: HeartHandshake, title: "Collaborations", desc: "Partner with other creators to cross-sell products." }
        ],
        previewColor: "bg-emerald-500/10",
        previewImage: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop"
    },
    pricing: {
        title: "Simple, transparent pricing.",
        subtitle: "Start for free, upgrade when you need to. No hidden fees ever.",
        features: [
            { icon: Zap, title: "No monthly fees", desc: "Only pay a small transaction fee when you make a sale." },
            { icon: Globe, title: "Free hosting", desc: "We host your store for free, forever." },
            { icon: Shield, title: "Bank-grade security", desc: "Your money and data are completely protected." }
        ],
        previewColor: "bg-orange-500/10",
        previewImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop"
    },
    learn: {
        title: "Master the creator economy.",
        subtitle: "Guides, tutorials, and success stories to help you grow your business.",
        features: [
            { icon: Layout, title: "Video Tutorials", desc: "Step-by-step guides on setting up your store." },
            { icon: BarChart3, title: "Growth Guides", desc: "Actionable strategies to increase your sales." },
            { icon: Users, title: "Creator Stories", desc: "Learn from the top earners on ShopFluence." }
        ],
        previewColor: "bg-indigo-500/10",
        previewImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
    },
    about: {
        title: "Empowering creators globally.",
        subtitle: "We're on a mission to build the infrastructure for the next generation of digital entrepreneurs.",
        features: [
            { icon: Globe, title: "Global Reach", desc: "Supporting creators in over 150 countries." },
            { icon: Users, title: "Community First", desc: "Built by creators, for creators." },
            { icon: Zap, title: "Continuous Innovation", desc: "Constantly shipping new features to help you succeed." }
        ],
        previewColor: "bg-rose-500/10",
        previewImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
    },
    careers: {
        title: "Join our remote-first team.",
        subtitle: "Help us build the future of creator commerce. We're hiring across engineering, design, and marketing.",
        features: [
            { icon: HeartHandshake, title: "Remote Work", desc: "Work from anywhere in the world, on your own schedule." },
            { icon: Zap, title: "Great Benefits", desc: "Health insurance, learning stipends, and company retreats." },
            { icon: Users, title: "Amazing Team", desc: "Collaborate with top talent passionate about the creator economy." }
        ],
        previewColor: "bg-fuchsia-500/10",
        previewImage: "https://images.unsplash.com/photo-1593642532744-d377ab507dc8?q=80&w=2070&auto=format&fit=crop"
    },
    press: {
        title: "ShopFluence in the News.",
        subtitle: "Read the latest announcements, press releases, and media coverage.",
        features: [
            { icon: Layout, title: "Media Kit", desc: "Download high-res logos and product screenshots." },
            { icon: Globe, title: "Announcements", desc: "Our latest product drops and company updates." },
            { icon: Users, title: "Interviews", desc: "Hear from our founding team on the future of creator tools." }
        ],
        previewColor: "bg-slate-500/10",
        previewImage: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=2070&auto=format&fit=crop"
    },
    blog: {
        title: "Insights & Inspiration.",
        subtitle: "Stories, tips, and updates for creators building their empires.",
        features: [
            { icon: Code2, title: "Product Updates", desc: "Deep dives into out newest features." },
            { icon: ShoppingBag, title: "Ecommerce Tips", desc: "Strategies to optimize your storefront conversion." },
            { icon: BarChart3, title: "Creator Economy", desc: "Trends and analysis on the digital creator space." }
        ],
        previewColor: "bg-teal-500/10",
        previewImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop"
    },
    contact: {
        title: "We're here to help.",
        subtitle: "Get in touch with our team for support, partnerships, or general inquiries.",
        features: [
            { icon: Shield, title: "24/7 Support", desc: "Always online to assist you with your store." },
            { icon: HeartHandshake, title: "Partnerships", desc: "Let's work together to grow the creator ecosystem." },
            { icon: Globe, title: "Press Inquiries", desc: "Contact our PR team for media requests." }
        ],
        previewColor: "bg-sky-500/10",
        previewImage: "https://images.unsplash.com/photo-1516387938699-a93567ec168e?q=80&w=2070&auto=format&fit=crop"
    },
    features: {
        title: "Everything you need.",
        subtitle: "A comprehensive suite of tools designed to help creators sell more.",
        features: [
            { icon: ShoppingBag, title: "Unlimited Products", desc: "Sell as many digital items as you want." },
            { icon: Zap, title: "Lightning Fast Checkout", desc: "Frictionless payment processing." },
            { icon: BarChart3, title: "Real-time Metrics", desc: "Track conversions as they happen." }
        ],
        previewColor: "bg-cyan-500/10",
        previewImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
    },
    integrations: {
        title: "Connect your toolkit.",
        subtitle: "ShopFluence plays nice with all your favorite creator and marketing tools.",
        features: [
            { icon: Globe, title: "Email Marketing", desc: "Connect with Mailchimp, ConvertKit, and more." },
            { icon: Code2, title: "Webhooks", desc: "Build custom automations with Zapier and Make." },
            { icon: BarChart3, title: "Tracking", desc: "Seamless integration with Google Analytics & Meta Pixel." }
        ],
        previewColor: "bg-pink-500/10",
        previewImage: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop"
    },
    'help-center': {
        title: "ShopFluence Help Center.",
        subtitle: "Find answers, read articles, and master the platform.",
        features: [
            { icon: CheckCircle2, title: "Getting Started", desc: "Setup your store in under 5 minutes." },
            { icon: Layout, title: "Customization", desc: "Learn how to theme your storefront." },
            { icon: Users, title: "Audience Management", desc: "Manage your customers and email lists." }
        ],
        previewColor: "bg-emerald-500/10",
        previewImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop"
    },
    community: {
        title: "Join the creator community.",
        subtitle: "Connect, share, and learn with thousands of other creators.",
        features: [
            { icon: Users, title: "Discord Server", desc: "Join our active community chat." },
            { icon: Globe, title: "Live Events", desc: "Attend our virtual meetups and webinars." },
            { icon: CheckCircle2, title: "Expert Forums", desc: "Get advice from top sellers." }
        ],
        previewColor: "bg-yellow-500/10",
        previewImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
    },
    status: {
        title: "System Status.",
        subtitle: "Real-time updates on ShopFluence platform availability and performance.",
        features: [
            { icon: Zap, title: "100% Uptime", desc: "All systems are currently operational." },
            { icon: CheckCircle2, title: "API Status", desc: "Developer APIs are responding normally." },
            { icon: Globe, title: "Global CDN", desc: "Worldwide content delivery running smoothly." }
        ],
        previewColor: "bg-green-500/10",
        previewImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
    },
    'what\'s-new': {
        title: "What's new in ShopFluence.",
        subtitle: "The latest product updates, new features, and platform improvements.",
        features: [
            { icon: Zap, title: "Recent Updates", desc: "View the changelog for this month." },
            { icon: Layout, title: "Beta Features", desc: "Opt-in to test experimental tools." },
            { icon: CheckCircle2, title: "Roadmap", desc: "See what we're building next." }
        ],
        previewColor: "bg-blue-500/10",
        previewImage: "https://images.unsplash.com/photo-1542744094-24638ea0b35a?q=80&w=2070&auto=format&fit=crop"
    },
    developers: {
        title: "Build on ShopFluence.",
        subtitle: "Complete API references, SDKs, and developer documentation.",
        features: [
            { icon: Code2, title: "REST API", desc: "Programmatic access to stores and orders." },
            { icon: Layout, title: "Webhooks", desc: "Real-time event subscriptions." },
            { icon: Shield, title: "OAuth 2.0", desc: "Secure authentication for custom apps." }
        ],
        previewColor: "bg-indigo-500/10",
        previewImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
    },
    privacy: {
        title: "Privacy Policy.",
        subtitle: "How we collect, use, and protect your personal information.",
        features: [
            { icon: Shield, title: "Data Protection", desc: "We use industry-standard encryption." },
            { icon: Globe, title: "Transparency", desc: "Clear explanations of data usage." },
            { icon: Users, title: "Your Rights", desc: "Tools to export or delete your data." }
        ],
        previewColor: "bg-slate-500/10",
        previewImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop"
    },
    terms: {
        title: "Terms of Service.",
        subtitle: "The rules, guidelines, and agreements for using ShopFluence.",
        features: [
            { icon: Shield, title: "User Agreement", desc: "Standard terms for platform use." },
            { icon: ShoppingBag, title: "Seller Terms", desc: "Rules for processing transactions." },
            { icon: CheckCircle2, title: "Acceptable Use", desc: "Guidelines for appropriate content." }
        ],
        previewColor: "bg-gray-500/10",
        previewImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop"
    },
    cookies: {
        title: "Cookie Policy.",
        subtitle: "Information about how we use cookies and tracking technologies.",
        features: [
            { icon: Shield, title: "Essential Cookies", desc: "Required for core site functionality." },
            { icon: BarChart3, title: "Analytics", desc: "Used to understand anonymous usage." },
            { icon: Layout, title: "Preferences", desc: "Manage your cookie settings anytime." }
        ],
        previewColor: "bg-amber-500/10",
        previewImage: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=2070&auto=format&fit=crop"
    },
    gdpr: {
        title: "GDPR Compliance.",
        subtitle: "Our commitment to European data protection standards and rights.",
        features: [
            { icon: Shield, title: "Data Security", desc: "Rigorous standards for personal data." },
            { icon: Users, title: "User Rights", desc: "Easy access to DSR (Data Subject Requests)." },
            { icon: Globe, title: "EU Processing", desc: "Compliant data transfers and processing." }
        ],
        previewColor: "bg-stone-500/10",
        previewImage: "https://images.unsplash.com/photo-1516387938699-a93567ec168e?q=80&w=2070&auto=format&fit=crop"
    },
    // Default fallback for other links like terms, privacy, etc.
    default: {
        title: "Page coming soon.",
        subtitle: "We're actively working on this section of the website.",
        features: [
            { icon: Shield, title: "Stay Tuned", desc: "Check back later for updates." }
        ],
        previewColor: "bg-gray-500/10",
        previewImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop"
    }
};

export default function MarketingPage() {
    const location = useLocation();
    const page = location.pathname.split("/").pop(); // Get last part of path

    // Try to find the page content, map complex URLs to their base, or use generic fallback
    const contentKey = page ? page.toLowerCase() : 'default';
    const content = pageContent[contentKey] || {
        ...pageContent['default'],
        title: `${page?.charAt(0).toUpperCase()}${page?.slice(1)}`
    };

    return (
        <div className="min-h-screen bg-background pt-32 pb-0 overflow-hidden">
            {/* Hero Section */}
            <section className="relative px-6 w-full max-w-7xl mx-auto mb-24">
                <motion.div
                    className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none"
                    style={{ backgroundColor: content.previewColor?.split('-')[1] ? `var(--${content.previewColor?.split('-')[1]})` : 'var(--primary)' }}
                />

                <div className="text-center max-w-4xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
                            {content.title}
                        </h1>
                        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                            {content.subtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/auth" className="flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity w-full sm:w-auto text-center justify-center">
                                Get started free <ArrowRight size={20} />
                            </Link>
                            <Link to="/contact" className="px-8 py-4 rounded-full border border-border text-foreground font-bold text-lg hover:bg-muted transition-colors w-full sm:w-auto text-center justify-center">
                                Contact sales
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Hero Preview Image / Mockup */}
            <motion.section
                className="px-6 w-full max-w-6xl mx-auto mb-32"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className={`w-full rounded-2xl md:rounded-[40px] p-2 md:p-4 border border-border/50 shadow-2xl ${content.previewColor} backdrop-blur-sm`}>
                    <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-xl md:rounded-[32px] overflow-hidden relative bg-card shadow-inner border border-border/20">
                        <img src={content.previewImage} alt={content.title} className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                </div>
            </motion.section>

            {/* Feature Grid */}
            <section className="px-6 w-full max-w-7xl mx-auto mb-32">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold text-foreground">Why choose ShopFluence?</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {content.features.map((feature: any, i: number) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5 }}
                            className="bg-card p-8 rounded-3xl border border-border/60 shadow-sm hover:shadow-xl transition-all"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6`}>
                                <feature.icon size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            <CTASection />

        </div>
    );
}
