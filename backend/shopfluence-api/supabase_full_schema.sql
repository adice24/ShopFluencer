-- ═══════════════════════════════════════════════════════════════
-- ShopFluence — Complete Database Schema
-- Run this ENTIRE script in Supabase SQL Editor (one shot)
-- ═══════════════════════════════════════════════════════════════

-- ───────────────── ENUMS ─────────────────

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AFFILIATE', 'BRAND');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL');
CREATE TYPE "InfluencerTier" AS ENUM ('NANO', 'MICRO', 'MID', 'MACRO', 'MEGA');
CREATE TYPE "BrandStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED');
CREATE TYPE "ProductType" AS ENUM ('PHYSICAL', 'DIGITAL');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'NEEDS_MODIFICATION', 'OUT_OF_STOCK', 'DISCONTINUED');
CREATE TYPE "MarginType" AS ENUM ('PERCENT', 'FIXED');
CREATE TYPE "StorefrontStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DISABLED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'FAILED');
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET', 'COD');
CREATE TYPE "PaymentGateway" AS ENUM ('RAZORPAY', 'STRIPE', 'CASHFREE', 'MANUAL');
CREATE TYPE "ConversionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID_OUT', 'CANCELLED');
CREATE TYPE "EventType" AS ENUM ('STOREFRONT_VIEW', 'PRODUCT_VIEW', 'PRODUCT_CLICK', 'ADD_TO_CART', 'CHECKOUT_START', 'PURCHASE', 'SHARE');

-- ───────────────── TABLES ─────────────────

-- 1. USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role "UserRole" NOT NULL DEFAULT 'AFFILIATE',
  status "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 2. REFRESH TOKENS
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(500) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent VARCHAR(500),
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- 3. INFLUENCER PROFILES
CREATE TABLE influencer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(150) NOT NULL,
  bio TEXT,
  tier "InfluencerTier" NOT NULL DEFAULT 'NANO',
  instagram_handle VARCHAR(100),
  youtube_handle VARCHAR(100),
  tiktok_handle VARCHAR(100),
  twitter_handle VARCHAR(100),
  website_url TEXT,
  follower_count INT NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  approved_at TIMESTAMPTZ,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_influencer_profiles_tier ON influencer_profiles(tier);
CREATE INDEX idx_influencer_profiles_verified ON influencer_profiles(is_verified);

-- 4. CATEGORIES
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active_sort ON categories(is_active, sort_order);

-- 5. BRANDS
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(170) UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  logo_url TEXT,
  website_url TEXT,
  contact_email VARCHAR(255),
  business_type VARCHAR(100),
  gst_number VARCHAR(20),
  contact_person VARCHAR(150),
  phone_number VARCHAR(20),
  business_address TEXT,
  status "BrandStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  is_active BOOLEAN NOT NULL DEFAULT false,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_status ON brands(status);

-- 6. INFLUENCER BRANDS (join table)
CREATE TABLE influencer_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(influencer_id, brand_id)
);
CREATE INDEX idx_influencer_brands_influencer ON influencer_brands(influencer_id);
CREATE INDEX idx_influencer_brands_brand ON influencer_brands(brand_id);

-- 7. PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  type "ProductType" NOT NULL DEFAULT 'PHYSICAL',
  status "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  base_price DECIMAL(12,2) NOT NULL,
  compare_at_price DECIMAL(12,2),
  cost_price DECIMAL(12,2),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  category_id UUID NOT NULL REFERENCES categories(id),
  brand_id UUID NOT NULL REFERENCES brands(id),
  affiliate_margin DECIMAL(12,2) NOT NULL DEFAULT 0,
  margin_type "MarginType" NOT NULL DEFAULT 'PERCENT',
  max_discount DECIMAL(5,2) NOT NULL DEFAULT 0,
  delivery_availability VARCHAR(200),
  video_url TEXT,
  marketing_materials JSONB DEFAULT '[]',
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  weight DECIMAL(8,2),
  rejection_reason TEXT,
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  total_sold INT NOT NULL DEFAULT 0,
  avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_status_featured ON products(status, is_featured);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_base_price ON products(base_price);
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- 8. PRODUCT VARIANTS
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  compare_at_price DECIMAL(12,2),
  cost_price DECIMAL(12,2),
  stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  weight DECIMAL(8,2),
  barcode VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  attributes JSONB NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_active_stock ON product_variants(is_active, stock);

