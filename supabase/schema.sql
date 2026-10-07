-- ====================================================================
-- VYRA — GLOBAL BUSINESS & COMMERCE NETWORK (BUILD. CONNECT. SELL. GROW.)
-- Full PostgreSQL / Supabase Schema & Row-Level Security (RLS) Migration
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. BUSINESSES
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner_name TEXT,
  country TEXT NOT NULL,
  state TEXT,
  city TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  business_type TEXT NOT NULL, -- Manufacturer, Exporter, Importer, Wholesaler, Retailer, Ecommerce, Service
  industry TEXT NOT NULL,
  export_countries TEXT[] DEFAULT '{}',
  gst_number TEXT,
  iec_code TEXT,
  description TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'USD',
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own business"
  ON public.businesses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT NOT NULL,
  description TEXT,
  price NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  moq INTEGER DEFAULT 1,
  stock_quantity INTEGER DEFAULT 0,
  weight NUMERIC(10,2),
  dimensions TEXT,
  material TEXT,
  country_of_origin TEXT,
  hs_code TEXT,
  shipping_notes TEXT,
  payment_terms TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage products of own business"
  ON public.products FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 4. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage product images"
  ON public.product_images FOR ALL
  USING (product_id IN (
    SELECT p.id FROM public.products p
    JOIN public.businesses b ON p.business_id = b.id
    WHERE b.user_id = auth.uid()
  ))
  WITH CHECK (product_id IN (
    SELECT p.id FROM public.products p
    JOIN public.businesses b ON p.business_id = b.id
    WHERE b.user_id = auth.uid()
  ));

-- 5. LEADS
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  country TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  source TEXT DEFAULT 'Inbound',
  product_interest TEXT,
  estimated_deal_value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'New', -- New, Contacted, Qualified, Quotation Sent, Negotiation, Won, Lost
  lead_score INTEGER DEFAULT 50,
  score_tier TEXT DEFAULT 'Medium', -- High, Medium, Low
  ai_qualification JSONB,
  notes TEXT,
  last_contact TIMESTAMPTZ,
  next_follow_up TIMESTAMPTZ,
  assigned_user TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_business_id ON public.leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage leads of own business"
  ON public.leads FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 6. LEAD NOTES
CREATE TABLE IF NOT EXISTS public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage notes of own business leads"
  ON public.lead_notes FOR ALL
  USING (lead_id IN (
    SELECT l.id FROM public.leads l
    JOIN public.businesses b ON l.business_id = b.id
    WHERE b.user_id = auth.uid()
  ))
  WITH CHECK (lead_id IN (
    SELECT l.id FROM public.leads l
    JOIN public.businesses b ON l.business_id = b.id
    WHERE b.user_id = auth.uid()
  ));

-- 7. LEAD ACTIVITIES
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage activities of own business leads"
  ON public.lead_activities FOR ALL
  USING (lead_id IN (
    SELECT l.id FROM public.leads l
    JOIN public.businesses b ON l.business_id = b.id
    WHERE b.user_id = auth.uid()
  ))
  WITH CHECK (lead_id IN (
    SELECT l.id FROM public.leads l
    JOIN public.businesses b ON l.business_id = b.id
    WHERE b.user_id = auth.uid()
  ));

