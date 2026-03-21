import { useRef, lazy, Suspense } from "react";
import { motion, useInView, useSpring, useMotionValue, useTransform } from "framer-motion";
import { TiltedCard } from "./TiltedCard";
import { ArrowRight } from "lucide-react";
import gymProduct from "@/assets/gym-product.jpg";
import shoppingProduct from "@/assets/shopping-product.jpg";
import beautyProduct from "@/assets/beauty-product.jpg";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import { InfiniteMenu } from "./InfiniteMenu";
import { CreativeGalleryLoop } from "./CreativeGalleryLoop";

const Lanyard = lazy(() => import("./Lanyard"));

/* ─── Anti-Gravity Analytics Chart ─────────────────────────────── */
const AnalyticsFloatingCard = ({ inView }: { inView: boolean }) => {
  /* Spring-based mouse-tilt for the whole card group */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    stiffness: 160, damping: 28,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 160, damping: 28,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* ── Blurred radial glow behind chart (depth illusion) ── */}
      <motion.div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.3 }}
      >
        <div
          style={{
            width: "220px",
            height: "120px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(237,158,89,0.45) 0%, rgba(237,158,89,0.18) 50%, transparent 75%)",
            filter: "blur(28px)",
            willChange: "transform, opacity",
          }}
        />
      </motion.div>

      {/* ── Infinite float wrapper ── */}
      <motion.div
        animate={inView ? { y: [0, -12, 0] } : { y: 0 }}
        transition={{
          duration: 7,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
        style={{ willChange: "transform" }}
      >
        {/* ── 3D tilt + hover micro-enhancement wrapper ── */}
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            perspective: "800px",
            rotateX,
            rotateY,
            willChange: "transform",
          }}
          whileHover={{ scale: 1.5, filter: "brightness(1.1)" }}
          transition={{
            scale: { duration: 0.3, ease: "easeOut" },
            filter: { duration: 0.3, ease: "easeOut" }
          }}
        >
          {/* ── Frosted container card ── */}
          <motion.div
            style={{
              background: "rgba(233,188,185,0.06)",
              backdropFilter: "blur(12px)",
              borderRadius: "20px",
              border: "1px solid rgba(233,188,185,0.12)",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.35), 0 4px 20px rgba(237,158,89,0.25)",
              padding: "28px 32px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              willChange: "transform",
            }}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ── Bars row with 3D perspective ── */}
            <div
              className="flex gap-2 items-end"
              style={{ perspective: "600px" }}
            >
              {[40, 60, 35, 80, 55, 70, 45, 90].map((h, i) => (
                <motion.div
                  key={i}
                  style={{
                    width: "24px",
                    borderRadius: "6px 6px 0 0",
                    transformOrigin: "bottom center",
                    background:
                      "linear-gradient(180deg, #ED9E59 0%, #A34054 60%, #662249 100%)",
                    boxShadow:
                      "inset 0 2px 6px rgba(233,188,185,0.25), 0 4px 16px rgba(237,158,89,0.35)",
                    cursor: "default",
                    willChange: "transform, opacity",
                  }}
                  initial={{ height: 0, opacity: 0, scaleY: 1 }}
                  animate={
                    inView
                      ? { height: `${h}px`, opacity: 1, scaleY: [1, 1.08, 1] }
                      : {}
                  }
                  transition={{
                    height: {
                      duration: 0.7,
                      delay: i * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    },
                    opacity: {
                      duration: 0.5,
                      delay: i * 0.08,
                      ease: "easeOut",
                    },
                    scaleY: {
                      duration: 0.5,
                      delay: i * 0.08 + 0.5,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }}
                  whileHover={{
                    rotateX: 6,
                    y: -4,
                    boxShadow:
                      "inset 0 2px 8px rgba(233,188,185,0.35), 0 8px 24px rgba(237,158,89,0.55)",
                    transition: { duration: 0.3, ease: "easeOut" },
                  }}
                />
              ))}
            </div>

            {/* ── Subtle baseline rule ── */}
            <div
              style={{
                width: "100%",
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(237,158,89,0.4), transparent)",
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const features = [
  {
    title: "Create and customize your ShopFluence in minutes",
    description: "Connect all your content across social media, websites, stores and more in one link in bio. Customize every detail or let ShopFluence automatically enhance it to match your brand and drive more clicks.",
    bgColor: "bg-card",
    cards: [
      { image: gymProduct, label: "Gym" },
      { image: shoppingProduct, label: "Shopping" },
      { image: beautyProduct, label: "Beauty" },
    ],
  },
  {
    title: "Take your ShopFluence beyond social",
    description: " Drop your custom link across every platform where your audience engages. Turn real-world interactions into online conversions with a scannable QR code built for your brand.",
    bgColor: "bg-[#233D4C]",
    isPhone: true,
  },
  {
    title: "Sell what you collect, create and curate",
    description: "Collect payments and sell products, services, and more. Turn your audience into customers with our commerce tools built right into your ShopFluence.",
    bgColor: "bg-[#5f4a8b]",
    products: [
      { id: "1", image: product1, price: "$10", bgColor: "#9333ea" }, // Vibrant Purple
      { id: "2", image: product2, price: "$20", bgColor: "#fbbf24" }, // Mustard Yellow
      { id: "3", image: product3, price: "$40", bgColor: "#ef4444" }, // Vibrant Red
      { id: "4", image: product1, price: "$30", bgColor: "#22d3ee" }, // Vibrant Cyan
    ],
  },
  {
    title: "Analyze your audience and keep them engaged",
    description: "Track your engagement over time, monitor revenue and learn what's converting your audience. Make informed updates on the fly to keep them coming back.",
    bgColor: "bg-plum",
    isAnalytics: true,
  },
];

const TiltedCards = ({ cards }: { cards: { image: string; label: string }[] }) => {
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-3 w-full max-w-sm h-72">
      {/* Large card — spans 2 cols, 1 row */}
      <TiltedCard className="col-span-2 row-span-1 cursor-pointer" maxTilt={20} scale={1.05}>
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl relative">
          <img src={cards[0].image} alt={cards[0].label} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-void/80 to-transparent p-3">
            <span className="text-blush text-sm font-bold">{cards[0].label}</span>
          </div>
        </div>
      </TiltedCard>
      {/* Small card — 1 col, 1 row */}
      <TiltedCard className="col-span-1 row-span-1 cursor-pointer" maxTilt={25} scale={1.08}>
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl relative">
          <img src={cards[1].image} alt={cards[1].label} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-void/80 to-transparent p-2">
            <span className="text-blush text-xs font-bold">{cards[1].label}</span>
          </div>
        </div>
      </TiltedCard>
      {/* Small card — 1 col, 1 row */}
      <TiltedCard className="col-span-1 row-span-1 cursor-pointer" maxTilt={25} scale={1.08}>
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl relative">
          <img src={cards[2].image} alt={cards[2].label} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-void/80 to-transparent p-2">
            <span className="text-blush text-xs font-bold">{cards[2].label}</span>
          </div>
        </div>
      </TiltedCard>
      {/* Large card — spans 2 cols, 1 row (mirrored) */}
      <TiltedCard className="col-span-2 row-span-1 cursor-pointer" maxTilt={20} scale={1.05}>
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl relative">
          <img src={cards[0].image} alt={cards[0].label} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-void/80 to-transparent p-3">
            <span className="text-blush text-sm font-bold">{cards[0].label}</span>
          </div>
        </div>
      </TiltedCard>
    </div>
  );
};

const FeatureBlock = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isDark = feature.bgColor === "bg-[#233D4C]" || feature.bgColor === "bg-emerald-800" || feature.bgColor === "bg-[#5f4a8b]";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`grid md:grid-cols-2 gap-0 rounded-4xl overflow-hidden ${feature.bgColor} min-h-[400px]`}
    >
      {/* Visual Side */}
      <div className="relative p-6 md:p-8 flex items-center justify-center min-h-[250px] overflow-hidden">
        {feature.cards && (
          <TiltedCards cards={feature.cards} />
        )}
        {feature.isPhone && (
          <div className="w-full h-[300px] md:h-[400px]">
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-blush/50">Loading...</div>}>
              <Lanyard position={[0, 0, 25]} gravity={[0, -40, 0]} />
            </Suspense>
          </div>
        )}
        {feature.products && (
          <div className="flex items-center justify-center w-full max-w-full overflow-hidden">
            <div className="w-full max-w-[420px]">
              <InfiniteMenu
                items={feature.products}
                width="100%"
                height="500px"
              />
            </div>
          </div>
        )}
        {feature.isAnalytics && (
          <AnalyticsFloatingCard inView={inView} />
        )}
      </div>

      {/* Text Side */}
      <div className={`p-6 md:p-10 flex flex-col justify-center ${feature.isAnalytics ? "text-yellow-200" : (isDark ? "text-blush" : "text-foreground")}`}>
        <h3
          className="font-bold tracking-tight leading-tight mb-4"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)" }}
        >
          {feature.title}
        </h3>
        <p className={`text-base md:text-lg leading-relaxed mb-6 md:mb-8 ${feature.isAnalytics ? "text-yellow-200/80" : (isDark ? "text-blush/80" : "text-muted-foreground")}`}>
          {feature.description}
        </p>
        <motion.a
          href="/auth"
          className={`inline-flex items-center justify-center gap-2 px-6 py-4 rounded-pill text-sm font-semibold w-full sm:w-fit mt-auto md:mt-0 ${isDark ? "bg-card text-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Get started for free
          <ArrowRight className="w-4 h-4" />
        </motion.a>
      </div>
    </motion.div>
  );
};

export const FeaturesSection = () => {
  return (
    <>
      <section id="features" className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          {features.map((feature, i) => (
            <FeatureBlock key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </section>
      <CreativeGalleryLoop />
    </>
  );
};
