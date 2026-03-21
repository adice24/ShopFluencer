import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

export const CTASection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 bg-background">
      <div className="max-w-4xl mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="bg-secondary rounded-4xl p-12 md:p-20 text-center"
        >
          <h2
            className="font-bold text-blush tracking-tight leading-tight mb-4"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}
          >
            Ready to get started?
          </h2>
          <p className="text-blush/60 text-lg max-w-lg mx-auto mb-8">
            Join 70M+ people and create your free ShopFluence today. It takes less than a minute.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/auth?mode=signup"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-pill bg-gold text-void font-semibold text-base w-full sm:w-auto"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Sign up free
              <ArrowRight className="w-5 h-5" />
            </motion.a>
            <motion.a
              href="#learn"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-pill border border-white/20 text-blush font-semibold text-base hover:bg-card/10 transition-colors duration-200 w-full sm:w-auto"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Learn more
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
