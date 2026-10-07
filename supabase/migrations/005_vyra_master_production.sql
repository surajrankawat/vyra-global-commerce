-- ====================================================================
-- VYRA — GLOBAL B2B + B2C COMMERCE PLATFORM & OPERATING SYSTEM
-- Migration 005: Master RBAC, B2C Cart, Categories, Reviews, Coupons & Disputes
-- ====================================================================

-- 1. EXTENDED ROLES & PERMISSIONS (RBAC 2.0)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Seed Standard Platform Roles
INSERT INTO public.roles (name, description) VALUES
  ('SUPER_ADMIN', 'Global platform master governance and system configuration'),
  ('ADMIN', 'Platform operations, verification, compliance, and dispute resolution'),
  ('MODERATOR', 'Content, listing, catalog, and review moderation'),
  ('SUPPORT_AGENT', 'Customer support, dispute intake, and ticketing assistance'),
  ('FINANCE_MANAGER', 'Settlements, payouts, commission audits, and refund handling'),
  ('MARKETING_MANAGER', 'Promotions, featured listings, and advertising approvals'),
  ('BUYER', 'Standard global buyer (B2B and B2C ordering, RFQ submission)'),
  ('SELLER', 'Verified commercial merchant and storefront owner'),
  ('MANUFACTURER', 'Factory operator with industrial tooling, MOQ, and lead time specs'),
  ('WHOLESALER', 'Bulk inventory distributor and tier-pricing trader'),
  ('RETAILER', 'Consumer goods seller with instant B2C fulfillment'),
  ('EXPORTER', 'International maritime/air trade shipper with custom documentation'),
  ('IMPORTER', 'Consignment recipient with customs and port clearance capabilities'),
  ('LOGISTICS_PARTNER', 'Freight forwarder, carrier, and 3PL tracking provider')
ON CONFLICT (name) DO NOTHING;

-- 2. HIERARCHICAL TAXONOMY & CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT DEFAULT 'Package',
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  product_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- 3. PRODUCT REVIEWS & REPUTATION ENGINE
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_country TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  seller_rating INTEGER CHECK (seller_rating >= 1 AND seller_rating <= 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  seller_reply TEXT,
  seller_replied_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'PENDING', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_seller ON public.product_reviews(seller_id);
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published product reviews"
  ON public.product_reviews FOR SELECT
  USING (status = 'PUBLISHED');

CREATE POLICY "Authenticated buyers can submit reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- 4. B2C SHOPPING CARTS & WISHLISTS
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  session_token TEXT UNIQUE,
  currency TEXT NOT NULL DEFAULT 'USD',
  applied_coupon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price NUMERIC(15,2) NOT NULL,
  selected_variant TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart"
  ON public.carts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist"
  ON public.wishlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. PROMOTIONS & COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC(15,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Standard Platform Coupons
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_until, is_active)
VALUES
  ('WELCOME10', '10% discount on first global trade order (up to $100)', 'percentage', 10, 50, 100, now(), now() + interval '1 year', true),
  ('GLOBALB2B', '$150 corporate rebate on bulk orders exceeding $1,000', 'fixed', 150, 1000, 150, now(), now() + interval '1 year', true),
  ('VYRA2026', '15% platform anniversary discount on all catalog orders', 'percentage', 15, 100, 200, now(), now() + interval '1 year', true)
ON CONFLICT (code) DO NOTHING;

-- 6. SUBSCRIPTION PLANS & ENTITLEMENTS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL UNIQUE CHECK (tier IN ('FREE', 'BASIC', 'PRO', 'BUSINESS', 'ENTERPRISE')),
  name TEXT NOT NULL,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  product_limit INTEGER NOT NULL DEFAULT 10,
  rfq_monthly_limit INTEGER NOT NULL DEFAULT 5,
  lead_access_limit INTEGER NOT NULL DEFAULT 20,
  has_verified_badge BOOLEAN NOT NULL DEFAULT false,
  has_dedicated_manager BOOLEAN NOT NULL DEFAULT false,
  has_ai_revenue_agent BOOLEAN NOT NULL DEFAULT false,
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.subscription_plans (tier, name, price_monthly, price_yearly, product_limit, rfq_monthly_limit, has_verified_badge, has_ai_revenue_agent)
VALUES
  ('FREE', 'Starter Trade', 0, 0, 10, 5, false, false),
  ('PRO', 'Global Exporter Pro', 149, 1490, 150, 60, true, true),
  ('ENTERPRISE', 'Conglomerate Elite', 499, 4990, 2500, 9999, true, true)
ON CONFLICT (tier) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  plan_tier TEXT NOT NULL REFERENCES public.subscription_plans(tier),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. SHIPMENTS & TRACKING TIMELINE
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  tracking_number TEXT NOT NULL,
  origin_city TEXT,
  origin_country TEXT,
  destination_city TEXT,
  destination_country TEXT,
  status TEXT NOT NULL DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'PICKED_UP', 'IN_TRANSIT', 'CUSTOMS_CLEARANCE', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION')),
  estimated_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. PLATFORM SETTINGS & GOVERNANCE
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (key, value)
VALUES
  ('marketplace_config', '{"commission_rate_percent": 3.5, "b2c_instant_checkout_enabled": true, "rfq_public_auto_match": true, "kyc_verification_mandate": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;
