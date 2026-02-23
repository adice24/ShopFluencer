import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import influencer1 from "@/assets/influencer-1.jpg";
import influencer2 from "@/assets/influencer-2.jpg";

const rotatingWords = [
  "creators",
  "influencers",
  "small businesses",
  "athletes",
  "models",
  "streamers",
  "vloggers",
  "fitness coaches",
];

const carouselCards = [
  { image: product1, label: "Trending Products", gradient: "from-rose-500 to-orange-400" },
  { image: influencer1, label: "Top Creators", gradient: "from-violet-500 to-indigo-500" },
  { image: product2, label: "Best Sellers", gradient: "from-emerald-500 to-teal-400" },
  { image: influencer2, label: "Rising Stars", gradient: "from-blue-500 to-cyan-400" },
  { image: product3, label: "New Arrivals", gradient: "from-amber-500 to-yellow-400" },
];

export const HeroSection = () => {
  const [url, setUrl] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % rotatingWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((i) => (i + 1) % carouselCards.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-32 pb-20 overflow-hidden" style={{ backgroundColor: '#f1e194' }}>
      {/* Floating decorative shapes */}
      <motion.div
        className="absolute top-20 right-10 w-32 h-32 rounded-full bg-primary/20 blur-2xl"
        animate={{ scale: [1, 1.3, 1], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-secondary/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="font-bold text-secondary leading-[1.05] tracking-tight max-w-full break-words"
              style={{ fontSize: "clamp(2rem, 8vw, 5rem)" }}
            >
              Own your link.
              <br />
              Own your audience.
            </h1>

            <p className="text-secondary/70 text-lg leading-relaxed max-w-lg">
              Transform a single URL into your personalized storefront to promote, monetize, and manage everything you create online.
            </p>

            {/* URL Input */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto lg:mx-0">
              <div className="flex-1 w-full relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none select-none">
                  shopfluence.com/
                </span>
                <input
                  type="text"
                  placeholder="yourname"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-[8.5rem] pr-4 py-4 rounded-pill bg-card border-none text-foreground text-sm font-medium placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-secondary/30 transition-all duration-200"
                />
              </div>
              <motion.a
                href="/auth"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-pill bg-secondary text-secondary-foreground font-semibold text-sm whitespace-nowrap w-full sm:w-auto"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Get started for free
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>

          {/* Right Column — Card Swap Carousel */}
          <motion.div
            className="relative flex items-center justify-center h-[340px] md:h-[420px] mt-8 lg:mt-0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="popLayout">
              {carouselCards.map((card, i) => {
                const offset = (i - activeCard + carouselCards.length) % carouselCards.length;
                if (offset > 2) return null;

                return (
                  <motion.div
                    key={card.label}
                    className="absolute cursor-pointer"
                    style={{ zIndex: 10 - offset }}
                    initial={{ opacity: 0, scale: 0.8, x: 100 }}
                    animate={{
                      opacity: offset > 2 ? 0 : 1 - offset * 0.15,
                      scale: 1 - offset * 0.08,
                      x: offset * 40,
                      y: offset * 12,
                      rotateZ: offset * -3,
                    }}
                    exit={{ opacity: 0, scale: 0.8, x: -200, rotateZ: -15 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={offset === 0 ? { y: -8, scale: 1.02 } : {}}
                    onClick={() => setActiveCard((activeCard + 1) % carouselCards.length)}
                  >
                    <div className="w-[14rem] h-[18rem] md:w-64 md:h-80 rounded-3xl overflow-hidden shadow-2xl relative group">
                      <img
                        src={card.image}
                        alt={card.label}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${card.gradient} opacity-30 mix-blend-multiply`} />
                      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
                        <motion.span
                          className="text-white font-bold text-lg"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {card.label}
                        </motion.span>
                      </div>
                      {offset === 0 && (
                        <motion.div
                          className="absolute top-4 right-4 w-3 h-3 rounded-full bg-primary"
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Carousel dots */}
            <div className="absolute -bottom-2 flex gap-2">
              {carouselCards.map((_, i) => (
                <motion.button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === activeCard ? "bg-secondary w-6" : "bg-secondary/30"
                    }`}
                  onClick={() => setActiveCard(i)}
                  whileHover={{ scale: 1.3 }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Trust Banner */}
      <div className="max-w-7xl mx-auto px-6 mt-24">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <h2
            className="font-bold text-secondary tracking-tight leading-tight"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            The only link in bio trusted by 70M+
            <br />
            <AnimatePresence mode="wait">
              <motion.span
                key={rotatingWords[wordIndex]}
                className="text-blue-600 inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {rotatingWords[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </h2>
        </motion.div>
      </div>
    </section>
  );
};
