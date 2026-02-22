import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ExternalLink, Star, X, Plus, Minus, ArrowLeft } from "lucide-react";
import { usePublicStore } from "../hooks/usePublicStore";
import { useCart } from "../hooks/useCart";
import { useTrackEvent } from "../hooks/useAnalytics";
import type { Product } from "../lib/types";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import { fetchApi } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from "../contexts/AuthContext";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

export default function StorefrontPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { store, products, isStoreLoading, isProductsLoading } = usePublicStore(slug);
  const { items, itemCount, total, addItem, updateQuantity, clearCart } = useCart();
  const { track } = useTrackEvent(store?.id);

  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Track page view once store is loaded
  useEffect(() => {
    if (store?.id && slug) {
      track("page_view", undefined, { slug });
    }
  }, [store?.id, slug, track]);

  const handleProductClick = (product: Product) => {
    track("product_click", product.id, { name: product.name });
    setSelectedProduct(product);
  };

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) {
      toast.error("Please login to proceed to checkout.");
      navigate("/auth");
      return;
    }
    addItem(product, 1);
    track("add_to_cart", product.id, { name: product.name, price: product.price });
  };

  const handleCheckout = async () => {
    if (!store?.id || items.length === 0) return;
    setIsCheckingOut(true);
    try {
      const orderData = {
        influencerId: store.user_id,
        shippingName: "Guest User",
        shippingEmail: "guest@example.com",
        shippingPhone: "0000000000",
        shippingAddress: "123 Test St",
        shippingCity: "Test City",
        shippingState: "TS",
        shippingZip: "12345",
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      const order = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      const intent = await fetchApi('/payments/intent', {
        method: 'POST',
        body: JSON.stringify({ orderId: order.id })
      });

      setClientSecret(intent.clientSecret);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Checkout failed');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success("Order placed successfully!");
    setClientSecret(null);
    setCartOpen(false);
    clearCart();
  };

  if (isStoreLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl mb-4">🏪</div>
        <h1 className="text-xl font-bold text-foreground">Store Not Found</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          The store you're looking for doesn't exist or is currently inactive.
        </p>
      </div>
    );
  }

  // Fallbacks for missing store branding
  const storeBanner = store.theme?.mode === "dark"
    ? "linear-gradient(135deg, hsl(240, 10%, 10%), hsl(240, 10%, 15%))"
    : store.theme?.mode === "sunset"
      ? "linear-gradient(135deg, #ff7e5f, #feb47b)"
      : "linear-gradient(135deg, hsl(68, 80%, 52%), hsl(236, 60%, 50%))";

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="h-40 md:h-52 w-full" style={{ background: storeBanner }} />

      {/* Profile */}
      <div className="max-w-lg mx-auto px-4 -mt-16 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-card border-4 border-background flex items-center justify-center text-4xl shadow-lg truncate overflow-hidden">
            {store.avatar_url ? <img src={store.avatar_url} className="w-full h-full object-cover" /> : store.display_name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-foreground mt-3">{store.display_name}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">{store.bio}</p>
          <p className="text-xs text-muted-foreground mt-1">@{store.slug}</p>
        </motion.div>

        {/* Products */}
        <div className="mt-8 space-y-3 pb-24">
          {isProductsLoading ? (
            <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : products.length === 0 ? (
            <div className="text-center p-8 bg-card border border-border rounded-2xl text-muted-foreground text-sm">
              No products available right now.
            </div>
          ) : (
            products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                  {product.image_emoji || (product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : "📦")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-sm truncate">{product.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-foreground text-sm">${product.price.toFixed(2)}</p>
                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    className="mt-1 text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-semibold hover:opacity-90 transition-opacity"
                  >
                    Add
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <AnimatePresence>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 right-6 bg-secondary text-secondary-foreground w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform z-50"
          >
            <ShoppingCart size={22} />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          </motion.button>
        </AnimatePresence>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card rounded-t-3xl z-50 max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="flex flex-col h-full bg-card rounded-t-3xl border-t border-border overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
                  <h2 className="text-lg font-bold text-foreground">Your Cart ({itemCount})</h2>
                  <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-muted rounded-xl"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {items.map(item => (
                    <div key={item.product.id} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl overflow-hidden shrink-0">
                        {item.product.image_emoji || (item.product.image_url ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" /> : "📦")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">${item.product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-muted rounded-full p-1">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-7 h-7 rounded-full hover:bg-background flex items-center justify-center shadow-sm transition-colors text-muted-foreground"><Minus size={12} /></button>
                        <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 rounded-full hover:bg-background flex items-center justify-center shadow-sm transition-colors text-foreground"><Plus size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-card border-t border-border mt-auto">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-foreground text-xl">${total.toFixed(2)}</span>
                  </div>

                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} total={total.toFixed(2)} />
                    </Elements>
                  ) : (
                    <button
                      onClick={handleCheckout}
                      disabled={isCheckingOut || items.length === 0}
                      className="w-full bg-primary text-primary-foreground py-4 rounded-full font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
                    >
                      {isCheckingOut ? 'Setting up secure checkout...' : 'Checkout'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-card rounded-3xl z-50 overflow-hidden max-h-[90vh] border border-border shadow-2xl flex flex-col"
            >
              <div className="h-48 md:h-64 bg-muted flex items-center justify-center text-6xl relative shrink-0">
                {selectedProduct.image_emoji || (selectedProduct.image_url ? <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" /> : "📦")}
                <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 p-2 bg-background/50 hover:bg-background backdrop-blur text-foreground rounded-full transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <h2 className="text-xl font-bold text-foreground">{selectedProduct.name}</h2>
                <p className="text-2xl font-bold text-foreground mt-2">${selectedProduct.price.toFixed(2)}</p>
                <div className="mt-4 prose prose-sm dark:prose-invert">
                  <p className="text-muted-foreground leading-relaxed">{selectedProduct.description}</p>
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); setCartOpen(true); }}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-full font-bold text-sm hover:opacity-90 transition-opacity shadow-md"
                  >
                    Add to Cart • ${(selectedProduct.price).toFixed(2)}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 text-center py-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm border-t border-border z-40">
        Powered by <span className="font-semibold text-foreground">ShopFluence</span>
      </div>
    </div>
  );
}
