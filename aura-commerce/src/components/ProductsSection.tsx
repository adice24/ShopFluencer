import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Link, BarChart3, ShoppingCart, QrCode, Palette, Globe } from "lucide-react";

const tools = [
  {
    icon: Link,
    title: "Link in bio",
    description: "One link to share all your content, social profiles, and more.",
    color: "bg-lime-100 text-lime-700",
  },
  {
    icon: ShoppingCart,
    title: "Commerce",
    description: "Sell products, collect payments, and manage orders seamlessly.",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track clicks, views, and revenue with real-time dashboards.",
    color: "bg-purple-100 text-purple-700",
  },
  {
    icon: QrCode,
    title: "QR codes",
    description: "Bridge offline and online with custom branded QR codes.",
    color: "bg-orange-100 text-orange-700",
  },
  {
    icon: Palette,
    title: "Themes",
    description: "Choose from hundreds of themes or build your own custom look.",
    color: "bg-pink-100 text-pink-700",
  },
  {
    icon: Globe,
    title: "Social commerce",
    description: "Turn followers into customers with integrated storefronts.",
    color: "bg-emerald-100 text-emerald-700",
  },
];

export const ProductsSection = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section id="products" className="py-24 bg-card">
      <div className="max-w-6xl mx-auto px-6">
        <div ref={headerRef} className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="font-bold text-foreground tracking-tight mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Everything you need to grow
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-lg mx-auto"
          >
            Tools designed for creators, brands, and everyone in between.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              className="bg-background rounded-3xl p-6 border border-border hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-2xl ${tool.color} flex items-center justify-center mb-4`}>
                <tool.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{tool.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{tool.description}</p>
              <span className="text-sm font-medium text-foreground flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
