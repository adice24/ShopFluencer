import { motion } from "framer-motion";
import { Twitter, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = {
  Company: ["About", "Careers", "Press", "Blog", "Contact"],
  Product: ["Features", "Pricing", "Templates", "Marketplace", "Integrations"],
  Support: ["Help Center", "Community", "Status", "What's New", "Developers"],
  Legal: ["Privacy", "Terms", "Cookies", "GDPR"],
};

const socials = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export const Footer = () => {
  return (
    <footer className="pt-16 pb-10 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-foreground font-bold text-xl tracking-tight">ShopFluence</span>
              <span className="text-foreground text-xl">✱</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
              The only link in bio trusted by 70M+ people. Share everything you create, curate and sell online.
            </p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all duration-200"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-foreground font-bold text-sm mb-4">{category}</h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link to={`/${link.toLowerCase().replace(/\s+/g, '-')}`} className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-200">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm">© 2026 ShopFluence. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