-- 9. PRODUCT IMAGES
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_images_product_sort ON product_images(product_id, sort_order);

-- 10. STOREFRONTS
CREATE TABLE storefronts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID UNIQUE NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  tagline VARCHAR(300),
  description TEXT,
  display_name VARCHAR(200),
  avatar_url TEXT,
  theme JSONB DEFAULT '{}',
  status "StorefrontStatus" NOT NULL DEFAULT 'DRAFT',
  theme_color VARCHAR(7),
  banner_url TEXT,
  logo_url TEXT,
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  custom_css TEXT,
  total_views INT NOT NULL DEFAULT 0,
  total_orders INT NOT NULL DEFAULT 0,
  total_revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_storefronts_slug ON storefronts(slug);
CREATE INDEX idx_storefronts_status ON storefronts(status);

-- 11. STOREFRONT PRODUCTS
CREATE TABLE storefront_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID NOT NULL REFERENCES storefronts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  custom_note VARCHAR(500),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(storefront_id, product_id)
);
CREATE INDEX idx_storefront_products_sort ON storefront_products(storefront_id, sort_order);

-- 12. ORDERS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(30) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  status "OrderStatus" NOT NULL DEFAULT 'PENDING',
  subtotal DECIMAL(14,2) NOT NULL,
  tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  shipping_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(14,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  shipping_name VARCHAR(200),
  shipping_email VARCHAR(255),
  shipping_phone VARCHAR(20),
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_zip VARCHAR(20),
  shipping_country VARCHAR(2),
  tracking_number VARCHAR(100),
  tracking_url TEXT,
  notes TEXT,
  cancel_reason TEXT,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 13. ORDER ITEMS
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name VARCHAR(255) NOT NULL,
  variant_name VARCHAR(255),
  sku VARCHAR(100),
  unit_price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(14,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- 14. PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  idempotency_key VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
  method "PaymentMethod",
  gateway "PaymentGateway" NOT NULL DEFAULT 'RAZORPAY',
  gateway_payment_id VARCHAR(255),
  gateway_order_id VARCHAR(255),
  gateway_signature VARCHAR(500),
  gateway_response JSONB,
  refund_amount DECIMAL(14,2),
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  failure_reason TEXT,
  attempts INT NOT NULL DEFAULT 1,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_idempotency ON payments(idempotency_key);
CREATE INDEX idx_payments_gateway_payment ON payments(gateway_payment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- 15. AFFILIATE CLICKS
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id),
  storefront_id UUID NOT NULL REFERENCES storefronts(id),
  visitor_id VARCHAR(100) NOT NULL,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  referrer_url TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_affiliate_clicks_influencer ON affiliate_clicks(influencer_id);
CREATE INDEX idx_affiliate_clicks_storefront ON affiliate_clicks(storefront_id);
CREATE INDEX idx_affiliate_clicks_visitor ON affiliate_clicks(visitor_id);
CREATE INDEX idx_affiliate_clicks_created_at ON affiliate_clicks(created_at);

-- 16. AFFILIATE CONVERSIONS
CREATE TABLE affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id),
  click_id UUID,
  status "ConversionStatus" NOT NULL DEFAULT 'PENDING',
  order_amount DECIMAL(14,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(14,2) NOT NULL,
  paid_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_affiliate_conversions_influencer ON affiliate_conversions(influencer_id);
CREATE INDEX idx_affiliate_conversions_status ON affiliate_conversions(status);
CREATE INDEX idx_affiliate_conversions_created_at ON affiliate_conversions(created_at);

-- 17. ANALYTICS EVENTS
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type "EventType" NOT NULL,
  influencer_id UUID REFERENCES influencer_profiles(id),
  storefront_slug VARCHAR(100),
  product_id UUID,
  visitor_id VARCHAR(100) NOT NULL,
  session_id VARCHAR(100),
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  referrer VARCHAR(500),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_influencer ON analytics_events(influencer_id);
CREATE INDEX idx_analytics_events_storefront ON analytics_events(storefront_slug);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_visitor ON analytics_events(visitor_id);
CREATE INDEX idx_analytics_events_type_created ON analytics_events(event_type, created_at);

-- 18. ANALYTICS DAILY AGGREGATES
CREATE TABLE analytics_daily_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  influencer_id UUID,
  storefront_slug VARCHAR(100),
  total_views INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  product_clicks INT NOT NULL DEFAULT 0,
  add_to_carts INT NOT NULL DEFAULT 0,
  orders INT NOT NULL DEFAULT 0,
  revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, influencer_id, storefront_slug)
);
CREATE INDEX idx_analytics_daily_date ON analytics_daily_aggregates(date);
CREATE INDEX idx_analytics_daily_influencer ON analytics_daily_aggregates(influencer_id, date);

