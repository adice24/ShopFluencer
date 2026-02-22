-- ═══════════════════════════════════════════════════════════════
-- ShopFluence — Full SaaS Schema
-- Production-grade: RLS, Realtime, Audit, Commerce
-- Run AFTER 001_security_setup.sql
-- ═══════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 1. INFLUENCER STORES                                        │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.influencer_stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL DEFAULT '',
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    banner_gradient TEXT DEFAULT 'linear-gradient(135deg, hsl(68, 80%, 52%), hsl(236, 60%, 50%))',
    theme JSONB DEFAULT '{"primary": "#6366f1", "radius": "0.75rem", "font": "Inter"}',
    is_approved BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Slug must be URL-safe
ALTER TABLE public.influencer_stores
    ADD CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9_-]{1,30}[a-z0-9]$');

ALTER TABLE public.influencer_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_stores FORCE ROW LEVEL SECURITY;

-- Owner can read/update their own store
DROP POLICY IF EXISTS "store_select_own" ON public.influencer_stores;
CREATE POLICY "store_select_own" ON public.influencer_stores
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "store_update_own" ON public.influencer_stores;
CREATE POLICY "store_update_own" ON public.influencer_stores
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND is_approved = (SELECT s.is_approved FROM public.influencer_stores s WHERE s.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "store_insert_own" ON public.influencer_stores;
CREATE POLICY "store_insert_own" ON public.influencer_stores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public can read approved & active stores (for /{slug} pages)
DROP POLICY IF EXISTS "store_select_public" ON public.influencer_stores;
CREATE POLICY "store_select_public" ON public.influencer_stores
    FOR SELECT USING (is_approved = true AND is_active = true);

-- Admins can read all stores (role check via profiles table)
DROP POLICY IF EXISTS "store_select_admin" ON public.influencer_stores;
CREATE POLICY "store_select_admin" ON public.influencer_stores
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "store_update_admin" ON public.influencer_stores;
CREATE POLICY "store_update_admin" ON public.influencer_stores
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Enable Realtime on stores
ALTER PUBLICATION supabase_realtime ADD TABLE public.influencer_stores;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 2. CATEGORIES                                               │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "categories_select_all" ON public.categories
    FOR SELECT USING (true);

-- Only admins can manage categories
CREATE POLICY "categories_admin_insert" ON public.categories
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "categories_admin_update" ON public.categories
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 3. PRODUCTS                                                 │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.influencer_stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    compare_at_price DECIMAL(10,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
    image_url TEXT DEFAULT '',
    image_emoji TEXT DEFAULT '📦',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    stock_count INTEGER NOT NULL DEFAULT -1, -- -1 = unlimited
    sort_order INTEGER NOT NULL DEFAULT 0,
    external_url TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;

-- Store owner can CRUD their own products
CREATE POLICY "products_select_own" ON public.products
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid())
    );

CREATE POLICY "products_insert_own" ON public.products
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid())
    );

CREATE POLICY "products_update_own" ON public.products
    FOR UPDATE USING (
        store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid())
    );

CREATE POLICY "products_delete_own" ON public.products
    FOR DELETE USING (
        store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid())
    );

-- Public can read visible products from approved stores
CREATE POLICY "products_select_public" ON public.products
    FOR SELECT USING (
        is_visible = true
        AND store_id IN (
            SELECT id FROM public.influencer_stores WHERE is_approved = true AND is_active = true
        )
    );

-- Admins can read all products
CREATE POLICY "products_select_admin" ON public.products
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Enable Realtime on products (live storefront updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 4. ORDERS                                                   │
-- └─────────────────────────────────────────────────────────────┘

CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.influencer_stores(id) ON DELETE SET NULL NOT NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL DEFAULT '',
    customer_phone TEXT DEFAULT '',
    status order_status NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    shipping_address JSONB DEFAULT '{}',
    notes TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

-- Store owner can read their orders
CREATE POLICY "orders_select_own" ON public.orders
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid())
    );

-- Store owner can update order status
CREATE POLICY "orders_update_own" ON public.orders
    FOR UPDATE USING (
        store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid())
    );

-- Anonymous/authenticated can create orders (checkout)
CREATE POLICY "orders_insert_anyone" ON public.orders
    FOR INSERT WITH CHECK (true);

