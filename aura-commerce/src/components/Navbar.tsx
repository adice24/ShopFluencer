import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search } from "lucide-react";
import { Link } from "react-router-dom";
import GooeyNav from "./GooeyNav";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import * as React from "react";

const navItems = [
  { label: "Products", href: "/products" },
  { label: "Templates", href: "/templates" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Learn", href: "/learn" },
  { label: "Pricing", href: "/pricing" },
];

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string }
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={(props as any).href || "/"}
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-2xl p-3 leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted",
            className
          )}
          {...props}
        >
          <div className="text-sm font-semibold leading-none text-foreground">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1.5">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`mx-4 md:mx-6 mt-4 rounded-3xl transition-all duration-300 ${scrolled
          ? "bg-card/95 backdrop-blur-xl shadow-lg border border-border py-2"
          : "bg-card/80 backdrop-blur-md border border-border/50 py-3"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5">
            <span className="text-foreground font-bold text-2xl tracking-tight">ShopFluence</span>
            <span className="text-foreground text-2xl">✱</span>
          </Link>

          {/* Desktop Nav — NavigationMenu with dropdowns */}
          <div className="hidden md:flex items-center">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {/* Products dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="rounded-2xl bg-transparent text-foreground/70 hover:text-foreground hover:bg-muted text-sm font-medium">
                    Products
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-2xl bg-primary/20 p-6 no-underline outline-none focus:shadow-md"
                            to="/products"
                          >
                            <div className="mb-2 mt-4 text-lg font-bold text-foreground">
                              Featured Product
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Check out our latest and greatest offering
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/products" title="Link in Bio">
                        One link to share all your content and social profiles.
                      </ListItem>
                      <ListItem href="/features" title="Commerce">
                        Sell products and collect payments seamlessly.
                      </ListItem>
                      <ListItem href="/analytics" title="Analytics">
                        Track clicks, views, and revenue in real-time.
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Templates dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="rounded-2xl bg-transparent text-foreground/70 hover:text-foreground hover:bg-muted text-sm font-medium">
                    Templates
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                      <ListItem href="/templates" title="Creator">
                        Designed for content creators and influencers.
                      </ListItem>
                      <ListItem href="/templates" title="Business">
                        Professional templates for brands and agencies.
                      </ListItem>
                      <ListItem href="/templates" title="Portfolio">
                        Showcase your work with beautiful layouts.
                      </ListItem>
                      <ListItem href="/templates" title="Minimal">
                        Clean, simple designs that let content shine.
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Simple links */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/marketplace"
                      className="inline-flex h-10 w-max items-center justify-center rounded-2xl bg-transparent px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Marketplace
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/learn"
                      className="inline-flex h-10 w-max items-center justify-center rounded-2xl bg-transparent px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Learn
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/pricing"
                      className="inline-flex h-10 w-max items-center justify-center rounded-2xl bg-transparent px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Pricing
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl border border-border bg-muted/50">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-24"
              />
            </div>
            <Link
              to="/auth"
              className="hidden md:flex items-center px-5 py-2.5 rounded-2xl border border-foreground/20 text-foreground text-sm font-semibold hover:bg-foreground/5 transition-colors duration-200"
            >
              Log in
            </Link>
            <Link
              to="/auth"
              className="hidden md:flex items-center px-5 py-2.5 rounded-2xl bg-foreground text-card text-sm font-semibold hover:bg-foreground/90 transition-colors duration-200"
            >
              Sign up free
            </Link>

            <button
              className="md:hidden p-2 rounded-xl"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden mx-4 mt-2 rounded-3xl bg-card border border-border overflow-hidden shadow-lg"
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="p-4 flex flex-col gap-1">
              {navItems.map((link, i) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="px-4 py-3 rounded-2xl text-foreground/70 hover:text-foreground hover:bg-muted font-medium transition-all duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                  >
                    {link.label}
                  </motion.div>
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-2">
                <Link
                  to="/auth"
                  className="px-4 py-3 rounded-2xl border border-foreground/20 text-foreground text-center font-semibold"
                >
                  Log in
                </Link>
                <Link
                  to="/auth"
                  className="px-4 py-3 rounded-2xl bg-foreground text-card text-center font-semibold"
                >
                  Sign up free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
