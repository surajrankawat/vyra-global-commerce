-- VYRA Global Logistics & Shipping Migration (Section 49)
-- Supports B2C e-commerce parcels, B2B wholesale freight, FCL/LCL containers, customs, and claims

-- 1. LOGISTICS WAREHOUSES
CREATE TABLE IF NOT EXISTS public.logistics_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'FULFILLMENT_CENTER',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'US',
  capacity_sqm NUMERIC NOT NULL DEFAULT 1000,
  dock_count INT NOT NULL DEFAULT 2,
  manager_name TEXT NOT NULL,
  manager_phone TEXT NOT NULL,
  is_default_origin BOOLEAN NOT NULL DEFAULT false,
  active_stock_skus INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logistics_warehouses_biz ON public.logistics_warehouses(business_id);
ALTER TABLE public.logistics_warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logistics warehouse tenant isolation"
  ON public.logistics_warehouses FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- 2. ENHANCED SHIPMENTS TABLE
-- Note: base shipments table created in 005. Adding columns if missing.
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS buyer_id UUID;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS carrier_id TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS shipping_mode TEXT DEFAULT 'Courier & Express Parcel';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS incoterm TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS shipment_type TEXT DEFAULT 'B2C_ECOM';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS origin_address JSONB;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS destination_address JSONB;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS total_weight_kg NUMERIC DEFAULT 1;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS chargeable_weight_kg NUMERIC DEFAULT 1;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS total_packages INT DEFAULT 1;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS fuel_surcharge NUMERIC DEFAULT 0;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS handling_fee NUMERIC DEFAULT 0;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS customs_duty_est NUMERIC DEFAULT 0;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS insurance_fee NUMERIC DEFAULT 0;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS container_details JSONB;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. SHIPMENT PACKAGES
CREATE TABLE IF NOT EXISTS public.shipment_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  hs_code TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_weight_kg NUMERIC NOT NULL DEFAULT 1,
  length_cm NUMERIC NOT NULL DEFAULT 10,
  width_cm NUMERIC NOT NULL DEFAULT 10,
  height_cm NUMERIC NOT NULL DEFAULT 10,
  volumetric_weight_kg NUMERIC NOT NULL DEFAULT 0.5,
  chargeable_weight_kg NUMERIC NOT NULL DEFAULT 1,
  declared_value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_dangerous_goods BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_packages_shipment ON public.shipment_packages(shipment_id);

-- 4. SHIPPING DOCUMENTS
CREATE TABLE IF NOT EXISTS public.shipping_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  doc_number TEXT NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'ISSUED',
  issuer TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipping_documents_shipment ON public.shipping_documents(shipment_id);

-- 5. LOGISTICS CLAIMS
CREATE TABLE IF NOT EXISTS public.logistics_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  claim_number TEXT NOT NULL UNIQUE,
  claim_type TEXT NOT NULL,
  claimed_amount NUMERIC NOT NULL,
  approved_amount NUMERIC,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  description TEXT NOT NULL,
  evidence_attachments JSONB DEFAULT '[]'::jsonb,
  submitted_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_logistics_claims_shipment ON public.logistics_claims(shipment_id);