-- 8. QUOTATIONS
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL,
  seller_details JSONB NOT NULL,
  buyer_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_company TEXT,
  buyer_email TEXT,
  currency TEXT DEFAULT 'USD',
  subtotal NUMERIC(15,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  shipping_fee NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) DEFAULT 0,
  payment_terms TEXT,
  delivery_terms TEXT,
  validity_date DATE,
  status TEXT NOT NULL DEFAULT 'Draft', -- Draft, Sent, Viewed, Negotiation, Accepted, Rejected, Expired
  notes TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotations_business_id ON public.quotations(business_id);
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage quotations of own business"
  ON public.quotations FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 9. QUOTATION ITEMS
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(15,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage items of own business quotations"
  ON public.quotation_items FOR ALL
  USING (quotation_id IN (
    SELECT q.id FROM public.quotations q
    JOIN public.businesses b ON q.business_id = b.id
    WHERE b.user_id = auth.uid()
  ))
  WITH CHECK (quotation_id IN (
    SELECT q.id FROM public.quotations q
    JOIN public.businesses b ON q.business_id = b.id
    WHERE b.user_id = auth.uid()
  ));

-- 10. FOLLOW-UPS
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Completed, Rescheduled, Cancelled
  title TEXT NOT NULL,
  sequence_number INTEGER DEFAULT 1,
  message_draft TEXT,
  channel TEXT DEFAULT 'Email', -- Email, WhatsApp, Phone, Meeting
  notes TEXT,
  completed_at TIMESTAMPTZ,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_business_id ON public.follow_ups(business_id);
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage follow_ups of own business"
  ON public.follow_ups FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 11. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Confirmed, In Production, Shipped, Delivered, Cancelled
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'Pending', -- Pending, Partial, Paid, Refunded
  tracking_number TEXT,
  shipping_details JSONB,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_business_id ON public.orders(business_id);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage orders of own business"
  ON public.orders FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- follow_up_due, low_stock, new_lead, quote_status, order_status
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON public.notifications(business_id);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage notifications of own business"
  ON public.notifications FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 13. AI GENERATIONS
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL, -- revenue_agent, lead_qualify, buyer_discovery, health_check, chat
  prompt_summary TEXT,
  input_payload JSONB,
  output_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_business_id ON public.ai_generations(business_id);
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage AI generations of own business"
  ON public.ai_generations FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 14. BUYER REQUIREMENTS / RFQs (Marketplace foundation)
CREATE TABLE IF NOT EXISTS public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_company TEXT,
  buyer_country TEXT NOT NULL,
  buyer_email TEXT,
  buyer_phone TEXT,
  product_title TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC(15,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'units',
  target_price NUMERIC(15,2),
  currency TEXT DEFAULT 'USD',
  delivery_location TEXT NOT NULL,
  required_by_date DATE,
  specifications TEXT NOT NULL,
  payment_preference TEXT,
  status TEXT DEFAULT 'OPEN', -- OPEN, RESPONSES_RECEIVED, NEGOTIATION, AWARDED, CLOSED
  responses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open RFQs"
  ON public.rfqs FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create RFQs"
  ON public.rfqs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Creator can update their RFQ"
  ON public.rfqs FOR UPDATE
  USING (buyer_user_id = auth.uid());

-- 15. RFQ RESPONSES / PROPOSALS
CREATE TABLE IF NOT EXISTS public.rfq_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  seller_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  seller_business_name TEXT NOT NULL,
  seller_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offered_price NUMERIC(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  delivery_timeline_days INTEGER DEFAULT 14,
  moq NUMERIC(15,2) DEFAULT 1,
  proposal_notes TEXT NOT NULL,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rfq_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can manage their responses, buyers can view them"
  ON public.rfq_responses FOR ALL
  USING (
    seller_user_id = auth.uid() OR
    rfq_id IN (SELECT id FROM public.rfqs WHERE buyer_user_id = auth.uid())
  );

-- 16. WEBSITE BUILDER / STOREFRONTS
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  site_title TEXT NOT NULL,
  tagline TEXT,
  meta_description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  theme JSONB DEFAULT '{"primary_color":"#2563eb","accent_color":"#4f46e5","font_family":"Inter","layout_style":"modern","dark_mode":false}',
  sections JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT false,
  custom_domain TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published storefronts"
  ON public.stores FOR SELECT
  USING (is_published = true OR business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Owners can manage own store"
  ON public.stores FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 17. INTERNAL ADVERTISING PLATFORM
CREATE TABLE IF NOT EXISTS public.advertising_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_name TEXT,
  title TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- Sponsored Product, Sponsored Store, Featured RFQ, Search Banner
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  target_categories TEXT[] DEFAULT '{}',
  target_countries TEXT[] DEFAULT '{}',
  daily_budget NUMERIC(15,2) NOT NULL DEFAULT 10,
  total_budget NUMERIC(15,2) NOT NULL DEFAULT 100,
  currency TEXT DEFAULT 'USD',
  spend NUMERIC(15,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PENDING_REVIEW', -- DRAFT, PENDING_REVIEW, ACTIVE, PAUSED, COMPLETED, REJECTED
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  headline TEXT,
  ad_copy TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.advertising_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage their campaigns"
  ON public.advertising_campaigns FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 18. BUSINESS CHAT & CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_company TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  unread_count INTEGER DEFAULT 0,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR ALL
  USING (
    buyer_id = auth.uid() OR
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL, -- buyer, seller
  message TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view and send messages"
  ON public.messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE buyer_id = auth.uid() OR business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    )
  );

-- 19. RETURNS, REFUNDS & DISPUTES
CREATE TABLE IF NOT EXISTS public.order_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  refund_amount NUMERIC(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'REQUESTED', -- REQUESTED, APPROVED, REJECTED, PICKUP, RECEIVED, REFUNDED, CLOSED
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage their order returns"
  ON public.order_returns FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.order_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  dispute_type TEXT NOT NULL,
  raised_by TEXT NOT NULL, -- buyer, seller
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  claim_amount NUMERIC(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'OPEN', -- OPEN, UNDER_REVIEW, RESOLVED, ESCALATED, CLOSED
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.order_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can view disputes involving their orders"
  ON public.order_disputes FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- BUSINESS MEMBERS (Multi-tenant RBAC)
CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'SALES_REP', 'ACCOUNTANT', 'SUPPORT', 'VIEWER')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (business_id, user_id)
);

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members viewable by business users"
  ON public.business_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()) OR
    business_id IN (SELECT bm.business_id FROM public.business_members bm WHERE bm.user_id = auth.uid())
  );

CREATE POLICY "Business owners can manage members"
  ON public.business_members FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- BUYERS (B2B CRM & Directory)
CREATE TABLE IF NOT EXISTS public.buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  country TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  category TEXT NOT NULL,
  import_volume TEXT,
  target_products TEXT[] DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'Unverified' CHECK (verification_status IN ('Unverified', 'Verified', 'Vetted Enterprise')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage their buyers"
  ON public.buyers FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- INVENTORY (Stock management & alerts)
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  unit_cost NUMERIC(15,2) DEFAULT 0,
  warehouse_location TEXT,
  last_counted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, product_id)
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage their inventory"
  ON public.inventory FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- AI CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Intelligence Session',
  context_type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their AI conversations"
  ON public.ai_conversations FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  structured_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI messages in their conversations"
  ON public.ai_messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM public.ai_conversations WHERE business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  ))
  WITH CHECK (conversation_id IN (
    SELECT id FROM public.ai_conversations WHERE business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  ));

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can view their audit logs"
  ON public.audit_logs FOR SELECT
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Businesses can record audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- INDEXES FOR PRODUCTION QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_business_members_user ON public.business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_business ON public.business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_buyers_business ON public.buyers(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_business ON public.inventory(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_business ON public.ai_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_convo ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON public.audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Storage bucket for product images & documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access to product-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload to product-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- 21. BUSINESS LOCATIONS
CREATE TABLE IF NOT EXISTS public.business_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'Head Office',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  building TEXT,
  street TEXT,
  area TEXT,
  city TEXT NOT NULL,
  district TEXT,
  state_province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'US',
  timezone TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  opening_hours TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  is_public BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_locations_business ON public.business_locations(business_id);
ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage locations of own business"
  ON public.business_locations FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 22. GLOBAL MEDIA ASSETS
CREATE TABLE IF NOT EXISTS public.global_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  media_type TEXT NOT NULL, -- image, video, pdf, document, catalog, certificate, brochure, datasheet
  category TEXT,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT,
  storage_path TEXT,
  caption TEXT,
  alt_text TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  attached_entities JSONB DEFAULT '[]',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_global_media_business ON public.global_media_assets(business_id);
CREATE INDEX IF NOT EXISTS idx_global_media_type ON public.global_media_assets(media_type);
ALTER TABLE public.global_media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage media of own business"
  ON public.global_media_assets FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 23. SELLER PROFILES & VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  operational_status TEXT NOT NULL DEFAULT 'Active' CHECK (operational_status IN ('Active', 'Suspended', 'Inactive')),
  verification_status TEXT NOT NULL DEFAULT 'Unverified' CHECK (verification_status IN ('Unverified', 'Pending', 'Verified', 'Rejected')),
  verification_notes TEXT,
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moq INTEGER DEFAULT 1,
  manufacturing_capacity TEXT,
  trading_capacity TEXT,
  shipping_capabilities TEXT[] DEFAULT '{}',
  export_ports TEXT[] DEFAULT '{}',
  lead_time_days INTEGER DEFAULT 7,
  quality_certifications TEXT[] DEFAULT '{}',
  gallery_urls TEXT[] DEFAULT '{}',
  shop_photos_urls TEXT[] DEFAULT '{}',
  factory_photos_urls TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  catalog_urls TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_business_id ON public.seller_profiles(business_id);
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active published seller profiles"
  ON public.seller_profiles FOR SELECT
  USING (operational_status = 'Active');

CREATE POLICY "Business owners can manage own seller profile"
  ON public.seller_profiles FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.seller_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view and submit own verification evidence"
  ON public.seller_verifications FOR ALL
  USING (seller_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.seller_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Supplier',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')),
  invite_token TEXT NOT NULL UNIQUE,
  invited_by_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage their sent invitations"
  ON public.seller_invitations FOR ALL
  USING (inviter_business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (inviter_business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));