-- Admins can read all orders
CREATE POLICY "orders_select_admin" ON public.orders
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "orders_update_admin" ON public.orders
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Enable Realtime on orders (live notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 5. ORDER ITEMS                                              │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;

-- Same access as orders (join-based)
CREATE POLICY "order_items_select_own" ON public.order_items
    FOR SELECT USING (
        order_id IN (
            SELECT o.id FROM public.orders o
            JOIN public.influencer_stores s ON o.store_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

CREATE POLICY "order_items_insert_anyone" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "order_items_select_admin" ON public.order_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 6. PAYMENTS                                                 │
-- └─────────────────────────────────────────────────────────────┘

CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    method TEXT NOT NULL DEFAULT 'card',
    status payment_status NOT NULL DEFAULT 'pending',
    provider_reference TEXT DEFAULT '',  -- Stripe payment_intent ID
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON public.payments
    FOR SELECT USING (
        order_id IN (
            SELECT o.id FROM public.orders o
            JOIN public.influencer_stores s ON o.store_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

CREATE POLICY "payments_insert_anyone" ON public.payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "payments_select_admin" ON public.payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 7. ANALYTICS EVENTS (Real-time Tracking)                   │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.influencer_stores(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'page_view', 'product_click', 'add_to_cart',
        'checkout_start', 'purchase', 'share_click',
        'social_click', 'qr_scan'
    )),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    visitor_id TEXT DEFAULT '',  -- anonymous fingerprint (no PII)
    referrer TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events FORCE ROW LEVEL SECURITY;

-- Store owner can read their analytics
CREATE POLICY "analytics_select_own" ON public.analytics_events
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid())
    );

-- Anyone can insert analytics events (tracking)
CREATE POLICY "analytics_insert_anyone" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

-- No updates/deletes (immutable event log)
CREATE POLICY "analytics_no_update" ON public.analytics_events
    FOR UPDATE USING (false);
CREATE POLICY "analytics_no_delete" ON public.analytics_events
    FOR DELETE USING (false);

-- Admins can read all analytics
CREATE POLICY "analytics_select_admin" ON public.analytics_events
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Enable Realtime on analytics (live dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 8. INDEXES FOR PERFORMANCE                                  │
-- └─────────────────────────────────────────────────────────────┘

CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.influencer_stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.influencer_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_approved ON public.influencer_stores(is_approved, is_active);

CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_visible ON public.products(is_visible, store_id);
CREATE INDEX IF NOT EXISTS idx_products_sort ON public.products(store_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_analytics_store ON public.analytics_events(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_events(event_type, store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_product ON public.analytics_events(product_id);

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 9. HELPER FUNCTIONS                                         │
-- └─────────────────────────────────────────────────────────────┘

-- Get store stats for dashboard
CREATE OR REPLACE FUNCTION public.get_store_stats(p_store_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_orders', (SELECT COUNT(*) FROM orders WHERE store_id = p_store_id),
        'total_revenue', (SELECT COALESCE(SUM(total), 0) FROM orders WHERE store_id = p_store_id AND status NOT IN ('cancelled', 'refunded')),
        'total_views', (SELECT COUNT(*) FROM analytics_events WHERE store_id = p_store_id AND event_type = 'page_view'),
        'total_clicks', (SELECT COUNT(*) FROM analytics_events WHERE store_id = p_store_id AND event_type = 'product_click'),
        'conversion_rate', (
            CASE
                WHEN (SELECT COUNT(*) FROM analytics_events WHERE store_id = p_store_id AND event_type = 'page_view') > 0
                THEN ROUND(
                    (SELECT COUNT(*)::DECIMAL FROM orders WHERE store_id = p_store_id AND status NOT IN ('cancelled', 'refunded'))
                    / (SELECT COUNT(*)::DECIMAL FROM analytics_events WHERE store_id = p_store_id AND event_type = 'page_view')
                    * 100, 2
                )
                ELSE 0
            END
        ),
        'recent_orders', (
            SELECT COALESCE(json_agg(row_to_json(o)), '[]'::json)
            FROM (
                SELECT id, customer_name, total, status, created_at
                FROM orders WHERE store_id = p_store_id
                ORDER BY created_at DESC LIMIT 5
            ) o
        )
    ) INTO result;
    RETURN result;
END;
$$;

-- Get platform stats for admin
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    -- Verify caller is admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT json_build_object(
        'total_influencers', (SELECT COUNT(*) FROM influencer_stores),
        'approved_influencers', (SELECT COUNT(*) FROM influencer_stores WHERE is_approved = true),
        'pending_influencers', (SELECT COUNT(*) FROM influencer_stores WHERE is_approved = false),
        'total_orders', (SELECT COUNT(*) FROM orders),
        'total_revenue', (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status NOT IN ('cancelled', 'refunded')),
        'total_products', (SELECT COUNT(*) FROM products),
        'total_customers', (SELECT COUNT(DISTINCT customer_email) FROM orders)
    ) INTO result;
    RETURN result;
END;
$$;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 10. TRIGGERS                                                │
-- └─────────────────────────────────────────────────────────────┘

-- Auto-update timestamps
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER stores_updated_at BEFORE UPDATE ON public.influencer_stores
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 11. GRANTS                                                  │
-- └─────────────────────────────────────────────────────────────┘

-- Grant read access to all tables for authenticated users (RLS handles the rest)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.influencer_stores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.categories TO authenticated;

-- Anon users can read public data and create orders/analytics
GRANT SELECT ON public.influencer_stores TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;
GRANT INSERT ON public.payments TO anon;
GRANT INSERT ON public.analytics_events TO anon;

-- ═══════════════════════════════════════════════════════════════
-- SCHEMA COMPLETE — Run verification:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- ═══════════════════════════════════════════════════════════════
