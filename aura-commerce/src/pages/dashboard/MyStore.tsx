import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Eye, EyeOff, Copy, Trash2, Edit, X, Upload, Package, Globe, DollarSign, Tag as TagIcon, Hash, Share, Check, ExternalLink } from "lucide-react";
import { useMyStore, useProducts } from "../../hooks/useInfluencerStore";
import type { Product } from "../../lib/types";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Loader2 } from "lucide-react";
import {
  createInfluencerListing,
  updateInfluencerListing,
  formatSupabaseError,
} from "../../lib/influencerProductSave";

export default function MyStore() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { store, createStore, isLoading: storeLoading } = useMyStore();
  const { products = [], toggleVisibility, reorderProducts, deleteProduct, isLoading } = useProducts(store?.id);
  const [search, setSearch] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);

  const [isAddingMode, setIsAddingMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compare_at_price: "",
    image_url: "",
    stock_count: "",
    status: "active",
    sku: "",
    category: "",
    tags: "",
    weight: "",
    is_digital: false,
    external_url: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      compare_at_price: "",
      image_url: "",
      stock_count: "",
      status: "active",
      sku: "",
      category: "",
      tags: "",
      weight: "",
      is_digital: false,
      external_url: "",
    });
    setEditingProduct(null);
    setIsAddingMode(false);
  };

  const openEdit = (product: Product) => {
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      compare_at_price: product.compare_at_price?.toString() || "",
      image_url: product.image_url || "",
      stock_count: product.stock_count?.toString() || "-1",
      status: product.status || "active",
      sku: product.sku || "",
      category: product.category || "",
      tags: product.tags?.join(", ") || "",
      weight: product.weight?.toString() || "",
      is_digital: product.is_digital || false,
      external_url: product.external_url || "",
    });
    setEditingProduct(product);
    setIsAddingMode(true);
  };

  const ensureStorefront = async (): Promise<string | null> => {
    if (store?.id) return store.id;
    if (storeLoading) {
      toast.error("Loading your storefront… try again in a moment.");
      return null;
    }
    if (!user) {
      toast.error("Sign in to add products.");
      return null;
    }
    try {
      const base = (user.email?.split("@")[0] || "store")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "")
        .slice(0, 24) || "store";
      const slug = `${base}-${Date.now().toString(36)}`;
      const label =
        (user.user_metadata?.full_name as string | undefined) || base;
      const created = await createStore.mutateAsync({
        slug,
        title: label,
        display_name: label,
      });
      return created.id;
    } catch (e) {
      console.error(e);
      toast.error(
        "Could not create your storefront. Finish affiliate onboarding or try again."
      );
      return null;
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || formData.price === "") {
      toast.error("Product name and price are required.");
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast.error("Enter a valid price.");
      return;
    }

    setSavingProduct(true);
    try {
      const storefrontId = await ensureStorefront();
      if (!storefrontId) return;

      const payload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        compare_at_price: formData.compare_at_price,
        image_url: formData.image_url,
        stock_count: formData.stock_count,
        status: formData.status,
        sku: formData.sku,
        category: formData.category,
        tags: formData.tags,
        is_digital: formData.is_digital,
      };

      if (editingProduct) {
        await updateInfluencerListing(editingProduct.id, payload);
        toast.success("Product updated.");
      } else {
        await createInfluencerListing(
          storefrontId,
          payload,
          store?.id === storefrontId ? products.length : 0
        );
        toast.success(
          "Product added. It appears in Discover (Marketplace) when status is Active — trending follows sales."
        );
      }
      queryClient.invalidateQueries({ queryKey: ["products", storefrontId] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-products"] });
      queryClient.invalidateQueries({ queryKey: ["my-store-products", storefrontId] });
      queryClient.invalidateQueries({ queryKey: ["public-store"] });
      resetForm();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? formatSupabaseError(err as { message?: string; code?: string; details?: string; hint?: string })
            : "Could not save product.";
      toast.error(msg);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    // Validate mime
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.");
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicData.publicUrl }));
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to upload image. " + err.message);
    } finally {
      setIsUploading(false);
      // reset file input
      e.target.value = "";
    }
  };

  const currentProducts = products;
  const filtered = currentProducts.filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-8 h-8 border-2 border-[#E5976D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Very large form UI overlay when adding/editing
  if (isAddingMode) {
    return (
      <div className="w-full max-w-4xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#2F3E46]">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h1>
          <button onClick={resetForm} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X className="text-[#4D606B]" />
          </button>
        </div>

        <div className="bg-card/80 backdrop-blur-md border border-white p-8 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Essentials */}
            <div className="space-y-6">
              <h3 className="font-bold text-[#2F3E46] text-lg flex items-center gap-2">
                <Package size={18} className="text-[#D67151]" />
                Essential Details
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Vintage Leather Jacket" className="rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Tell your audience about this item..." className="rounded-xl min-h-[120px]" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price ($) *</Label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} type="number" placeholder="49.99" className="pl-8 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Compare at Price ($)</Label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input value={formData.compare_at_price} onChange={e => setFormData({ ...formData, compare_at_price: e.target.value })} type="number" placeholder="79.99" className="pl-8 rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Main Image</Label>
                  <div className="flex gap-2 items-center">
                    <Input value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." className="rounded-xl flex-1" />

                    <div className="relative overflow-hidden shrink-0">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        className="px-4 py-2 border rounded-xl flex items-center justify-center gap-2 hover:bg-black/5 transition-colors disabled:opacity-50"
                      >
                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        <span className="text-sm font-medium">{isUploading ? "Uploading..." : "Upload"}</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground ml-1">(Provide a URL or upload a file up to 5MB)</p>
                </div>
              </div>
            </div>

            {/* Right Column - Advanced & Inventory */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="font-bold text-[#2F3E46] text-lg flex items-center gap-2">
                  <TagIcon size={18} className="text-[#D67151]" />
                  Inventory & Status
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stock Quantity</Label>
                    <Input value={formData.stock_count} onChange={e => setFormData({ ...formData, stock_count: e.target.value })} type="number" placeholder="-1 for unlimited" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU (Optional)</Label>
                    <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="PROD-001" className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is_digital"
                    checked={formData.is_digital}
                    onChange={e => setFormData({ ...formData, is_digital: e.target.checked })}
                    className="rounded text-[#D67151] focus:ring-[#D67151] w-4 h-4 cursor-pointer"
                  />
                  <Label htmlFor="is_digital" className="cursor-pointer">This is a digital product</Label>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-bold text-[#2F3E46] text-lg flex items-center gap-2">
                  <Globe size={18} className="text-[#D67151]" />
                  Discovery & Affiliate
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Fashion, Presets, Gear" className="rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags (comma separated)</Label>
                    <Input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="vintage, summer, aesthetic" className="rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label>External Affiliate URL (Overrides Checkout)</Label>
                    <Input value={formData.external_url} onChange={e => setFormData({ ...formData, external_url: e.target.value })} placeholder="https://amazon.com/... (optional)" className="rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-4 pt-6 mt-8 border-t border-black/5">
            <button onClick={resetForm} className="px-6 py-2.5 text-[#4D606B] font-medium hover:bg-black/5 rounded-full transition-colors">
              Cancel
            </button>
            <button
              type="button"
              disabled={savingProduct}
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 px-8 py-2.5 bg-[#D67151] hover:bg-[#c46142] text-blush font-bold rounded-full transition-all shadow-md hover:shadow-lg shadow-void/50 hover:-translate-y-0.5 disabled:opacity-60"
            >
              {savingProduct ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : editingProduct ? (
                "Update Product"
              ) : (
                "Save Product"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2F3E46] mb-1">Products</h1>
          <p className="text-[#4D606B]">Manage your store inventory and affiliate links.</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsAddingMode(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#D67151] hover:bg-[#c46142] text-blush rounded-full font-bold shadow-[0_4px_14px_rgba(214,113,81,0.3)] hover:shadow-[0_6px_20px_rgba(214,113,81,0.4)] transition-all hover:-translate-y-0.5"
          >
            <Plus size={18} /> ADD PRODUCT
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard/marketplace")}
            className="text-sm font-semibold text-[#4D606B] hover:text-[#D67151] underline-offset-2 hover:underline"
          >
            Browse Discover (Marketplace)
          </button>
        </div>
      </div>

      <div className="bg-card/60 backdrop-blur-md rounded-[24px] p-6 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-4 mb-6 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-card border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-[#D67151]/20 focus:border-[#D67151]/50 transition-all font-medium text-[#2F3E46] placeholder:font-normal placeholder:text-muted-foreground/70 shadow-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-card/50 rounded-[20px] border border-dashed border-black/10">
            <Package size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-[#2F3E46] mb-2">No products found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Add your own listing for sale, or browse Discover to curate from brands. Active listings show in Discover; turn on &quot;Trending&quot; there to sort by sales.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filtered.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col"
                >
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={() => toggleVisibility(product.id)}
                      className={`p-1.5 rounded-full backdrop-blur-md transition-colors shadow-sm
                        ${product.is_visible ? 'bg-card text-[#4D606B] hover:text-void' : 'bg-black/80 text-blush'}`}
                      title={product.is_visible ? "Visible" : "Hidden"}
                    >
                      {product.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>

                  <div className="aspect-square bg-muted/30 rounded-[14px] mb-4 flex items-center justify-center overflow-hidden relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">{product.image_emoji || "📦"}</span>
                    )}
                    {product.status === 'draft' && (
                      <div className="absolute inset-0 bg-card/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-3 py-1 bg-black/80 text-blush text-[11px] font-bold rounded-full">DRAFT</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-[#2F3E46] text-lg mb-1 line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <p className="font-semibold text-[#D67151]">${product.price?.toFixed(2)}</p>
                      {product.compare_at_price && (
                        <p className="text-sm text-muted-foreground line-through">${product.compare_at_price.toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t border-black/5 mt-auto">
                    {/* Product Link Row */}
                    {product.slug && (
                      <div className="flex items-center gap-2 bg-[#E28362]/8 rounded-[10px] px-3 py-2">
                        <ExternalLink size={11} className="text-[#E28362] shrink-0" />
                        <span className="text-[11px] font-bold text-[#E28362] truncate flex-1">
                          {window.location.host}/p/{product.slug}
                        </span>
                      </div>
                    )}
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        {product.is_digital ? <Hash size={12} /> : <Package size={12} />}
                        {product.stock_count === -1 ? 'Unlimited' : `${product.stock_count} left`}
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Copy Link */}
                        <button
                          onClick={async () => {
                            const url = `${window.location.origin}/p/${product.slug}`;
                            await navigator.clipboard.writeText(url);
                            setCopiedProductId(product.id);
                            setTimeout(() => setCopiedProductId(null), 2000);
                            toast.success("Product link copied!");
                            // Track in analytics
                            if (store?.id) {
                              supabase.from("analytics_events").insert({
                                store_id: store.id,
                                event_type: "product_link_copied",
                                product_id: product.id,
                                visitor_id: user?.id || null,
                                user_agent: navigator.userAgent,
                                referrer: "",
                                metadata: { product_name: product.name, action: 'copy' }
                              }).then(() => { });
                            }
                          }}
                          className="p-1.5 text-muted-foreground hover:bg-black/5 hover:text-[#E28362] rounded-lg transition-colors"
                          title="Copy Product Link"
                        >
                          {copiedProductId === product.id ? <Check size={14} className="text-gold" /> : <Copy size={14} />}
                        </button>
                        {/* Share */}
                        <button
                          onClick={async () => {
                            const url = `${window.location.origin}/p/${product.slug}`;
                            if (navigator.share) {
                              try { await navigator.share({ title: product.name, url }); } catch (_) { }
                            } else {
                              await navigator.clipboard.writeText(url);
                              toast.success("Link copied!");
                            }
                            // Track
                            if (store?.id) {
                              supabase.from("analytics_events").insert({
                                store_id: store.id,
                                event_type: "product_link_shared",
                                product_id: product.id,
                                visitor_id: user?.id || null,
                                user_agent: navigator.userAgent,
                                referrer: "",
                                metadata: { product_name: product.name, action: 'share' }
                              }).then(() => { });
                            }
                          }}
                          className="p-1.5 text-muted-foreground hover:bg-black/5 hover:text-[#2F3E46] rounded-lg transition-colors"
                          title="Share Product Link"
                        >
                          <Share size={14} />
                        </button>
                        {/* View Public */}
                        <button
                          onClick={() => window.open(`${window.location.origin}/p/${product.slug}`, '_blank')}
                          className="p-1.5 text-muted-foreground hover:bg-black/5 hover:text-[#2F3E46] rounded-lg transition-colors"
                          title="View Public Page"
                        >
                          <Globe size={14} />
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 text-muted-foreground hover:bg-black/5 hover:text-[#2F3E46] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this product?')) deleteProduct.mutate(product.id);
                          }}
                          className="p-1.5 text-muted-foreground hover:bg-rose/10 hover:text-rose rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}