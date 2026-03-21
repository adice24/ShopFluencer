import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Product } from "../lib/types";
import { ShoppingCart, Star, Check, ShieldCheck, ArrowLeft, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

/** Prisma schema: `base_price` on products, gallery in `product_images`, sell price/stock on `product_variants`. */
type ProductImageRow = { url: string; is_primary: boolean; sort_order: number };
type VariantRow = {
    price: string | number;
    compare_at_price?: string | number | null;
    stock: number;
    is_active?: boolean;
    sort_order?: number;
};

type ProductPageRow = Record<string, unknown> & {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    short_description?: string | null;
    base_price?: string | number | null;
    compare_at_price?: string | number | null;
    type?: string;
    tags?: string[];
    image_url?: string | null;
    image_emoji?: string | null;
    is_featured?: boolean;
    brand_id?: string;
    brand?: { name?: string; logo_url?: string; description?: string };
    images?: ProductImageRow[];
    variants?: VariantRow[];
};

function normalizeProductForPublicPage(
    row: ProductPageRow
): Product & { brand?: ProductPageRow["brand"]; brand_id?: string } {
    const imgs = row.images ?? [];
    const sortedImgs = [...imgs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const primaryImg = sortedImgs.find((i) => i.is_primary) ?? sortedImgs[0];
    const legacy = typeof row.image_url === "string" ? row.image_url.trim() : "";
    const displayImage = (primaryImg?.url || legacy || "").trim();

    const rawVariants = row.variants ?? [];
    const variants = [...rawVariants]
        .filter((v) => v.is_active !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const firstVariant = variants[0] ?? rawVariants[0];

    const base = Number(row.base_price);
    const variantPrice = firstVariant != null ? Number(firstVariant.price) : NaN;
    const price = Number.isFinite(variantPrice)
        ? variantPrice
        : Number.isFinite(base)
          ? base
          : 0;

    const cmpP = row.compare_at_price != null ? Number(row.compare_at_price) : NaN;
    const cmpV = firstVariant?.compare_at_price != null ? Number(firstVariant.compare_at_price) : NaN;
    let compare_at_price: number | null = null;
    if (Number.isFinite(cmpP)) compare_at_price = cmpP;
    else if (Number.isFinite(cmpV)) compare_at_price = cmpV;

    let stock_count = -1;
    if (firstVariant) {
        stock_count = Number(firstVariant.stock);
    }

    const is_digital = row.type === "DIGITAL";

    return {
        id: String(row.id),
        store_id: "",
        slug: String(row.slug ?? ""),
        name: String(row.name ?? ""),
        description: String(row.description ?? row.short_description ?? ""),
        price,
        compare_at_price,
        image_url: displayImage,
        image_emoji: String(row.image_emoji ?? "📦"),
        category_id: null,
        category: null,
        tags: Array.isArray(row.tags) ? row.tags : [],
        is_visible: true,
        is_featured: Boolean(row.is_featured),
        is_digital,
        status: "active",
        stock_count,
        sort_order: 0,
        weight: null,
        sku: null,
        external_url: "",
        metadata: {},
        created_at: "",
        updated_at: "",
        brand: row.brand,
        brand_id: row.brand_id != null ? String(row.brand_id) : undefined,
    };
}

export default function ProductPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isHoveringImage, setIsHoveringImage] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const { data: product, isLoading, error } = useQuery({
        queryKey: ["product", slug],
        queryFn: async () => {
            if (!slug) return null;
            const { data, error: qErr } = await supabase
                .from("products")
                .select(
                    `
          *,
          brand:brands(name, logo_url, description),
          images:product_images(url, is_primary, sort_order),
          variants:product_variants(price, compare_at_price, stock, is_active, sort_order)
        `
                )
                .eq("slug", slug)
                .single();

            if (qErr) throw qErr;
            return normalizeProductForPublicPage(data as ProductPageRow);
        },
        enabled: !!slug,
        staleTime: 60 * 1000,
    });

    // Track product page view for real-time analytics
    useEffect(() => {
        if (!product) return;
        
        // Use a generated visitor ID or existing one
        const visitorId = sessionStorage.getItem('sf_visitor') || crypto.randomUUID();
        sessionStorage.setItem('sf_visitor', visitorId);

        // Check for influencer attribution in the URL (e.g. ?ref=influencer-slug-or-id)
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');

        const trackView = async () => {
            let influencerId = null;
            if (ref) {
                // Try to find the influencer by ID or slug
                const { data: prof } = await supabase
                    .from('influencer_profiles')
                    .select('id')
                    .or(`id.eq.${ref},user_id.eq.${ref}`)
                    .maybeSingle();
                if (prof) influencerId = prof.id;
            }

            await supabase.from("analytics_events").insert({
                brand_id: product.brand_id,
                influencer_id: influencerId,
                event_type: "PRODUCT_VIEW",
                product_id: product.id,
                visitor_id: visitorId,
                referrer: document.referrer || "",
                user_agent: navigator.userAgent,
                metadata: {
                    product_name: product.name,
                    price: product.price,
                    slug: product.slug,
                }
            });
        };

        trackView();
    }, [product?.id]);

    const handleAddToCart = async () => {
        if (!product) return;
        if (!user) {
            toast.error("Please login to proceed to checkout.");
            navigate("/auth");
            return;
        }
        setIsAddingToCart(true);

        try {
            // For now, if there is an external URL, just redirect there (affiliate link)
            if (product.external_url) {
                window.open(product.external_url, "_blank");
                return;
            }

            // Mock saving to cart (Real logic would connect to cart context)
            await new Promise(res => setTimeout(res, 600));
            toast.success("Added to Cart!", {
                description: `${product.name} is now in your cart.`,
                icon: <ShoppingCart size={16} />
            });
        } finally {
            setIsAddingToCart(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9]">
                <div className="w-8 h-8 border-2 border-[#D67151] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF9]">
                <h1 className="text-2xl font-bold text-blush mb-2">Product Not Found</h1>
                <p className="text-blush/55 mb-6">The product you are looking for does not exist or has been removed.</p>
                <Button onClick={() => navigate("/")} variant="outline" className="rounded-full">
                    Return to Home
                </Button>
            </div>
        );
    }

    const rawPrice = Number(product.price);
    const safePrice = Number.isFinite(rawPrice) ? Math.max(0, rawPrice) : 0;
    const compareAt =
        product.compare_at_price != null ? Number(product.compare_at_price) : null;
    const hasDiscount =
        compareAt != null &&
        Number.isFinite(compareAt) &&
        compareAt > safePrice &&
        compareAt > 0 &&
        safePrice > 0;
    const discountPercentage = hasDiscount
        ? Math.round(((compareAt! - safePrice) / compareAt!) * 100)
        : 0;
    const priceParts = safePrice.toFixed(2).split(".");
    const stockCount = product.stock_count;
    const inStock =
        stockCount > 0 || stockCount === -1 || stockCount >= 999999;

    return (
        <div className="min-h-screen bg-card font-sans text-[#0F1111]">
            <nav className="border-b border-blush/12 sticky top-0 bg-card z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors flex items-center gap-2">
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium hidden sm:inline">Back</span>
                    </button>
                    <div className="font-bold text-xl cursor-pointer" onClick={() => navigate("/")}>
                        Shop<span className="text-[#D67151]">fluence</span>.
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start">

                    {/* Left Column - Large Image view */}
                    <div
                        className="sticky top-24 rounded-2xl overflow-hidden bg-card border border-blush/08 flex items-center justify-center group"
                        style={{ aspectRatio: '1/1' }}
                        onMouseEnter={() => setIsHoveringImage(true)}
                        onMouseLeave={() => setIsHoveringImage(false)}
                    >
                        {product.image_url?.trim() ? (
                            <motion.img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-contain p-8 mix-blend-multiply"
                                animate={{ scale: isHoveringImage ? 1.05 : 1 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                        ) : (
                            <span className="text-9xl">{product.image_emoji || "📦"}</span>
                        )}
                        {hasDiscount && (
                            <div className="absolute top-4 left-4 bg-[#CC0C39] text-blush text-sm font-bold px-3 py-1 rounded-sm shadow-sm">
                                Save {discountPercentage}%
                            </div>
                        )}
                    </div>

                    {/* Right Column - Product Meta, Pricing, Purchase CTA */}
                    <div className="flex flex-col">

                        {/* Title & Brand/Creator */}
                        <div className="mb-4">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    {product.brand && (
                                        <p className="text-[#007185] hover:text-[#C7511F] text-sm font-medium mb-1 cursor-pointer transition-colors inline-block pb-1 border-b border-transparent hover:border-[#C7511F]">
                                            Visit the {product.brand.name} Store
                                        </p>
                                    )}
                                    <h1 className="text-[24px] sm:text-[28px] leading-tight font-medium text-[#0F1111]">
                                        {product.name}
                                    </h1>
                                </div>
                                <button
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: product.name,
                                                url: window.location.href
                                            }).catch(console.error);
                                        } else {
                                            navigator.clipboard.writeText(window.location.href);
                                            toast.success("Link copied to clipboard!");
                                        }
                                    }}
                                    className="p-2 -mr-2 mt-1 text-blush/55 hover:text-[#0F1111] hover:bg-muted rounded-full transition-colors shrink-0"
                                    title="Share"
                                >
                                    <Share size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Reviews placeholder */}
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-blush/12">
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={16} className="fill-[#FFA41C] text-[#FFA41C]" />
                                ))}
                                <span className="text-[#007185] text-sm ml-2 hover:underline cursor-pointer">4.8 (1,234 ratings)</span>
                            </div>
                            <div className="h-4 w-[1px] bg-muted"></div>
                            {/* <span className="text-sm text-blush/70">300+ bought in past month</span> */}
                        </div>

                        {/* Pricing Block */}
                        <div className="mb-6">
                            <div className="flex items-end gap-3 mb-1">
                                <span className="text-[32px] leading-none text-[#0F1111] font-medium">
                                    <span className="text-lg relative -top-3">$</span>
                                    {priceParts[0]}
                                    <span className="text-lg relative -top-3">.{priceParts[1]}</span>
                                </span>

                                {hasDiscount && (
                                    <span className="text-sm text-blush/55 line-through mb-1">
                                        List Price: ${compareAt!.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <div className="text-sm mb-4">
                                <span className="text-blush/55">Available instantly via digital download or free delivery.</span>
                            </div>
                        </div>

                        {/* Action Box (Amazon style buy box) */}
                        <div className="border border-blush/12 rounded-xl p-6 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)] bg-[#FDFDFD]">
                            <h2 className="text-lg font-bold text-[#0F1111] mb-2">
                                <span className="text-lg relative -top-1">$</span>
                                {safePrice.toFixed(2)}
                            </h2>
                            <p className="text-sm text-blush/55 mb-4">
                                Secure transaction via Stripe.
                            </p>

                            <div className="mb-5 flex items-center gap-2">
                                {inStock ? (
                                    <span className="text-[#007600] text-lg font-medium">In Stock</span>
                                ) : (
                                    <span className="text-[#B12704] text-lg font-medium">Currently unavailable.</span>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={!inStock || isAddingToCart}
                                    className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full h-12 text-[15px] font-medium shadow-none transition-colors"
                                >
                                    {isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                                </Button>
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={!inStock || isAddingToCart}
                                    className="w-full bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] border border-[#FF8F00] rounded-full h-12 text-[15px] font-medium shadow-none transition-colors"
                                >
                                    Buy Now
                                </Button>
                            </div>

                            <div className="mt-5 space-y-3 text-sm flex flex-col pl-1">
                                <div className="flex gap-4 items-center">
                                    <span className="text-blush/55 w-20">Ships from</span>
                                    <span className="text-[#0F1111]">Shopfluence Secure Server</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <span className="text-blush/55 w-20">Sold by</span>
                                    <span className="text-[#007185] hover:underline cursor-pointer">{product.brand?.name || "Official Brand"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Details & Trust Badges */}
                        <div className="grid grid-cols-1 gap-6 pb-6 border-b border-blush/12">
                            {product.is_digital && (
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 rounded-full bg-plum/20 flex items-center justify-center shrink-0">
                                        <Check className="text-gold" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#0F1111]">Instant Access</h4>
                                        <p className="text-sm text-blush/70 mt-1">This is a digital product. You'll receive a download link immediately after purchase.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="text-gold" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0F1111]">Secure Purchase</h4>
                                    <p className="text-sm text-blush/70 mt-1">Your data is fully encrypted and protected via industry standard SSL.</p>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="pt-8 mb-12">
                            <h3 className="text-xl font-bold text-[#0F1111] mb-4">About this item</h3>
                            <div className="text-[15px] leading-relaxed text-[#0F1111] space-y-4">
                                {product.description ? (
                                    product.description.split('\n').map((paragraph, idx) => (
                                        <p key={idx}>{paragraph}</p>
                                    ))
                                ) : (
                                    <p className="text-blush/55 italic">The creator hasn't added a description for this product yet.</p>
                                )}
                            </div>

                            {/* Tags or Category */}
                            {(product.category || (product.tags && product.tags.length > 0)) && (
                                <div className="mt-6 flex flex-wrap gap-2">
                                    {product.category && (
                                        <span className="px-3 py-1 bg-muted text-blush text-xs font-medium rounded">
                                            {product.category}
                                        </span>
                                    )}
                                    {product.tags && Array.isArray(product.tags) && product.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-card text-blush/70 border border-blush/12 text-xs rounded">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
