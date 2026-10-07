-- ====================================================================
-- MS NEXUS ONE — ENTERPRISE DATABASE MIGRATION SCRIPT
-- Version: 001_initial_schema.sql
-- Description: Complete PostgreSQL schema, multi-tenant RBAC, RLS policies,
--              triggers, and performance indexes for Supabase.
-- ====================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Helper function: updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. BUSINESSES (Tenants)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    owner_name TEXT,
    country TEXT NOT NULL DEFAULT 'India',
    state TEXT,
    city TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    business_type TEXT NOT NULL DEFAULT 'Manufacturer',
    industry TEXT NOT NULL DEFAULT 'B2B Commerce',
    export_countries TEXT[] DEFAULT '{}',
    target_countries TEXT[] DEFAULT '{}',
    target_buyer_types TEXT[] DEFAULT '{}',
    gst_number TEXT,
    iec_code TEXT,
    description TEXT,
    logo_url TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.roles (id, name, description) VALUES
    ('OWNER', 'Business Owner', 'Full control over business, financial, team, and settings'),
    ('ADMIN', 'Administrator', 'Business operations, team invitations, and catalog management'),
    ('MANAGER', 'Operations Manager', 'Full commercial operations management'),
    ('SALES', 'Sales Representative', 'Manages leads, buyers, quotations, and follow-ups'),
    ('FINANCE', 'Finance & Billing', 'Manages invoices, bank accounts, expenses, and payouts'),
    ('INVENTORY', 'Inventory Specialist', 'Manages products, stocks, and warehouse movements'),
    ('SUPPORT', 'Customer Support', 'Handles buyer questions and order tracking'),
    ('VIEWER', 'Read-Only Viewer', 'Auditor or stakeholder view without edit permissions')
ON CONFLICT (id) DO NOTHING;

-- 6. BUSINESS MEMBERS (Multi-tenant membership and RBAC)
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL REFERENCES public.roles(id) DEFAULT 'MEMBER',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- 7. TENANT VALIDATION HELPER FUNCTION FOR RLS
CREATE OR REPLACE FUNCTION is_business_member(biz_id UUID, required_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF required_roles IS NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.business_members
            WHERE business_id = biz_id
              AND user_id = auth.uid()
              AND status = 'active'
        ) OR EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = biz_id AND (user_id = auth.uid() OR owner_id = auth.uid())
        );
    ELSE
        RETURN EXISTS (
            SELECT 1 FROM public.business_members
            WHERE business_id = biz_id
              AND user_id = auth.uid()
              AND status = 'active'
              AND role = ANY(required_roles)
        ) OR EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = biz_id AND (user_id = auth.uid() OR owner_id = auth.uid())
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, name)
);