-- 19. AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 20. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read ON notifications(read);

-- 21. CONTENT IDEAS
CREATE TABLE content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_area VARCHAR(100) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  hook TEXT NOT NULL,
  cta TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  is_saved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_ideas_user ON content_ideas(user_id);
CREATE INDEX idx_content_ideas_saved ON content_ideas(is_saved);
CREATE INDEX idx_content_ideas_created_at ON content_ideas(created_at);

-- 22. SHORT LINKS
CREATE TABLE short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  original_url TEXT NOT NULL,
  short_code VARCHAR(50) UNIQUE NOT NULL,
  clicks INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_short_links_user ON short_links(user_id);
CREATE INDEX idx_short_links_code ON short_links(short_code);
CREATE INDEX idx_short_links_created_at ON short_links(created_at);

-- 23. LINK CLICKS
CREATE TABLE link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id UUID NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  referrer VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_link_clicks_link ON link_clicks(short_link_id);
CREATE INDEX idx_link_clicks_created_at ON link_clicks(created_at);

-- 24. PLATFORM SETTINGS
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────── PRISMA MIGRATIONS TABLE ─────────────────
-- This tells Prisma it's already been set up (prevents migration conflicts)
CREATE TABLE IF NOT EXISTS _prisma_migrations (
  id VARCHAR(36) PRIMARY KEY,
  checksum VARCHAR(64) NOT NULL,
  finished_at TIMESTAMPTZ,
  migration_name VARCHAR(255) NOT NULL,
  logs TEXT,
  rolled_back_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_steps_count INT NOT NULL DEFAULT 0
);

-- ───────────────── RLS PERMISSIONS ─────────────────
-- Grant Supabase roles full access to public schema tables

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ───────────────── SEED DATA ─────────────────
-- Default categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Fashion & Accessories', 'fashion-accessories', 'Clothing, jewelry, bags and more', 1),
  ('Health & Wellness', 'health-wellness', 'Supplements, fitness, and wellness products', 2),
  ('Beauty & Cosmetics', 'beauty-cosmetics', 'Makeup, skincare and beauty products', 3),
  ('Electronics & Gadgets', 'electronics-gadgets', 'Tech products and accessories', 4),
  ('Home & Kitchen', 'home-kitchen', 'Home decor and kitchen essentials', 5),
  ('Fitness Equipment', 'fitness-equipment', 'Gym gear and fitness accessories', 6),
  ('Digital Products', 'digital-products', 'Courses, ebooks, and software', 7),
  ('Travel & Leisure', 'travel-leisure', 'Travel accessories and experiences', 8);

-- Default platform settings
INSERT INTO platform_settings (key, value) VALUES
  ('platform_fee', '"5"'),
  ('min_payout', '"500"');

-- ───────────────── STORAGE BUCKET ─────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');
CREATE POLICY "Allow authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Allow authenticated update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Allow authenticated delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- ═══════════════════════════════════════════════════════════════
-- DONE! All tables, indexes, seeds and permissions are ready.
-- ═══════════════════════════════════════════════════════════════
