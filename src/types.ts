/**
 * VYRA — AI Business Operating System
 * TypeScript Data Types & Interfaces
 */

export type BusinessType = 
  | 'Manufacturer'
  | 'Exporter'
  | 'Importer'
  | 'Wholesaler'
  | 'Retailer'
  | 'Ecommerce'
  | 'Service';

export type UserRole = 
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'SALES'
  | 'FINANCE'
  | 'INVENTORY'
  | 'SUPPORT'
  | 'VIEWER';

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  email?: string;
  full_name?: string;
  status: 'active' | 'invited' | 'suspended';
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at?: string;
}

export interface Business {
  id: string;
  user_id?: string;
  owner_id?: string;
  name: string;
  owner_name?: string;
  country: string;
  state?: string;
  city?: string;
  website?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  business_type: BusinessType;
  industry: string;
  export_countries?: string[];
  target_countries?: string[];
  target_buyer_types?: string[];
  gst_number?: string;
  iec_code?: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  legal_name?: string;
  brand_name?: string;
  category?: string;
  subcategory?: string;
  year_established?: number | string;
  employee_count?: string;
  registration_number?: string;
  tax_id?: string;
  address_line1?: string;
  address_line2?: string;
  building?: string;
  street?: string;
  area?: string;
  district?: string;
  province?: string;
  postal_code?: string;
  country_code?: string;
  timezone?: string;
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected' | 'Unverified' | 'Pending' | 'Verified' | 'Rejected';
  operational_status?: 'Active' | 'Suspended' | 'Inactive';
  moq?: number;
  manufacturing_capacity?: string;
  trading_capacity?: string;
  shipping_capabilities?: string[];
  export_ports?: string[];
  lead_time_days?: number;
  quality_certifications?: string[];
  gallery_urls?: string[];
  shop_photos_urls?: string[];
  factory_photos_urls?: string[];
  video_urls?: string[];
  catalog_urls?: string[];
  social_links?: Record<string, string>;
  rejection_reason?: string;
  verification_notes?: string;
  verified_at?: string;
  verified_by?: string;
  last_activity_at?: string;
  currency: string;
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  sku?: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  unit?: string;
  moq: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  views_count?: number;
  lead_time_days?: number;
  weight?: number;
  dimensions?: string;
  material?: string;
  country_of_origin?: string;
  hs_code?: string;
  shipping_notes?: string;
  payment_terms?: string;
  specifications?: Record<string, any>;
  images: string[];
  status?: 'Active' | 'Draft' | 'Archived' | 'Pending Review' | 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED' | 'OUT_OF_STOCK';
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type LeadStatus = 
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Quotation Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost';

export type OpportunitySignal = 'High' | 'Medium' | 'Low';
export type LeadScoreTier = OpportunitySignal;

export interface AIQualification {
  summary: string;
  signal: OpportunitySignal;
  buying_intent_score: number; // 0-100
  product_fit_score: number; // 0-100
  buying_intent_signals: string[];
  product_fit_analysis: string;
  missing_information: string[];
  suggested_questions: string[];
  suggested_next_actions: string[];
  risk_factors?: string[];
  qualified_at: string;
  score?: number;
  qualification_status?: string;
  intent_level?: string;
  recommended_action?: string;
  fit_explanation?: string;
  outreach_message?: string;
}

export type AILeadQualificationOutput = AIQualification;

export interface Lead {
  id: string;
  business_id: string;
  name: string;
  buyer_name?: string;
  company?: string;
  company_name?: string;
  country?: string;
  city?: string;
  email?: string;
  phone?: string;
  website?: string;
  source: string;
  product_id?: string;
  product_interest?: string;
  estimated_deal_value: number;
  currency: string;
  status: LeadStatus;
  lead_score: number;
  score_tier: OpportunitySignal;
  ai_qualification?: AIQualification;
  qualification_notes?: string;
  notes?: string;
  last_contact?: string;
  next_follow_up?: string;
  assigned_user?: string;
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  author_name?: string;
  created_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: 'status_change' | 'email' | 'call' | 'whatsapp' | 'note' | 'quote_created';
  description: string;
  created_at: string;
}

export type QuotationStatus = 
  | 'Draft'
  | 'Sent'
  | 'Viewed'
  | 'Negotiation'
  | 'Accepted'
  | 'Rejected'
  | 'Expired';

export interface QuotationItem {
  id?: string;
  quotation_id?: string;
  product_id?: string;
  product_name?: string;
  description: string;
  quantity: number;
  unit_price: number;
  unitPrice?: number;
  total_price: number;
}

export interface Quotation {
  id: string;
  business_id: string;
  quote_number: string;
  quotation_number?: string;
  seller_details: {
    name: string;
    owner_name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    gst_number?: string;
    iec_code?: string;
  };
  buyer_id?: string;
  buyer_name: string;
  buyer_company?: string;
  buyer_email?: string;
  buyer_country?: string;
  buyer_phone?: string;
  currency: string;
  items: QuotationItem[];
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  insurance_amount?: number;
  packaging_fee?: number;
  handling_fee?: number;
  tax_amount: number;
  total_amount: number;
  payment_terms?: string;
  delivery_terms?: string;
  incoterms?: string;
  lead_time_days?: number;
  warranty_terms?: string;
  validity_date?: string;
  status: QuotationStatus;
  notes?: string;
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type FollowUpStatus = 'Pending' | 'Completed' | 'Rescheduled' | 'Cancelled' | 'Missed';
export type FollowUpChannel = 'Email' | 'WhatsApp' | 'Phone' | 'Meeting';

export interface FollowUp {
  id: string;
  business_id: string;
  lead_id?: string;
  lead_name?: string;
  lead_company?: string;
  quotation_id?: string;
  quote_number?: string;
  scheduled_date: string;
  scheduled_at?: string;
  status: FollowUpStatus;
  title: string;
  sequence_number: number;
  message_draft?: string;
  channel: FollowUpChannel;
  notes?: string;
  completed_at?: string;
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Order Confirmed'
  | 'Payment Received'
  | 'In Production'
  | 'Quality Check'
  | 'Packaging'
  | 'Dispatched'
  | 'In Transit'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Processing';

export type PaymentStatus = 'Pending' | 'Advance Paid' | 'Partial' | 'Paid' | 'Fully Paid' | 'Refunded';

export interface Order {
  id: string;
  business_id: string;
  quotation_id?: string;
  lead_id?: string;
  buyer_id?: string;
  customer_name?: string;
  customer_company?: string;
  buyer_name?: string;
  buyer_company?: string;
  order_number: string;
  status: OrderStatus;
  order_status?: OrderStatus;
  total_amount: number;
  currency: string;
  payment_status: PaymentStatus;
  shipping_address?: { country?: string; address?: string };
  items?: Array<{ product_id?: string; product_name?: string; quantity?: number; unit_price?: number }>;
  tracking_number?: string;
  carrier?: string;
  bl_number?: string;
  container_number?: string;
  production_notes?: string;
  shipping_notes?: string;
  items_summary?: string;
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AppNotification {
  id: string;
  business_id: string;
  type: 'follow_up_due' | 'low_stock' | 'new_lead' | 'quote_status' | 'order_status';
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface BuyerRequirement {
  id: string;
  buyer_name: string;
  buyer_country: string;
  product_category: string;
  description: string;
  target_price?: number;
  currency: string;
  moq_requirement?: number;
  status: 'Open' | 'Closed' | 'Matched';
  created_at: string;
}

export interface BuyerDiscoveryResult {
  recommended_trade_platforms: string[];
  customs_search_queries: string[];
  discovered_buyers: Array<{
    company_name: string;
    country: string;
    buyer_category: string;
    typical_import_volume: string;
    reason_for_fit: string;
    recommended_contact_role: string;
    website_sample: string;
  }>;
}

export interface AIGeneration {
  id: string;
  business_id: string;
  entity_type: string;
  entity_id?: string;
  generation_type: string;
  prompt: string;
  output_data: any;
  created_at?: string;
}

// AI Revenue Agent Output Structure
export interface AIRevenueAgentOutput {
  product_analysis: {
    summary: string;
    market_appeal: string;
    perceived_value_drivers: string[];
    potential_limitations: string[];
  };
  ideal_customer_profile: {
    target_industries: string[];
    company_types: string[];
    ideal_company_size: string;
    key_decision_makers: string[];
    geographical_markets: string[];
  };
  buyer_personas: Array<{
    title: string;
    role: string;
    pain_points: string[];
    buying_triggers: string[];
    preferred_communication: string;
  }>;
  buyer_search_keywords: {
    b2b_trade_queries: string[];
    google_search_keywords: string[];
    import_directory_filters: string[];
    hs_code_suggestions: string[];
  };
  sales_positioning: string;
  unique_selling_points: string[];
  suggested_offer: {
    headline: string;
    structure: string;
    pricing_guidance: string;
    risk_reversal_guarantee: string;
  };
  personalized_sales_message: string;
  email_draft: {
    subject: string;
    body: string;
  };
  whatsapp_draft: string;
  follow_up_sequence: Array<{
    day: number;
    title: string;
    channel: string;
    template: string;
  }>;
  objection_handling: Array<{
    objection: string;
    response: string;
  }>;
  suggested_next_action: string;
}

// AI Buyer Discovery Output Structure
export interface AIBuyerDiscoveryOutput {
  target_buyer_profile: string;
  recommended_discovery_channels: string[];
  search_strategy: string;
  search_keywords: string[];
  qualification_checklist: string[];
  outreach_protocol: string;
}

// AI Business Health Output Structure
export interface AIHealthCheckOutput {
  overall_score: number; // 0-100
  health_rating: 'Strong' | 'Moderate' | 'Needs Attention';
  strengths: string[];
  problems: string[];
  missing_information: string[];
  opportunities: string[];
  recommended_actions: Array<{
    priority: 'Critical' | 'High' | 'Medium';
    action: string;
    expected_impact: string;
  }>;
  pipeline_efficiency_note: string;
  export_readiness_assessment: string;
}

// AI Chat
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ==========================================
// INVENTORY & MOVEMENTS
// ==========================================
export type InventoryMovementType = 
  | 'stock_in' 
  | 'stock_out' 
  | 'adjustment' 
  | 'reserved' 
  | 'released'
  | 'received'
  | 'allocated'
  | 'damaged'
  | 'recounted';

export interface InventoryMovement {
  id: string;
  business_id: string;
  product_id: string;
  product_name?: string;
  movement_type: InventoryMovementType;
  quantity_change?: number;
  quantity?: number;
  previous_stock?: number;
  new_stock?: number;
  reason?: string;
  notes?: string;
  reference_order_id?: string;
  created_by?: string;
  created_at: string;
}

// ==========================================
// CUSTOMERS & BUYERS
// ==========================================
export interface Customer {
  id: string;
  business_id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  country: string;
  address?: string;
  gst_tax_id?: string;
  total_spent: number;
  orders_count: number;
  created_at: string;
  updated_at?: string;
}

export interface Buyer {
  id: string;
  business_id: string;
  company_name: string;
  contact_person: string;
  country: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  category: string;
  import_volume?: string;
  target_products?: string[];
  verification_status: 'Unverified' | 'Verified' | 'Vetted Enterprise';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface BuyerContact {
  id: string;
  business_id: string;
  buyer_id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  is_primary: boolean;
  created_at: string;
}

// ==========================================
// SELLERS & SUPPLIERS
// ==========================================
export type SellerVerificationStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';
export type SellerOperationalStatus = 'Active' | 'Suspended' | 'Inactive';

export interface SellerProfile extends Business {
  operational_status?: SellerOperationalStatus;
  verification_status_normalized?: SellerVerificationStatus;
  verification_notes?: string;
  rejection_reason?: string;
  verified_at?: string;
  verified_by?: string;

  // Capabilities
  moq?: number;
  manufacturing_capacity?: string;
  trading_capacity?: string;
  shipping_capabilities?: string[];
  export_ports?: string[];
  lead_time_days?: number;
  quality_certifications?: string[];

  // Media
  gallery_urls?: string[];
  shop_photos_urls?: string[];
  factory_photos_urls?: string[];
  video_urls?: string[];
  catalog_urls?: string[];
  social_links?: Record<string, string>;

  // Calculated Real Metrics from DB
  products_count?: number;
  orders_count?: number;
  quotations_count?: number;
  rfq_responses_count?: number;
  total_revenue?: number;
  last_activity_at?: string;
}

export interface SellerVerificationEvidence {
  id: string;
  seller_id: string;
  document_type: 'business_registration' | 'tax_cert' | 'export_license' | 'factory_audit' | 'identity_proof' | 'quality_cert' | 'other';
  title: string;
  file_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface SellerInvitation {
  id: string;
  inviter_business_id: string;
  email: string;
  business_name: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  invite_token: string;
  invited_by_name?: string;
  expires_at: string;
  created_at: string;
}

export interface SellerDashboardMetrics {
  total_sellers: number;
  verified_sellers: number;
  pending_verification: number;
  active_sellers: number;
  inactive_sellers: number;
  total_products_listed: number;
  seller_rfq_responses: number;
  seller_quotations: number;
  seller_orders: number;
  seller_revenue: number;
}

export interface SellerOnboardingDraft {
  id: string;
  user_id?: string;
  business_id?: string;
  current_step: number;
  business_info: {
    legal_name: string;
    brand_name: string;
    business_type: string;
    industry: string;
    category: string;
    subcategory?: string;
    email: string;
    phone: string;
    website: string;
    description: string;
  };
  address_info: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
    location_type: string;
  };
  media_info: {
    logo_url?: string;
    cover_image_url?: string;
    gallery_urls: string[];
    video_url?: string;
  };
  product_info: {
    name: string;
    category: string;
    price: number;
    currency: string;
    moq: number;
    stock: number;
    images: string[];
  };
  capabilities_info: {
    manufacturing_capacity: string;
    export_countries: string[];
    shipping_capabilities: string[];
    lead_time_days: number;
  };
  compliance_info: {
    registration_number: string;
    tax_id: string;
    gst_number?: string;
    iec_code?: string;
    evidence_urls: string[];
  };
  storefront_info: {
    store_slug: string;
    tagline: string;
    is_published: boolean;
  };
  updated_at: string;
}

// ==========================================
// INVOICING
// ==========================================
export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled';

export interface InvoiceItem {
  id?: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Invoice {
  id: string;
  business_id: string;
  order_id?: string;
  quotation_id?: string;
  invoice_number: string;
  customer_name: string;
  customer_company?: string;
  customer_email?: string;
  customer_address?: string;
  customer_tax_id?: string;
  currency: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  amount_paid: number;
  payment_status: InvoiceStatus;
  due_date: string;
  notes?: string;
  terms?: string;
  created_at: string;
  updated_at?: string;
}

// ==========================================
// BANKING & FINANCE
// ==========================================
export type BankAccountStatus = 'active' | 'pending_verification' | 'disabled';
export type BankAccountType = 'checking' | 'current' | 'savings' | 'escrow';

export interface BankAccount {
  id: string;
  business_id: string;
  account_holder_name: string;
  bank_name: string;
  account_type: BankAccountType;
  country: string;
  currency: string;
  provider: 'Direct_Wire' | 'Stripe_Connect' | 'RazorpayX' | 'Manual';
  last4: string; // ONLY last 4 digits stored for security
  routing_or_ifsc_prefix?: string;
  is_primary: boolean;
  status: BankAccountStatus;
  created_at: string;
  updated_at?: string;
}

export type BankTransactionType = 'inflow' | 'outflow' | 'fee' | 'tax' | 'payout';

export interface BankTransaction {
  id: string;
  business_id: string;
  bank_account_id?: string;
  transaction_type: BankTransactionType;
  amount: number;
  currency: string;
  category: string;
  description: string;
  reference_number?: string;
  invoice_id?: string;
  order_id?: string;
  transaction_date: string;
  status: 'settled' | 'pending' | 'failed';
  created_at: string;
}

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Payout {
  id: string;
  business_id: string;
  bank_account_id: string;
  bank_name?: string;
  account_last4?: string;
  amount: number;
  currency: string;
  fee: number;
  status: PayoutStatus;
  provider: 'Stripe_Payouts' | 'RazorpayX' | 'Bank_Wire';
  provider_reference?: string;
  requested_by?: string;
  notes?: string;
  created_at: string;
  processed_at?: string;
}

export interface Expense {
  id: string;
  business_id: string;
  title: string;
  category: 'Materials' | 'Freight & Logistics' | 'Marketing' | 'Customs & Duties' | 'Salaries' | 'Utilities' | 'Other';
  amount: number;
  currency: string;
  receipt_url?: string;
  expense_date: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// ==========================================
// PAYMENTS ABSTRACTION
// ==========================================
export type PaymentProviderType = 'Stripe' | 'Razorpay' | 'PayPal' | 'Bank_Transfer';

export interface PaymentIntent {
  id: string;
  business_id: string;
  order_id: string;
  invoice_id?: string;
  amount: number;
  currency: string;
  provider: PaymentProviderType;
  provider_intent_id?: string;
  client_secret?: string;
  status: 'requires_payment_method' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  created_at: string;
}

export interface PaymentMethodRecord {
  id: string;
  business_id: string;
  type: 'card' | 'bank_transfer' | 'upi' | 'net_banking';
  last4?: string;
  brand?: string;
  is_default: boolean;
  created_at: string;
}

// ==========================================
// DOCUMENTS MANAGEMENT
// ==========================================
export type DocumentCategory = 
  | 'Business Registration'
  | 'GST / Tax Certificate'
  | 'IEC Export License'
  | 'Commercial Invoice'
  | 'Bill of Lading'
  | 'Packing List'
  | 'Product Spec Sheet'
  | 'Quality Certificate'
  | 'Contract'
  | 'Other';

export interface DocumentRecord {
  id: string;
  business_id: string;
  title: string;
  category: DocumentCategory;
  file_name?: string;
  file_size_bytes: number;
  mime_type: string;
  storage_path?: string;
  file_path?: string;
  public_url?: string;
  version?: number;
  uploaded_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  storage_path: string;
  file_size_bytes: number;
  uploaded_by?: string;
  created_at: string;
}

// ==========================================
// AUDIT LOG
// ==========================================
export interface AuditLog {
  id: string;
  business_id: string;
  user_id: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  module?: string;
  record_id?: string;
  description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

// ==========================================
// INTEGRATIONS & SETTINGS
// ==========================================
export interface IntegrationConfig {
  id: string;
  business_id: string;
  provider: 'supabase' | 'gemini' | 'stripe' | 'razorpay' | 'whatsapp' | 'email_smtp';
  is_configured: boolean;
  status: 'active' | 'inactive' | 'error';
  metadata?: Record<string, any>;
  updated_at: string;
}

// ==========================================
// STOREFRONT & WEBSITE BUILDER
// ==========================================
export interface StoreSection {
  id: string;
  type: 'hero' | 'about' | 'products' | 'categories' | 'rfq_banner' | 'testimonials' | 'faq' | 'gallery' | 'contact' | 'footer';
  title: string;
  subtitle?: string;
  content?: string;
  image_url?: string;
  button_text?: string;
  button_link?: string;
  items?: Array<{
    title: string;
    description?: string;
    image_url?: string;
    price?: number;
    badge?: string;
  }>;
  is_visible: boolean;
  order_index: number;
}

export interface StoreTheme {
  primary_color: string;
  accent_color: string;
  font_family: string;
  layout_style: 'modern' | 'minimal' | 'industrial' | 'luxury';
  dark_mode: boolean;
}

export interface BusinessStore {
  id: string;
  business_id: string;
  slug: string;
  site_title: string;
  tagline?: string;
  meta_description?: string;
  logo_url?: string;
  banner_url?: string;
  theme: StoreTheme;
  sections: StoreSection[];
  is_published: boolean;
  custom_domain?: string;
  social_links?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    whatsapp?: string;
    x?: string;
  };
  created_at: string;
  updated_at: string;
}

// ==========================================
// RFQ / BUYER REQUIREMENTS
// ==========================================
export type RFQStatus = 'OPEN' | 'Open' | 'RESPONSES_RECEIVED' | 'NEGOTIATION' | 'AWARDED' | 'CLOSED' | 'EXPIRED';

export interface RFQ {
  id: string;
  business_id?: string;
  buyer_user_id?: string;
  buyer_name: string;
  buyer_company?: string;
  buyer_country: string;
  buyer_email?: string;
  buyer_phone?: string;
  product_title: string;
  category: string;
  quantity: number;
  unit: string;
  target_price?: number;
  currency: string;
  delivery_location: string;
  required_by_date?: string;
  specifications: string;
  payment_preference?: string;
  status: RFQStatus;
  responses_count: number;
  created_at: string;
  updated_at?: string;
}

export interface RFQResponse {
  id: string;
  rfq_id: string;
  seller_business_id: string;
  seller_business_name: string;
  seller_user_id: string;
  offered_price: number;
  currency: string;
  delivery_timeline_days: number;
  moq: number;
  proposal_notes: string;
  quotation_id?: string;
  created_at: string;
}

// ==========================================
// BUSINESS CHAT & MESSAGING
// ==========================================
export interface Conversation {
  id: string;
  business_id: string;
  buyer_id?: string;
  buyer_name: string;
  buyer_company?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  product_id?: string;
  product_name?: string;
  rfq_id?: string;
  status: 'active' | 'archived';
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'buyer' | 'seller';
  message: string;
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
}

// ==========================================
// INTERNAL ADVERTISING PLATFORM
// ==========================================
export type AdCampaignType = 'Sponsored Product' | 'Sponsored Store' | 'Featured RFQ' | 'Search Banner';
export type AdCampaignStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'REJECTED';

export interface AdCampaign {
  id: string;
  business_id: string;
  business_name?: string;
  title: string;
  campaign_type: AdCampaignType;
  product_id?: string;
  product_name?: string;
  target_categories: string[];
  target_countries: string[];
  daily_budget: number;
  total_budget: number;
  currency: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  status: AdCampaignStatus;
  start_date: string;
  end_date: string;
  headline?: string;
  ad_copy?: string;
  created_at: string;
  updated_at?: string;
}

// ==========================================
// RETURNS, REFUNDS & DISPUTES
// ==========================================
export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PICKUP' | 'RECEIVED' | 'REFUNDED' | 'CLOSED';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';

export interface OrderReturn {
  id: string;
  business_id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  reason: string;
  description: string;
  refund_amount: number;
  currency: string;
  status: ReturnStatus;
  image_urls?: string[];
  created_at: string;
  updated_at?: string;
}

export interface OrderDispute {
  id: string;
  business_id: string;
  order_id: string;
  order_number: string;
  dispute_type: 'Item Not Received' | 'Quality Mismatch' | 'Damaged in Transit' | 'Billing Error' | 'Other';
  raised_by: 'buyer' | 'seller';
  title: string;
  description: string;
  claim_amount: number;
  currency: string;
  evidence_urls?: string[];
  status: DisputeStatus;
  resolution_notes?: string;
  created_at: string;
  updated_at?: string;
}

// ==========================================
// PLATFORM ADMIN & MODERATION
// ==========================================
export interface AdminPlatformStats {
  total_users: number;
  total_businesses: number;
  verified_businesses: number;
  total_products: number;
  total_rfqs: number;
  total_orders: number;
  total_gmv: number;
  active_ad_campaigns: number;
  open_disputes: number;
  system_health: 'healthy' | 'degraded' | 'critical';
}

// ==========================================
// VYRA MASTER COMMERCE ENGINE ADDITIONS
// ==========================================

export type AccountCategory = 'Buyer' | 'Seller' | 'Business' | 'Individual Buyer';

export type EnterpriseBusinessType =
  | 'Buyer'
  | 'Seller'
  | 'Manufacturer'
  | 'Exporter'
  | 'Importer'
  | 'Wholesaler'
  | 'Retailer'
  | 'Service Provider'
  | 'Brand'
  | 'Distributor';

export type LocationType =
  | 'Head Office'
  | 'Factory'
  | 'Warehouse'
  | 'Shop'
  | 'Showroom'
  | 'Branch'
  | 'Pickup Location';

export interface BusinessLocation {
  id: string;
  business_id: string;
  name: string;
  location_type: LocationType;
  address_line1: string;
  address_line2?: string;
  building?: string;
  street?: string;
  area?: string;
  city: string;
  district?: string;
  state_province: string;
  postal_code: string;
  country: string;
  country_code: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: string;
  contact_person?: string;
  contact_phone?: string;
  is_public: boolean;
  is_primary: boolean;
  created_at?: string;
}

export type GlobalMediaType =
  | 'image'
  | 'video'
  | 'pdf'
  | 'document'
  | 'catalog'
  | 'certificate'
  | 'brochure'
  | 'datasheet';

export type MediaEntityTarget =
  | 'business'
  | 'seller'
  | 'product'
  | 'store'
  | 'rfq'
  | 'quotation'
  | 'advertisement'
  | 'message'
  | 'blog'
  | 'website';

export type BusinessMediaCategory =
  | 'logo'
  | 'cover'
  | 'business_photos'
  | 'shop_photos'
  | 'factory_photos'
  | 'warehouse_photos'
  | 'showroom_photos'
  | 'office_photos'
  | 'team_photos'
  | 'company_intro_video'
  | 'factory_tour_video'
  | 'shop_tour_video'
  | 'product_video'
  | 'presentation_video';

export interface GlobalMediaAsset {
  id: string;
  business_id: string;
  title: string;
  media_type: GlobalMediaType;
  category?: BusinessMediaCategory | string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  public_url: string;
  thumbnail_url?: string;
  storage_path?: string;
  caption?: string;
  alt_text?: string;
  visibility: 'public' | 'private' | 'unlisted';
  attached_entities?: Array<{
    entity_type: MediaEntityTarget;
    entity_id: string;
  }>;
  order_index?: number;
  created_at: string;
  updated_at?: string;
}

// Global Country-Aware Banking Definitions
export type SupportedBankingCountry =
  | 'India'
  | 'United States'
  | 'United Kingdom'
  | 'European Union'
  | 'Australia'
  | 'Canada'
  | 'United Arab Emirates'
  | 'Singapore'
  | 'Japan'
  | 'Other';

export interface CountryBankingFields {
  country: SupportedBankingCountry;
  account_holder_name: string;
  bank_name: string;
  currency: string;
  // Dynamic country fields
  account_number: string;
  ifsc_code?: string; // India
  aba_routing?: string; // USA
  sort_code?: string; // UK
  iban?: string; // EU, UK, UAE
  swift_bic?: string; // Global
  bsb_number?: string; // Australia
  institution_number?: string; // Canada
  transit_number?: string; // Canada
  bank_code?: string; // Singapore, Japan
  branch_code?: string; // Singapore, Japan
  bank_address?: string;
}

// Catalog Builder Config
export type CatalogFormat = 'A4' | 'A5' | 'Letter';
export type CatalogTemplate = 'Business' | 'Wholesale' | 'Export' | 'Luxury' | 'Minimal' | 'Modern';

export interface CatalogBuildConfig {
  title: string;
  subtitle?: string;
  format: CatalogFormat;
  template: CatalogTemplate;
  selected_product_ids: string[];
  include_pricing: boolean;
  include_specifications: boolean;
  include_qr_code: boolean;
  include_contact: boolean;
  custom_notes?: string;
}

// Extended RBAC 2.0 Roles & Matrix
export type RBACRoleName =
  | 'Owner'
  | 'Super Admin'
  | 'Business Admin'
  | 'Sales'
  | 'Finance'
  | 'Marketing'
  | 'Inventory'
  | 'Operations'
  | 'Procurement'
  | 'Support'
  | 'Accountant'
  | 'Warehouse'
  | 'Content Manager'
  | 'Viewer'
  | 'Custom Role';

export type PlatformRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'SUPPORT_AGENT'
  | 'FINANCE_MANAGER'
  | 'MARKETING_MANAGER'
  | 'BUYER'
  | 'SELLER'
  | 'MANUFACTURER'
  | 'WHOLESALER'
  | 'RETAILER'
  | 'EXPORTER'
  | 'IMPORTER'
  | 'LOGISTICS_PARTNER'
  | 'OWNER'
  | 'MANAGER'
  | 'SALES'
  | 'FINANCE'
  | 'INVENTORY'
  | 'SUPPORT'
  | 'VIEWER';

export type RBACPermission = 'View' | 'Create' | 'Edit' | 'Delete' | 'Approve' | 'Export' | 'Manage';

export interface RBACRoleDefinition {
  name: RBACRoleName;
  description: string;
  department: string;
  permissions: RBACPermission[];
  scope: 'all_locations' | 'assigned_location_only';
}

// Internal Database Migration Status
export interface MigrationRecord {
  id: string;
  version: string;
  name: string;
  executed_at?: string;
  status: 'Applied' | 'Pending' | 'Failed';
  duration_ms?: number;
  error?: string;
}

// ----------------------------------------------------------------------------
// B2C & B2B Cart, Checkout & Coupons
// ----------------------------------------------------------------------------
export interface CartItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
  selected_variant?: string;
  unit_price: number;
  currency: string;
  added_at: string;
}

export interface Cart {
  id: string;
  user_id?: string;
  business_id?: string;
  items: CartItem[];
  saved_for_later: CartItem[];
  coupon_code?: string;
  discount_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  total: number;
  currency: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  description: string;
}

// ----------------------------------------------------------------------------
// Product & Seller Reviews & Ratings
// ----------------------------------------------------------------------------
export interface ProductReview {
  id: string;
  product_id: string;
  seller_id?: string;
  user_id?: string;
  buyer_id?: string;
  business_id?: string;
  author_name: string;
  buyer_name?: string;
  author_country?: string;
  buyer_country?: string;
  rating: number; // 1 to 5
  seller_rating?: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  images?: string[];
  created_at: string;
  helpful_count: number;
  seller_reply?: string;
  seller_replied_at?: string;
}

export interface SellerReview {
  id: string;
  seller_id: string;
  user_id?: string;
  business_id?: string;
  author_name: string;
  author_country?: string;
  rating: number;
  communication_rating?: number;
  delivery_rating?: number;
  quality_rating?: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Manufacturer Factory & Capabilities System
// ----------------------------------------------------------------------------
export interface ManufacturerProfile {
  id: string;
  business_id: string;
  factory_name: string;
  factory_size_sqm: number;
  production_lines: number;
  daily_capacity: string;
  lead_time_days: number;
  moq: number;
  customization_services: ('OEM' | 'ODM' | 'Custom Logo' | 'Custom Packaging' | 'Graphic Customization')[];
  machinery_equipment: string[];
  certifications: string[];
  export_destinations: string[];
  qc_process_description: string;
  factory_images: string[];
  created_at: string;
}

// ----------------------------------------------------------------------------
// AI Search Natural Language Intent
// ----------------------------------------------------------------------------
export interface AISearchIntent {
  query: string;
  product_type?: string;
  quantity?: number;
  max_price?: number;
  currency?: string;
  country?: string;
  material?: string;
  category?: string;
  verified_only?: boolean;
  manufacturer_only?: boolean;
  confidence: number;
  summary: string;
}

// ----------------------------------------------------------------------------
// Shipping Carrier Options & Global Logistics System (Section 49)
// ----------------------------------------------------------------------------
export interface ShippingCarrierOption {
  id: string;
  name: string;
  type: 'COURIER' | 'AIR_FREIGHT' | 'OCEAN_FREIGHT' | 'ROAD_EXPRESS';
  estimated_days: string;
  price: number;
  currency: string;
  tracking_supported: boolean;
  free_threshold?: number;
}

export type ShippingMode =
  // E-Commerce
  | 'Standard Shipping'
  | 'Express Shipping'
  | 'Same/Next Day'
  | 'Economy Shipping'
  | 'Local Delivery'
  | 'Store/Warehouse Pickup'
  | 'Scheduled Delivery'
  // B2B & Wholesale
  | 'Courier & Express Parcel'
  | 'LTL (Less-Than-Truckload)'
  | 'FTL (Full-Truckload)'
  | 'Rail Freight'
  | 'Air Freight Cargo'
  | 'Sea Freight (LCL)'
  | 'Sea Freight (FCL Container)'
  | 'Multimodal Freight'
  | 'Freight Forwarder Hand-off';

export type IncotermCode =
  | 'EXW' // Ex Works
  | 'FCA' // Free Carrier
  | 'CPT' // Carriage Paid To
  | 'CIP' // Carriage and Insurance Paid To
  | 'DAP' // Delivered at Place
  | 'DPU' // Delivered at Place Unloaded
  | 'DDP' // Delivered Duty Paid
  | 'FAS' // Free Alongside Ship
  | 'FOB' // Free on Board
  | 'CFR' // Cost and Freight
  | 'CIF'; // Cost, Insurance and Freight

export type ShipmentStatus =
  | 'DRAFT'
  | 'READY_TO_SHIP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'CUSTOMS_PENDING'
  | 'CUSTOMS_CLEARED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_ATTEMPT'
  | 'RETURNED'
  | 'CANCELLED';

export interface ShippingAddressInfo {
  company_name?: string;
  contact_name: string;
  email: string;
  phone: string;
  tax_id?: string; // VAT / GST / EORI / EIN
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  country_code: string;
  is_residential?: boolean;
}

export interface ShipmentPackageItem {
  id: string;
  description: string;
  hs_code?: string;
  quantity: number;
  unit_weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  volumetric_weight_kg: number;
  chargeable_weight_kg: number;
  declared_value: number;
  currency: string;
  is_dangerous_goods?: boolean;
}

export interface ShipmentTrackingEvent {
  id: string;
  shipment_id: string;
  status: ShipmentStatus;
  status_label: string;
  location: string;
  city?: string;
  country?: string;
  description: string;
  timestamp: string;
  checkpoint_code?: string;
}

export interface ShippingDocument {
  id: string;
  shipment_id: string;
  doc_type:
    | 'COMMERCIAL_INVOICE'
    | 'PACKING_LIST'
    | 'BILL_OF_LADING'
    | 'AIR_WAYBILL'
    | 'CERTIFICATE_OF_ORIGIN'
    | 'SHIPPING_LABEL'
    | 'CUSTOMS_DECLARATION';
  doc_number: string;
  title: string;
  file_name: string;
  issued_at: string;
  status: 'DRAFT' | 'ISSUED' | 'VERIFIED';
  issuer: string;
}

export interface LogisticsCarrier {
  id: string;
  name: string;
  code: string;
  category: 'GLOBAL_EXPRESS' | 'OCEAN_CARRIER' | 'AIR_FREIGHT' | 'REGIONAL_3PL' | 'DOMESTIC_POSTAL';
  status: 'CONNECTED' | 'TEST_MODE' | 'SETUP_REQUIRED';
  supported_modes: ShippingMode[];
  tracking_url_template: string;
  logo_badge: string;
  average_on_time_rate: number;
  supported_countries: string[];
}

export interface LogisticsWarehouse {
  id: string;
  business_id: string;
  code: string;
  name: string;
  type: 'FULFILLMENT_CENTER' | 'BONDED_WAREHOUSE' | 'FACTORY_DOCK' | 'REGIONAL_HUB';
  address: ShippingAddressInfo;
  capacity_sqm: number;
  dock_count: number;
  manager_name: string;
  manager_phone: string;
  is_default_origin: boolean;
  active_stock_skus: number;
}

export interface ContainerDetails {
  container_type: '20ft Standard' | '40ft Standard' | '40ft High Cube (HC)' | '20ft Reefer' | '40ft Reefer' | 'Flat Rack' | 'LCL Palletised';
  container_number?: string;
  seal_number?: string;
  vessel_name?: string;
  voyage_number?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
  gross_weight_kg?: number;
  cbm_volume?: number;
}

export interface VyraShipment {
  id: string;
  business_id: string;
  order_id?: string;
  order_number?: string;
  buyer_id?: string;
  buyer_name: string;
  seller_id?: string;
  seller_name: string;
  tracking_number: string;
  carrier_id: string;
  carrier_name: string;
  shipping_mode: ShippingMode;
  incoterm?: IncotermCode;
  shipment_type: 'B2C_ECOM' | 'B2B_FREIGHT' | 'CONTAINER_FCL' | 'CONTAINER_LCL' | 'AIR_CARGO';
  origin: ShippingAddressInfo;
  destination: ShippingAddressInfo;
  packages: ShipmentPackageItem[];
  total_weight_kg: number;
  chargeable_weight_kg: number;
  total_packages: number;
  shipping_cost: number;
  fuel_surcharge: number;
  handling_fee: number;
  customs_duty_est?: number;
  insurance_fee?: number;
  currency: string;
  status: ShipmentStatus;
  container_details?: ContainerDetails;
  documents: ShippingDocument[];
  events: ShipmentTrackingEvent[];
  estimated_delivery: string;
  actual_delivery?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface LogisticsClaim {
  id: string;
  shipment_id: string;
  tracking_number: string;
  claim_number: string;
  claim_type: 'CARGO_DAMAGE' | 'TOTAL_LOSS' | 'DELIVERY_DELAY' | 'PILFERAGE' | 'WRONG_DESTINATION';
  claimed_amount: number;
  approved_amount?: number;
  currency: string;
  status: 'SUBMITTED' | 'UNDER_INVESTIGATION' | 'SURVEYOR_ASSIGNED' | 'APPROVED' | 'REJECTED' | 'SETTLED';
  description: string;
  evidence_attachments: string[];
  submitted_by: string;
  created_at: string;
  resolved_at?: string;
}

export interface ShippingRateCalculation {
  carrier_id: string;
  carrier_name: string;
  service_level: string;
  mode: ShippingMode;
  estimated_days: number;
  chargeable_weight_kg: number;
  volumetric_weight_kg: number;
  base_rate: number;
  fuel_surcharge: number;
  handling_fee: number;
  insurance_fee: number;
  total_cost: number;
  currency: string;
  is_fastest?: boolean;
  is_cheapest?: boolean;
  is_best_value?: boolean;
}