-- 9. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    unit TEXT DEFAULT 'pcs',
    moq INTEGER NOT NULL DEFAULT 1,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    lead_time_days INTEGER DEFAULT 14,
    weight NUMERIC(10, 2),
    dimensions TEXT,
    material TEXT,
    country_of_origin TEXT,
    hs_code TEXT,
    shipping_notes TEXT,
    payment_terms TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    images TEXT[] DEFAULT '{}',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PRODUCT IMAGES (Supabase Storage metadata)
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    file_size_bytes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. INVENTORY & MOVEMENTS
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    available_stock INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER NOT NULL DEFAULT 0,
    reorder_threshold INTEGER NOT NULL DEFAULT 5,
    warehouse_location TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment', 'reserved', 'released')),
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    reference_order_id UUID,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    country TEXT NOT NULL DEFAULT 'International',
    address TEXT,
    gst_tax_id TEXT,
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    orders_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. BUYERS & BUYER REQUIREMENTS
CREATE TABLE IF NOT EXISTS public.buyers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.buyer_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES public.buyers(id) ON DELETE SET NULL,
    buyer_name TEXT NOT NULL,
    buyer_country TEXT NOT NULL,
    product_category TEXT NOT NULL,
    description TEXT NOT NULL,
    target_price NUMERIC(12, 2),
    currency TEXT NOT NULL DEFAULT 'USD',
    moq_requirement INTEGER,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Matched')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.buyer_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT,
    email TEXT,
    phone TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. LEADS / CRM
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT DEFAULT 'Direct Buyer',
    country TEXT DEFAULT 'International',
    city TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    source TEXT NOT NULL DEFAULT 'Direct Inquiry',
    product_interest TEXT,
    estimated_deal_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Quotation Sent', 'Negotiation', 'Won', 'Lost')),
    lead_score INTEGER NOT NULL DEFAULT 50,
    score_tier TEXT NOT NULL DEFAULT 'Medium' CHECK (score_tier IN ('High', 'Medium', 'Low')),
    ai_qualification JSONB DEFAULT '{}'::jsonb,
    qualification_notes TEXT,
    notes TEXT,
    last_contact TIMESTAMPTZ,
    next_follow_up TIMESTAMPTZ,
    assigned_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_name TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. QUOTATIONS & ITEMS
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL,
    seller_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    buyer_id UUID REFERENCES public.buyers(id) ON DELETE SET NULL,
    buyer_name TEXT NOT NULL,
    buyer_company TEXT,
    buyer_email TEXT,
    buyer_country TEXT,
    buyer_phone TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_terms TEXT,
    delivery_terms TEXT,
    validity_date DATE,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Viewed', 'Negotiation', 'Accepted', 'Rejected', 'Expired')),
    notes TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, quote_number)
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- 16. FOLLOW-UPS
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    lead_name TEXT,
    lead_company TEXT,
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    quote_number TEXT,
    scheduled_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Rescheduled', 'Cancelled', 'Missed')),
    title TEXT NOT NULL,
    sequence_number INTEGER NOT NULL DEFAULT 1,
    message_draft TEXT,
    channel TEXT NOT NULL DEFAULT 'Email' CHECK (channel IN ('Email', 'WhatsApp', 'Phone', 'Meeting')),
    notes TEXT,
    completed_at TIMESTAMPTZ,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. ORDERS & ITEMS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_company TEXT,
    buyer_name TEXT,
    buyer_company TEXT,
    order_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN (
        'Pending', 'Confirmed', 'Order Confirmed', 'Payment Received', 
        'In Production', 'Quality Check', 'Packaging', 'Dispatched', 
        'In Transit', 'Shipped', 'Delivered', 'Cancelled'
    )),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN (
        'Pending', 'Advance Paid', 'Partial', 'Paid', 'Fully Paid', 'Refunded'
    )),
    tracking_number TEXT,
    carrier TEXT,
    bl_number TEXT,
    container_number TEXT,
    production_notes TEXT,
    shipping_notes TEXT,
    items_summary TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, order_number)
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. INVOICES & ITEMS
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_company TEXT,
    customer_email TEXT,
    customer_address TEXT,
    customer_tax_id TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'Draft' CHECK (payment_status IN (
        'Draft', 'Issued', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'
    )),
    due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- 19. PAYMENTS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    provider TEXT NOT NULL,
    provider_intent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    gateway_fee NUMERIC(10, 2) DEFAULT 0.00,
    raw_response JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    last4 TEXT,
    brand TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. BANK ACCOUNTS, TRANSACTIONS & PAYOUTS
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    account_holder_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'current',
    country TEXT NOT NULL DEFAULT 'India',
    currency TEXT NOT NULL DEFAULT 'USD',
    provider TEXT NOT NULL DEFAULT 'Direct_Wire',
    last4 TEXT NOT NULL, -- Only last 4 digits stored
    routing_or_ifsc_prefix TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_verification', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('inflow', 'outflow', 'fee', 'tax', 'payout')),
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    reference_number TEXT,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'settled' CHECK (status IN ('settled', 'pending', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
    bank_name TEXT,
    account_last4 TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    provider TEXT NOT NULL DEFAULT 'Stripe_Payouts',
    provider_reference TEXT,
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 21. EXPENSES & CATEGORIES
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE(business_id, name)
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    receipt_url TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'enterprise_pro',
    status TEXT NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. DOCUMENTS & VERSIONS
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. AI CONVERSATIONS & GENERATIONS
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    generation_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    output_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 27. INTEGRATIONS & METADATA
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    is_configured BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'inactive',
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, provider)
);

