/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │  REAL-TIME DATA LAYER — Event Types & Database Types        │
 * │  Single source of truth for all Supabase table types         │
 * └──────────────────────────────────────────────────────────────┘
 */

/* ── Database Row Types ─────────────────────────── */

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    role: "customer" | "influencer" | "admin";
    status: "active" | "suspended" | "pending_approval" | "deleted";
    bio: string;
    phone: string;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
    login_count: number;
}

export interface InfluencerStore {
    id: string;
    user_id: string;
    slug: string;
    display_name: string;
    bio: string;
    avatar_url: string;
    banner_gradient: string;
    theme: Record<string, string>;
    is_approved: boolean;
    is_active: boolean;
    social_links: Record<string, string>;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    store_id: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    compare_at_price: number | null;
    image_url: string;
    image_emoji: string;
    category_id: string | null;
    category: string | null;
    tags: string[];
    is_visible: boolean;
    is_featured: boolean;
    is_digital: boolean;
    status: 'active' | 'draft';
    stock_count: number;
    sort_order: number;
    weight: number | null;
    sku: string | null;
    external_url: string;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface Order {
    id: string;
    store_id: string;
    customer_email: string;
    customer_name: string;
    customer_phone: string;
    status: OrderStatus;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    currency: string;
    shipping_address: Record<string, string>;
    notes: string;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string | null;
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
    created_at: string;
}

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

export interface Payment {
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    method: string;
    status: PaymentStatus;
    provider_reference: string;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export type AnalyticsEventType =
    | "page_view"
    | "product_click"
    | "add_to_cart"
    | "checkout_start"
    | "purchase"
    | "share_click"
    | "social_click"
    | "qr_scan";

export interface AnalyticsEvent {
    id: string;
    store_id: string;
    event_type: AnalyticsEventType;
    product_id: string | null;
    visitor_id: string;
    referrer: string;
    user_agent: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    created_at: string;
}

/* ── Realtime Event Types ───────────────────────── */

export type RealtimeEventType =
    | "PRODUCT_CREATED"
    | "PRODUCT_UPDATED"
    | "PRODUCT_DELETED"
    | "PRODUCT_REORDERED"
    | "ORDER_CREATED"
    | "ORDER_UPDATED"
    | "PAYMENT_CONFIRMED"
    | "PAYMENT_FAILED"
    | "INFLUENCER_APPROVED"
    | "INFLUENCER_SUSPENDED"
    | "ANALYTICS_EVENT"
    | "STORE_UPDATED";

export interface RealtimeEvent<T = unknown> {
    type: RealtimeEventType;
    payload: T;
    timestamp: string;
    store_id?: string;
}

/* ── Store Stats (from RPC) ─────────────────────── */

export interface StoreStats {
    total_orders: number;
    total_revenue: number;
    total_views: number;
    total_clicks: number;
    conversion_rate: number;
    recent_orders: Array<{
        id: string;
        customer_name: string;
        total: number;
        status: OrderStatus;
        created_at: string;
    }>;
}

export interface PlatformStats {
    total_influencers: number;
    approved_influencers: number;
    pending_influencers: number;
    total_orders: number;
    total_revenue: number;
    total_products: number;
    total_customers: number;
}

/* ── Cart Types ─────────────────────────────────── */

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface CheckoutData {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
}

/* ── Links & Theme Types ────────────────────────── */

export interface Theme {
    id: string;
    store_id: string;
    background_type: "flat" | "gradient" | "image" | "video";
    background_value: string;
    button_style: "rounded" | "glass" | "flat";
    font_family: string;
    button_color: string;
    text_color: string;
    created_at: string;
    updated_at: string;
}

export interface Link {
    id: string;
    store_id: string | null;
    user_id: string;
    title: string;
    url: string;
    short_slug: string | null;
    icon: string | null;
    thumbnail_url: string | null;
    position: number;
    is_visible: boolean;
    is_featured: boolean;
    click_count: number;
    created_at: string;
    updated_at: string;
}

export interface LinkClick {
    id: string;
    link_id: string;
    store_id: string | null;
    user_id: string | null;
    user_agent: string | null;
    ip_address: string | null;
    created_at: string;
}
