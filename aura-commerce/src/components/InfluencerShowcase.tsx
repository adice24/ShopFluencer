import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For getting started",
    features: ["Unlimited links", "Basic analytics", "Standard themes", "Email support"],
    bgColor: "bg-card",
    textColor: "text-foreground",
    buttonStyle: "bg-foreground text-card",
    popular: false,
  },
  {
    name: "Starter",
    price: "$5",
    period: "/month",
    description: "For growing creators",
    features: ["Everything in Free", "Advanced analytics", "Custom themes", "Priority support", "Remove ShopFluence logo"],
    bgColor: "bg-primary",
    textColor: "text-blush",
    buttonStyle: "bg-gold text-void",
    popular: true,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For professionals",
    features: ["Everything in Starter", "Commerce features", "Email collection", "SEO settings", "Scheduling"],
    bgColor: "bg-card",
    textColor: "text-foreground",
    buttonStyle: "bg-foreground text-card",
    popular: false,
  },
  {
    name: "Premium",
    price: "$24",
    period: "/month",
    description: "For brands & agencies",
    features: ["Everything in Pro", "Team collaboration", "Custom domains", "API access", "Dedicated support"],
    bgColor: "bg-card",
    textColor: "text-foreground",
    buttonStyle: "bg-foreground text-card",
    popular: false,
  },
];

export const InfluencerShowcase = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section id="pricing" className="relative py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={headerRef} className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="font-bold text-foreground tracking-tight mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Simple pricing for everyone
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-lg mx-auto"
          >
            Start free and upgrade as you grow. No hidden fees, cancel anytime.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className={`${plan.bgColor} rounded-3xl p-6 border border-border relative ${plan.popular ? "ring-2 ring-secondary" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-pill bg-secondary text-secondary-foreground text-xs font-bold">
                  Most Popular
                </div>
              )}
              <h3 className={`text-lg font-bold ${plan.textColor} mb-1`}>{plan.name}</h3>
              <p className={`text-sm ${plan.popular ? "text-blush/60" : "text-muted-foreground"} mb-4`}>{plan.description}</p>
              <div className={`flex items-baseline gap-1 mb-6 ${plan.textColor}`}>
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={`text-sm ${plan.popular ? "text-blush/60" : "text-muted-foreground"}`}>{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className={`text-sm flex items-center gap-2 ${plan.popular ? "text-blush/80" : "text-muted-foreground"}`}>
                    <span className="text-gold font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <motion.a
                href="/auth"
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-pill ${plan.buttonStyle} text-sm font-semibold w-full`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Get started
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