CREATE TABLE IF NOT EXISTS public.integration_credentials_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    configured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    has_webhook BOOLEAN NOT NULL DEFAULT FALSE
);

-- 28. SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    default_currency TEXT NOT NULL DEFAULT 'USD',
    invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
    quote_prefix TEXT NOT NULL DEFAULT 'MSN-',
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user_biz ON public.business_members(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_leads_business_id ON public.leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_business_id ON public.quotations(business_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON public.orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_biz_date ON public.bank_transactions(business_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_biz_created ON public.audit_logs(business_id, created_at DESC);

-- ====================================================================
-- UPDATED_AT TRIGGERS
-- ====================================================================
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: users can see and update only their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Businesses: members can view their businesses; creators can insert
CREATE POLICY "Members can view their business" ON public.businesses FOR SELECT USING (is_business_member(id));
CREATE POLICY "Owners and admins can update business" ON public.businesses FOR UPDATE USING (is_business_member(id, ARRAY['OWNER', 'ADMIN']));
CREATE POLICY "Users can create business" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

-- 3. Business Members
CREATE POLICY "Members can view team members" ON public.business_members FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Owners and admins can manage members" ON public.business_members FOR ALL USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN']));

-- 4. Products & Inventory: Read for all members, write for Owner/Admin/Manager/Inventory
CREATE POLICY "Tenant read products" ON public.products FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Tenant write products" ON public.products FOR ALL USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY']));

CREATE POLICY "Tenant read inventory" ON public.inventory FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Tenant write inventory" ON public.inventory FOR ALL USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY']));

CREATE POLICY "Tenant read inventory movements" ON public.inventory_movements FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Tenant write inventory movements" ON public.inventory_movements FOR INSERT WITH CHECK (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY']));

-- 5. CRM & Leads: Read for members, write for Owner/Admin/Manager/Sales
CREATE POLICY "Tenant read leads" ON public.leads FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Tenant write leads" ON public.leads FOR ALL USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'SALES']));

CREATE POLICY "Tenant read lead notes" ON public.lead_notes FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Tenant write lead notes" ON public.lead_notes FOR ALL USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'SALES']));

CREATE POLICY "Tenant read lead activities" ON public.lead_activities FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Tenant write lead activities" ON public.lead_activities FOR INSERT WITH CHECK (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'SALES']));

-- 6. Quotations: Read for members, write for Owner/Admin/Manager/Sales
CREATE POLICY "Tenant read quotations" ON public.quotations FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Tenant write quotations" ON public.quotations FOR ALL USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'SALES']));

-- 7. Orders: Read for members, write for Owner/Admin/Manager/Sales/Finance
CREATE POLICY "Tenant read orders" ON public.orders FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Tenant write orders" ON public.orders FOR ALL USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE']));

-- 8. Invoices, Banking, Payouts: Strictly restricted to OWNER, ADMIN, and FINANCE
CREATE POLICY "Tenant read invoices" ON public.invoices FOR SELECT USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'FINANCE', 'VIEWER']));
CREATE POLICY "Tenant write invoices" ON public.invoices FOR ALL USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'FINANCE']));

CREATE POLICY "Tenant read bank accounts" ON public.bank_accounts FOR SELECT USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'FINANCE']));
CREATE POLICY "Tenant write bank accounts" ON public.bank_accounts FOR ALL USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'FINANCE']));

CREATE POLICY "Tenant read payouts" ON public.payouts FOR SELECT USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'FINANCE']));
CREATE POLICY "Tenant write payouts" ON public.payouts FOR ALL USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'FINANCE']));

CREATE POLICY "Tenant read expenses" ON public.expenses FOR SELECT USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'FINANCE']));
CREATE POLICY "Tenant write expenses" ON public.expenses FOR ALL USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'FINANCE']));

-- 9. Documents & Audit logs
CREATE POLICY "Tenant read documents" ON public.documents FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Tenant write documents" ON public.documents FOR ALL USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER']));

CREATE POLICY "Tenant read audit logs" ON public.audit_logs FOR SELECT USING (is_business_member(business_id, ARRAY['OWNER', 'ADMIN']));
CREATE POLICY "Tenant insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (is_business_member(business_id));
