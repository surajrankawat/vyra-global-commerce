-- ====================================================================
-- VYRA — GLOBAL BUSINESS & COMMERCE NETWORK
-- Migration 004: Sellers Section, Verification Engine & Operational Management
-- ====================================================================

-- 1. SELLER PROFILES (Enriches businesses with seller manufacturing, shipping & media capabilities)
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
CREATE INDEX IF NOT EXISTS idx_seller_profiles_verification ON public.seller_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_operational ON public.seller_profiles(operational_status);
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active published seller profiles"
  ON public.seller_profiles FOR SELECT
  USING (operational_status = 'Active');

CREATE POLICY "Business owners can manage own seller profile"
  ON public.seller_profiles FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 2. SELLER VERIFICATION EVIDENCE
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

CREATE INDEX IF NOT EXISTS idx_seller_verifications_seller ON public.seller_verifications(seller_id);
ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view and submit own verification evidence"
  ON public.seller_verifications FOR ALL
  USING (seller_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 3. SELLER INVITATIONS
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

CREATE INDEX IF NOT EXISTS idx_seller_invitations_token ON public.seller_invitations(invite_token);
ALTER TABLE public.seller_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage their sent invitations"
  ON public.seller_invitations FOR ALL
  USING (inviter_business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (inviter_business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 4. SELLER ONBOARDING DRAFTS (Multi-step progress persistence)
CREATE TABLE IF NOT EXISTS public.seller_onboarding_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_onboarding_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own onboarding drafts"
  ON public.seller_onboarding_drafts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
