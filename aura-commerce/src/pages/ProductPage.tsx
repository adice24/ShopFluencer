import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Product } from "../lib/types";
import { ShoppingCart, Star, Check, ShieldCheck, ArrowLeft, Truck, RefreshCcw, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ProductPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isHoveringImage, setIsHoveringImage] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // Fetch the product by unique slug
    const { data: product, isLoading, error } = useQuery({
        queryKey: ["product", slug],
        queryFn: async () => {
            if (!slug) return null;
            const { data, error } = await supabase
                .from("products")
                .select("*, influencer_stores(display_name, avatar_url, theme)")
                .eq("slug", slug)
                .single();

            if (error) throw error;
            return data as Product & { influencer_stores: any };
        },
        enabled: !!slug,
        staleTime: 60 * 1000,
    });

    // Track product page view for real-time analytics
    useEffect(() => {
        if (!product) return;
        const visitorId = sessionStorage.getItem('sf_visitor') || crypto.randomUUID();
        sessionStorage.setItem('sf_visitor', visitorId);

        supabase.from("analytics_events").insert({
            store_id: product.store_id,
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
        }).then(() => { });
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
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h1>
                <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
                <Button onClick={() => navigate("/")} variant="outline" className="rounded-full">
                    Return to Home
                </Button>
            </div>
        );
    }

    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
    const discountPercentage = hasDiscount
        ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-white font-sans text-[#0F1111]">
            <nav className="border-b border-gray-200 sticky top-0 bg-white z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2">
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
                        className="sticky top-24 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center group"
                        style={{ aspectRatio: '1/1' }}
                        onMouseEnter={() => setIsHoveringImage(true)}
                        onMouseLeave={() => setIsHoveringImage(false)}
                    >
                        {product.image_url ? (
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
                            <div className="absolute top-4 left-4 bg-[#CC0C39] text-white text-sm font-bold px-3 py-1 rounded-sm shadow-sm">
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
                                    {product.influencer_stores && (
                                        <p className="text-[#007185] hover:text-[#C7511F] text-sm font-medium mb-1 cursor-pointer transition-colors inline-block pb-1 border-b border-transparent hover:border-[#C7511F]">
                                            Visit the {product.influencer_stores.display_name} Store
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
                                    className="p-2 -mr-2 mt-1 text-gray-500 hover:text-[#0F1111] hover:bg-gray-100 rounded-full transition-colors shrink-0"
                                    title="Share"
                                >
                                    <Share size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Reviews placeholder */}
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={16} className="fill-[#FFA41C] text-[#FFA41C]" />
                                ))}
                                <span className="text-[#007185] text-sm ml-2 hover:underline cursor-pointer">4.8 (1,234 ratings)</span>
                            </div>
                            <div className="h-4 w-[1px] bg-gray-300"></div>
                            {/* <span className="text-sm text-gray-600">300+ bought in past month</span> */}
                        </div>

                        {/* Pricing Block */}
                        <div className="mb-6">
                            <div className="flex items-end gap-3 mb-1">
                                <span className="text-[32px] leading-none text-[#0F1111] font-medium">
                                    <span className="text-lg relative -top-3">$</span>
                                    {Math.floor(product.price)}
                                    <span className="text-lg relative -top-3">
                                        {(product.price % 1).toFixed(2).substring(2)}
                                    </span>
                                </span>

                                {hasDiscount && (
                                    <span className="text-sm text-gray-500 line-through mb-1">
                                        List Price: ${product.compare_at_price?.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <div className="text-sm mb-4">
                                <span className="text-gray-500">Available instantly via digital download or free delivery.</span>
                            </div>
                        </div>

                        {/* Action Box (Amazon style buy box) */}
                        <div className="border border-gray-200 rounded-xl p-6 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)] bg-[#FDFDFD]">
                            <h2 className="text-lg font-bold text-[#0F1111] mb-2">
                                <span className="text-lg relative -top-1">$</span>
                                {product.price.toFixed(2)}
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Secure transaction via Stripe.
                            </p>

                            <div className="mb-5 flex items-center gap-2">
                                {product.stock_count > 0 || product.stock_count === -1 ? (
                                    <span className="text-[#007600] text-lg font-medium">In Stock</span>
                                ) : (
                                    <span className="text-[#B12704] text-lg font-medium">Currently unavailable.</span>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={product.stock_count === 0 || isAddingToCart}
                                    className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full h-12 text-[15px] font-medium shadow-none transition-colors"
                                >
                                    {isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                                </Button>
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={product.stock_count === 0 || isAddingToCart}
                                    className="w-full bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] border border-[#FF8F00] rounded-full h-12 text-[15px] font-medium shadow-none transition-colors"
                                >
                                    Buy Now
                                </Button>
                            </div>

                            <div className="mt-5 space-y-3 text-sm flex flex-col pl-1">
                                <div className="flex gap-4 items-center">
                                    <span className="text-gray-500 w-20">Ships from</span>
                                    <span className="text-[#0F1111]">Shopfluence Secure Server</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <span className="text-gray-500 w-20">Sold by</span>
                                    <span className="text-[#007185] hover:underline cursor-pointer">{product.influencer_stores?.display_name || "Creator"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Details & Trust Badges */}
                        <div className="grid grid-cols-1 gap-6 pb-6 border-b border-gray-200">
                            {product.is_digital && (
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                        <Check className="text-blue-600" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#0F1111]">Instant Access</h4>
                                        <p className="text-sm text-gray-600 mt-1">This is a digital product. You'll receive a download link immediately after purchase.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="text-green-600" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0F1111]">Secure Purchase</h4>
                                    <p className="text-sm text-gray-600 mt-1">Your data is fully encrypted and protected via industry standard SSL.</p>
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
                                    <p className="text-gray-500 italic">The creator hasn't added a description for this product yet.</p>
                                )}
                            </div>

                            {/* Tags or Category */}
                            {(product.category || (product.tags && product.tags.length > 0)) && (
                                <div className="mt-6 flex flex-wrap gap-2">
                                    {product.category && (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                                            {product.category}
                                        </span>
                                    )}
                                    {product.tags && Array.isArray(product.tags) && product.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 text-xs rounded">
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
