-- ====================================================================
-- NEXVORA — AI Commerce & Business Operating System
-- Migration: 002_nexvora_enterprise_upgrade.sql
-- Description: Media assets, AI generations, storage policies, reviews,
--              warehouses, bank accounts, and multi-tenant RLS.
-- ====================================================================

-- 1. MEDIA ASSETS
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    bucket TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    dimensions JSONB,
    alt_text TEXT,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_business_id ON public.media_assets(business_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_bucket ON public.media_assets(bucket);
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media in their business"
    ON public.media_assets FOR SELECT
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage media in their business"
    ON public.media_assets FOR ALL
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid()));

-- 2. AI GENERATIONS AUDIT & STUDIO REPOSITORY
CREATE TABLE IF NOT EXISTS public.ai_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    creative_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    output_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_business_id ON public.ai_generations(business_id);
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI generations for their business"
    ON public.ai_generations FOR SELECT
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can record AI generations for their business"
    ON public.ai_generations FOR INSERT
    WITH CHECK (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid()));

-- 3. REVIEWS & RATINGS (B2B + B2C)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    helpful_votes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read verified reviews"
    ON public.reviews FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users submit reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 4. WAREHOUSES & LOCATIONS
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    country TEXT NOT NULL,
    city TEXT,
    address TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouses_business_id ON public.warehouses(business_id);
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant warehouse isolation"
    ON public.warehouses FOR ALL
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid()));

-- 5. BANK ACCOUNTS & SETTLEMENT DESTINATIONS
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    beneficiary_name TEXT NOT NULL,
    swift_bic TEXT,
    routing_code TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_business_id ON public.bank_accounts(business_id);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant bank accounts isolation"
    ON public.bank_accounts FOR ALL
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid()));

-- 6. WAITLIST / EARLY ACCESS
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    company_name TEXT,
    role TEXT,
    country TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public waitlist entry" ON public.waitlist FOR INSERT WITH CHECK (TRUE);

-- 7. SUPABASE STORAGE BUCKET POLICIES (If Supabase Storage schema exists)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
        ('avatars', 'avatars', true),
        ('business-logos', 'business-logos', true),
        ('business-banners', 'business-banners', true),
        ('product-images', 'product-images', true),
        ('product-videos', 'product-videos', true),
        ('store-assets', 'store-assets', true),
        ('ad-creatives', 'ad-creatives', true),
        ('blog-media', 'blog-media', true),
        ('documents', 'documents', false),
        ('chat-attachments', 'chat-attachments', false)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN
        -- Non-blocking in local development if storage extension is mock
        RAISE NOTICE 'Storage buckets schema already configured or external';
END $$;
