import { getSupabaseClient, getSupabaseConfig } from './supabase';
import {
  Business,
  Product,
  Lead,
  LeadNote,
  LeadActivity,
  Quotation,
  FollowUp,
  Order,
  AppNotification,
  AIGeneration,
  Profile,
  Invoice,
  InvoiceItem,
  BankAccount,
  BankTransaction,
  Payout,
  Expense,
  InventoryMovement,
  AuditLog,
  BusinessMember,
  DocumentRecord,
  RFQ,
  RFQResponse,
  BusinessStore,
  Conversation,
  ConversationMessage,
  AdCampaign,
  OrderReturn,
  OrderDispute,
  AdminPlatformStats,
  BusinessLocation,
  GlobalMediaAsset,
  CountryBankingFields,
  MigrationRecord,
  SellerProfile,
  SellerVerificationEvidence,
  SellerInvitation,
  SellerDashboardMetrics,
  SellerOnboardingDraft,
  Cart,
  CartItem,
  Coupon,
  ProductReview,
  SellerReview,
  ManufacturerProfile,
  ShippingCarrierOption,
  VyraShipment,
  LogisticsCarrier,
  LogisticsWarehouse,
  LogisticsClaim,
  ShippingRateCalculation,
  ShipmentTrackingEvent,
  ShippingDocument,
  ShipmentPackageItem,
  ShippingMode,
  ShipmentStatus,
  IncotermCode,
  ShippingAddressInfo,
} from '../types';

const LOCAL_STORAGE_PREFIX = 'vyra_db_';
const LEGACY_STORAGE_PREFIX = 'ms_nexus_db_';

function getLocalTable<T>(tableName: string): T[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + tableName) || localStorage.getItem(LEGACY_STORAGE_PREFIX + tableName);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function setLocalTable<T>(tableName: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_PREFIX + tableName, JSON.stringify(data));
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ==========================================
// 1. BUSINESSES
// ==========================================

export async function fetchUserBusinesses(userId: string): Promise<Business[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch businesses error, falling back to local:', error.message);
    } else if (data) {
      return data as Business[];
    }
  }

  const all = getLocalTable<Business>('businesses');
  return all.filter((b) => b.user_id === userId);
}

export async function createBusiness(business: Omit<Business, 'id' | 'created_at' | 'updated_at'>): Promise<Business> {
  const newBusiness: Business = {
    ...business,
    id: generateUuid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('businesses').insert(newBusiness).select().single();
    if (error) {
      console.warn('Supabase insert business error, saving locally:', error.message);
    } else if (data) {
      return data as Business;
    }
  }

  const all = getLocalTable<Business>('businesses');
  all.unshift(newBusiness);
  setLocalTable('businesses', all);
  return newBusiness;
}

export async function updateBusiness(id: string, updates: Partial<Business>): Promise<Business> {
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('businesses')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data as Business;
  }

  const all = getLocalTable<Business>('businesses');
  const index = all.findIndex((b) => b.id === id);
  if (index >= 0) {
    all[index] = { ...all[index], ...updatedData };
    setLocalTable('businesses', all);
    return all[index];
  }
  throw new Error('Business not found');
}

// ==========================================
// 2. PRODUCTS
// ==========================================

export async function fetchBusinessProducts(businessId: string): Promise<Product[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((p: any) => ({
        ...p,
        images: p.product_images ? p.product_images.map((img: any) => img.url) : (p.images || []),
      })) as Product[];
    }
  }

  const all = getLocalTable<Product>('products');
  return all.filter((p) => p.business_id === businessId);
}

export async function createProduct(
  product: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
  images: string[] = []
): Promise<Product> {
  const id = generateUuid();
  const newProduct: Product = {
    ...product,
    id,
    images,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        id: newProduct.id,
        business_id: newProduct.business_id,
        name: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        description: newProduct.description,
        price: newProduct.price,
        currency: newProduct.currency,
        moq: newProduct.moq,
        stock_quantity: newProduct.stock_quantity,
        weight: newProduct.weight,
        dimensions: newProduct.dimensions,
        material: newProduct.material,
        country_of_origin: newProduct.country_of_origin,
        hs_code: newProduct.hs_code,
        shipping_notes: newProduct.shipping_notes,
        payment_terms: newProduct.payment_terms,
        is_demo: newProduct.is_demo || false,
      })
      .select()
      .single();

    if (!error && data) {
      if (images.length > 0) {
        const imageRows = images.map((url, idx) => ({
          product_id: id,
          url,
          is_primary: idx === 0,
        }));
        await supabase.from('product_images').insert(imageRows);
      }
      return { ...data, images } as Product;
    }
  }

  const all = getLocalTable<Product>('products');
  all.unshift(newProduct);
  setLocalTable('products', all);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return { ...data, images: updates.images || [] } as Product;
  }

  const all = getLocalTable<Product>('products');
  const index = all.findIndex((p) => p.id === id);
  if (index >= 0) {
    all[index] = { ...all[index], ...updatedData };
    setLocalTable('products', all);
    return all[index];
  }
  throw new Error('Product not found');
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('products').delete().eq('id', id);
  }
  const all = getLocalTable<Product>('products');
  setLocalTable('products', all.filter((p) => p.id !== id));
}

// ==========================================
// 3. LEADS & CRM
// ==========================================

export async function fetchBusinessLeads(businessId: string): Promise<Lead[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (!error && data) return data as Lead[];
  }

  const all = getLocalTable<Lead>('leads');
  return all.filter((l) => l.business_id === businessId);
}

export async function createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
  const newLead: Lead = {
    ...lead,
    id: generateUuid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('leads').insert(newLead).select().single();
    if (!error && data) return data as Lead;
  }

  const all = getLocalTable<Lead>('leads');
  all.unshift(newLead);
  setLocalTable('leads', all);
  return newLead;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('leads')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data as Lead;
  }

  const all = getLocalTable<Lead>('leads');
  const index = all.findIndex((l) => l.id === id);
  if (index >= 0) {
    all[index] = { ...all[index], ...updatedData };
    setLocalTable('leads', all);
    return all[index];
  }
  throw new Error('Lead not found');
}

export async function deleteLead(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('leads').delete().eq('id', id);
  }
  const all = getLocalTable<Lead>('leads');
  setLocalTable('leads', all.filter((l) => l.id !== id));
}

// Lead Notes
export async function fetchLeadNotes(leadId: string): Promise<LeadNote[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('lead_notes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as LeadNote[];
  }
  const all = getLocalTable<LeadNote>('lead_notes');
  return all.filter((n) => n.lead_id === leadId);
}

export async function addLeadNote(leadId: string, content: string, authorName?: string): Promise<LeadNote> {
  const note: LeadNote = {
    id: generateUuid(),
    lead_id: leadId,
    content,
    author_name: authorName || 'Sales Agent',
    created_at: new Date().toISOString(),
  };
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('lead_notes').insert(note).select().single();
    if (!error && data) return data as LeadNote;
  }
  const all = getLocalTable<LeadNote>('lead_notes');
  all.unshift(note);
  setLocalTable('lead_notes', all);
  return note;
}

// ==========================================
// 4. QUOTATIONS
// ==========================================

export async function fetchBusinessQuotations(businessId: string): Promise<Quotation[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('quotations')
      .select('*, quotation_items(*)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((q: any) => ({
        ...q,
        items: q.quotation_items || q.items || [],
      })) as Quotation[];
    }
  }

  const all = getLocalTable<Quotation>('quotations');
  return all.filter((q) => q.business_id === businessId);
}

export async function createQuotation(quotation: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>): Promise<Quotation> {
  const id = generateUuid();
  const itemsWithIds = (quotation.items || []).map((item) => ({
    ...item,
    id: item.id || generateUuid(),
    quotation_id: id,
  }));

  const newQuotation: Quotation = {
    ...quotation,
    id,
    items: itemsWithIds,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('quotations')
      .insert({
        id: newQuotation.id,
        business_id: newQuotation.business_id,
        quote_number: newQuotation.quote_number,
        seller_details: newQuotation.seller_details,
        buyer_id: newQuotation.buyer_id || null,
        buyer_name: newQuotation.buyer_name,
        buyer_company: newQuotation.buyer_company,
        buyer_email: newQuotation.buyer_email,
        currency: newQuotation.currency,
        subtotal: newQuotation.subtotal,
        discount_amount: newQuotation.discount_amount,
        shipping_fee: newQuotation.shipping_fee,
        tax_amount: newQuotation.tax_amount,
        total_amount: newQuotation.total_amount,
        payment_terms: newQuotation.payment_terms,
        delivery_terms: newQuotation.delivery_terms,
        validity_date: newQuotation.validity_date,
        status: newQuotation.status,
        notes: newQuotation.notes,
        is_demo: newQuotation.is_demo || false,
      })
      .select()
      .single();

    if (!error && data) {
      if (itemsWithIds.length > 0) {
        await supabase.from('quotation_items').insert(
          itemsWithIds.map((item) => ({
            id: item.id,
            quotation_id: id,
            product_id: item.product_id || null,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          }))
        );
      }
      return newQuotation;
    }
  }

  const all = getLocalTable<Quotation>('quotations');
  all.unshift(newQuotation);
  setLocalTable('quotations', all);
  return newQuotation;
}

export async function updateQuotation(id: string, updates: Partial<Quotation>): Promise<Quotation> {
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('quotations')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return { ...data, items: updates.items || [] } as Quotation;
  }

  const all = getLocalTable<Quotation>('quotations');
  const index = all.findIndex((q) => q.id === id);
  if (index >= 0) {
    all[index] = { ...all[index], ...updatedData };
    setLocalTable('quotations', all);
    return all[index];
  }
  throw new Error('Quotation not found');
}

// ==========================================
// 5. FOLLOW-UPS
// ==========================================

export async function fetchBusinessFollowUps(businessId: string): Promise<FollowUp[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('business_id', businessId)
      .order('scheduled_date', { ascending: true });

    if (!error && data) return data as FollowUp[];
  }

  const all = getLocalTable<FollowUp>('follow_ups');
  return all.filter((f) => f.business_id === businessId);
}

export async function createFollowUp(followUp: Omit<FollowUp, 'id' | 'created_at' | 'updated_at'>): Promise<FollowUp> {
  const newFollowUp: FollowUp = {
    ...followUp,
    id: generateUuid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('follow_ups').insert(newFollowUp).select().single();
    if (!error && data) return data as FollowUp;
  }

  const all = getLocalTable<FollowUp>('follow_ups');
  all.unshift(newFollowUp);
  setLocalTable('follow_ups', all);
  return newFollowUp;
}

export async function updateFollowUp(id: string, updates: Partial<FollowUp>): Promise<FollowUp> {
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('follow_ups')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data as FollowUp;
  }

  const all = getLocalTable<FollowUp>('follow_ups');
  const index = all.findIndex((f) => f.id === id);
  if (index >= 0) {
    all[index] = { ...all[index], ...updatedData };
    setLocalTable('follow_ups', all);
    return all[index];
  }
  throw new Error('Follow-up not found');
}

// ==========================================
// 6. ORDERS
// ==========================================

export async function fetchBusinessOrders(businessId: string): Promise<Order[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (!error && data) return data as Order[];
  }

  const all = getLocalTable<Order>('orders');
  return all.filter((o) => o.business_id === businessId);
}

export async function createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
  const newOrder: Order = {
    ...order,
    id: generateUuid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('orders').insert(newOrder).select().single();
    if (!error && data) return data as Order;
  }

  const all = getLocalTable<Order>('orders');
  all.unshift(newOrder);
  setLocalTable('orders', all);
  return newOrder;
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  const supabase = getSupabaseClient();

  if (supabase) {
    let oldStatus: string | undefined;
    if (updates.status) {
      const { data: current } = await supabase.from('orders').select('status, business_id').eq('id', id).maybeSingle();
      if (current) {
        oldStatus = current.status;
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      // Record order status history
      if (updates.status && updates.status !== oldStatus) {
        await supabase.from('order_status_history').insert({
          id: generateUuid(),
          business_id: data.business_id,
          order_id: id,
          old_status: oldStatus || null,
          new_status: updates.status,
          notes: `Status transitioned to ${updates.status}`,
          created_at: new Date().toISOString(),
        });
      }
      return data as Order;
    }
  }

  const all = getLocalTable<Order>('orders');
  const index = all.findIndex((o) => o.id === id);
  if (index >= 0) {
    const prevOrder = all[index];
    const oldStatus = prevOrder.status;
    all[index] = { ...prevOrder, ...updatedData };
    setLocalTable('orders', all);

    // Record local status history
    if (updates.status && updates.status !== oldStatus) {
      const historyList = getLocalTable<any>('order_status_history');
      historyList.unshift({
        id: generateUuid(),
        business_id: prevOrder.business_id,
        order_id: id,
        old_status: oldStatus || null,
        new_status: updates.status,
        notes: `Status transitioned to ${updates.status}`,
        created_at: new Date().toISOString(),
      });
      setLocalTable('order_status_history', historyList);
    }

    return all[index];
  }
  throw new Error('Order not found');
}

export async function fetchOrderStatusHistory(orderId: string): Promise<any[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    if (data) return data;
  }
  const all = getLocalTable<any>('order_status_history');
  return all.filter((h) => h.order_id === orderId);
}

// ==========================================
// 7. NOTIFICATIONS
// ==========================================

export async function fetchNotifications(businessId: string): Promise<AppNotification[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) return data as AppNotification[];
  }

  const all = getLocalTable<AppNotification>('notifications');
  return all.filter((n) => n.business_id === businessId);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }
  const all = getLocalTable<AppNotification>('notifications');
  const item = all.find((n) => n.id === id);
  if (item) {
    item.is_read = true;
    setLocalTable('notifications', all);
  }
}

// ==========================================
// 8. SECURE IMAGE UPLOAD (Supabase Storage / Base64 Safe Store)
// ==========================================

export async function uploadProductImage(file: File): Promise<string> {
  // 1. Validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG, PNG, WEBP, and AVIF are permitted.');
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds 5MB limit. Please upload a smaller image.');
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage.from('product-images').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (!error) {
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      if (urlData?.publicUrl) {
        return urlData.publicUrl;
      }
    } else {
      console.warn('Supabase storage upload error, falling back to data URL:', error.message);
    }
  }

  // Fallback: Read as base64 data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    reader.readAsDataURL(file);
  });
}

// ==========================================
// 9. DEMO DATA (Optional, strictly labeled as DEMO)
// ==========================================

export async function loadDemoMarbleBusinessData(userId: string): Promise<{ business: Business; products: Product[]; leads: Lead[]; quotations: Quotation[] }> {
  // 1. Demo Business
  const demoBusiness = await createBusiness({
    user_id: userId,
    name: 'Makrana Heritage Marbles & Crafts [DEMO]',
    owner_name: 'Vikramaditya Rathore',
    country: 'India',
    state: 'Rajasthan',
    city: 'Makrana',
    website: 'https://makrana-heritage.example.com',
    email: 'exports@makrana-heritage.example.com',
    phone: '+91 98290 12345',
    whatsapp: '+91 98290 12345',
    business_type: 'Manufacturer',
    industry: 'Natural Stone, Statues & Architectural Building Materials',
    export_countries: ['United States', 'United Arab Emirates', 'United Kingdom', 'Germany', 'Australia'],
    gst_number: '08AAACH1234F1Z8',
    iec_code: '0812345678',
    description: 'Premier quarry owner and master artisans of pure white Makrana marble, hand-carved temple sanctuaries, outdoor fountains, and custom architectural inlays.',
    currency: 'USD',
    is_demo: true,
  });

  // 2. Demo Products
  const prod1 = await createProduct({
    business_id: demoBusiness.id,
    name: 'Pristine Makrana White Marble Slabs (Bookmatched Premium Grade)',
    sku: 'MKM-WHT-001',
    category: 'Architectural Stone & Slabs',
    description: '100% natural calcite white marble quarried directly from historic Makrana veins. Zero chemical treatment, high crystalline luster, bookmatched polishing.',
    price: 145.0,
    currency: 'USD',
    moq: 200,
    stock_quantity: 4500,
    weight: 48,
    dimensions: '280cm x 160cm x 2cm',
    material: 'Natural Calcite White Marble (Makrana)',
    country_of_origin: 'India',
    hs_code: '68022190',
    shipping_notes: 'Crated in fumigated seaworthy wooden boxes with moisture barrier.',
    payment_terms: '30% T/T Advance, 70% against Bill of Lading (B/L) copy or Irrevocable L/C at sight.',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'],
    is_demo: true,
  });

  const prod2 = await createProduct({
    business_id: demoBusiness.id,
    name: 'Hand-Carved Traditional Temple Mandir with Intricate Floral Jali',
    sku: 'MKM-TMP-042',
    category: 'Temples & Sacred Statuary',
    description: 'Bespoke hand-carved marble home temple crafted by generations of Rajasthani artisans. Features domed shikhara, pillar carvings, and backlit translucent jali screens.',
    price: 3800.0,
    currency: 'USD',
    moq: 1,
    stock_quantity: 12,
    weight: 650,
    dimensions: '180cm x 90cm x 240cm',
    material: 'Grade-A Pure Makrana Sangmarmar Marble',
    country_of_origin: 'India',
    hs_code: '68029100',
    shipping_notes: 'Modular numbered interlocking assembly; packaged in heavy timber crates with EVA foam lining.',
    payment_terms: '50% deposit upon CAD approval, 50% prior to dispatch.',
    images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'],
    is_demo: true,
  });

  // 3. Demo Leads
  const lead1 = await createLead({
    business_id: demoBusiness.id,
    name: 'Marcus Vance',
    company: 'Vance Luxury Surfaces & Interiors LLC [DEMO]',
    country: 'United States',
    email: 'marcus.vance@vanceluxury.example.com',
    phone: '+1 (312) 555-0199',
    website: 'https://vanceluxury.example.com',
    source: 'Export Directory & RFQ',
    product_interest: 'Bookmatched Makrana Slabs for 40-Villa Residential Development in Florida',
    estimated_deal_value: 58000,
    currency: 'USD',
    status: 'Quotation Sent',
    lead_score: 88,
    score_tier: 'High',
    notes: 'Architectural specifications approved. Requested CIF Miami port pricing with sample slab verification.',
    is_demo: true,
  });

  const lead2 = await createLead({
    business_id: demoBusiness.id,
    name: 'Tariq Al-Mansoor',
    company: 'Al-Mansoor Royal Contracting & Stones [DEMO]',
    country: 'United Arab Emirates',
    email: 'tariq@almansoorcontracting.example.com',
    phone: '+971 4 888 1234',
    website: 'https://almansoor.example.com',
    source: 'Trade Fair Dubai',
    product_interest: 'Bespoke Carved Marble Pillars and Fountains for Private Villa Compound',
    estimated_deal_value: 42000,
    currency: 'USD',
    status: 'Negotiation',
    lead_score: 82,
    score_tier: 'High',
    notes: 'Reviewing 3D stone carving mockups. Target shipping date Q4.',
    is_demo: true,
  });

  // 4. Demo Quotation
  const quote1 = await createQuotation({
    business_id: demoBusiness.id,
    quote_number: 'Q-2026-001',
    seller_details: {
      name: demoBusiness.name,
      owner_name: demoBusiness.owner_name,
      email: demoBusiness.email,
      phone: demoBusiness.phone,
      whatsapp: demoBusiness.whatsapp,
      address: 'Industrial Area, Makrana, Rajasthan, India',
      gst_number: demoBusiness.gst_number,
      iec_code: demoBusiness.iec_code,
    },
    buyer_id: lead1.id,
    buyer_name: lead1.name,
    buyer_company: lead1.company,
    buyer_email: lead1.email,
    buyer_country: lead1.country,
    buyer_phone: lead1.phone,
    currency: 'USD',
    items: [
      {
        id: generateUuid(),
        product_id: prod1.id,
        description: 'Bookmatched Makrana White Marble Slabs (280x160x2cm) - Export Polished',
        quantity: 350,
        unit_price: 145.0,
        total_price: 50750.0,
      },
      {
        id: generateUuid(),
        description: 'Seaworthy Fumigated Heavy Wooden Crate Packaging with Strapping',
        quantity: 14,
        unit_price: 120.0,
        total_price: 1680.0,
      },
    ],
    subtotal: 52430.0,
    discount_amount: 1500.0,
    shipping_fee: 4800.0,
    tax_amount: 0.0, // Export zero-rated
    total_amount: 55730.0,
    payment_terms: '30% T/T advance deposit upon confirmation, 70% balance against copy of Bill of Lading.',
    delivery_terms: 'CIF Port of Miami, FL, USA (Incoterms 2020)',
    validity_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'Sent',
    notes: 'Insurance covered under Institute Cargo Clauses (A) 110% value.',
    is_demo: true,
  });

  // 5. Demo Follow-up
  await createFollowUp({
    business_id: demoBusiness.id,
    lead_id: lead1.id,
    lead_name: lead1.name,
    lead_company: lead1.company,
    quotation_id: quote1.id,
    quote_number: quote1.quote_number,
    scheduled_date: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'Pending',
    title: 'Follow-up #1: Confirm Slab Sample Delivery & Freight Booking',
    sequence_number: 1,
    channel: 'Email',
    message_draft: `Dear Marcus,\n\nFollowing our quotation Q-2026-001 for the 350 sq.m bookmatched Makrana slabs, our logistics team has confirmed container space allocation for CIF Miami dispatch. Did you have a chance to review the test certificates?\n\nBest regards,\nVikramaditya Rathore`,
    is_demo: true,
  });

  return {
    business: demoBusiness,
    products: [prod1, prod2],
    leads: [lead1, lead2],
    quotations: [quote1],
  };
}

export async function clearDemoData(businessId?: string): Promise<void> {
  const tables = ['businesses', 'products', 'leads', 'quotations', 'follow_ups', 'orders', 'notifications'];
  for (const t of tables) {
    const records = getLocalTable<any>(t);
    const filtered = records.filter((r) => !r.is_demo && (!businessId || r.business_id !== businessId));
    setLocalTable(t, filtered);
  }
}

export async function resetToDemoData(): Promise<any> {
  await clearDemoData();
  return loadDemoMarbleBusinessData('demo-owner-default');
}

// ==========================================
// 8. INVOICES
// ==========================================

export async function fetchBusinessInvoices(businessId: string): Promise<Invoice[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((inv: any) => ({
        ...inv,
        items: inv.invoice_items || [],
      })) as Invoice[];
    }
  }

  const all = getLocalTable<Invoice>('invoices');
  return all.filter((i) => i.business_id === businessId);
}

export async function createInvoice(
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>,
  items: Omit<InvoiceItem, 'id' | 'invoice_id'>[] = []
): Promise<Invoice> {
  const id = generateUuid();
  const created_at = new Date().toISOString();
  const invoiceNumber = invoice.invoice_number || `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const newInvoice: Invoice = {
    ...invoice,
    id,
    invoice_number: invoiceNumber,
    created_at,
    updated_at: created_at,
    items: items.map((it) => ({
      ...it,
      id: generateUuid(),
      invoice_id: id,
    })),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { items: _, ...invRecord } = newInvoice;
    const { data, error } = await supabase.from('invoices').insert(invRecord).select().single();
    if (!error && data) {
      if (newInvoice.items && newInvoice.items.length > 0) {
        await supabase.from('invoice_items').insert(newInvoice.items);
      }
      return newInvoice;
    }
  }

  const all = getLocalTable<Invoice>('invoices');
  all.unshift(newInvoice);
  setLocalTable('invoices', all);
  return newInvoice;
}

export async function updateInvoiceStatus(
  id: string,
  paymentStatus: Invoice['payment_status'],
  amountPaid?: number
): Promise<void> {
  const updates: any = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };
  if (amountPaid !== undefined) {
    updates.amount_paid = amountPaid;
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('invoices').update(updates).eq('id', id);
  }

  const all = getLocalTable<Invoice>('invoices');
  const idx = all.findIndex((i) => i.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates };
    setLocalTable('invoices', all);
  }
}

// ==========================================
// 9. BANKING & PAYOUTS
// ==========================================

export async function fetchBankAccounts(businessId: string): Promise<BankAccount[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (!error && data) return data as BankAccount[];
  }

  const all = getLocalTable<BankAccount>('bank_accounts');
  return all.filter((b) => b.business_id === businessId);
}

export async function createBankAccount(
  account: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>
): Promise<BankAccount> {
  const newAccount: BankAccount = {
    ...account,
    id: generateUuid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('bank_accounts').insert(newAccount).select().single();
    if (!error && data) return data as BankAccount;
  }

  const all = getLocalTable<BankAccount>('bank_accounts');
  all.unshift(newAccount);
  setLocalTable('bank_accounts', all);
  return newAccount;
}

export async function fetchBankTransactions(businessId: string): Promise<BankTransaction[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false });

    if (!error && data) return data as BankTransaction[];
  }

  const all = getLocalTable<BankTransaction>('bank_transactions');
  return all.filter((t) => t.business_id === businessId);
}

export async function fetchPayouts(businessId: string): Promise<Payout[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (!error && data) return data as Payout[];
  }

  const all = getLocalTable<Payout>('payouts');
  return all.filter((p) => p.business_id === businessId);
}

export async function fetchExpenses(businessId: string): Promise<Expense[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false });

    if (!error && data) return data as Expense[];
  }

  const all = getLocalTable<Expense>('expenses');
  return all.filter((e) => e.business_id === businessId);
}

export async function createExpense(
  expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>
): Promise<Expense> {
  const newExpense: Expense = {
    ...expense,
    id: generateUuid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('expenses').insert(newExpense).select().single();
    if (!error && data) return data as Expense;
  }

  const all = getLocalTable<Expense>('expenses');
  all.unshift(newExpense);
  setLocalTable('expenses', all);
  return newExpense;
}

// ==========================================
// 10. INVENTORY MOVEMENTS
// ==========================================

export async function fetchInventoryMovements(
  businessId: string,
  productId?: string
): Promise<InventoryMovement[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    let query = supabase
      .from('inventory_movements')
      .select('*, products(name, sku)')
      .eq('business_id', businessId);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) return data as InventoryMovement[];
  }

  const all = getLocalTable<InventoryMovement>('inventory_movements');
  return all.filter((m) => m.business_id === businessId && (!productId || m.product_id === productId));
}

export async function recordInventoryMovement(
  movement: Omit<InventoryMovement, 'id' | 'created_at'>
): Promise<InventoryMovement> {
  const newMovement: InventoryMovement = {
    ...movement,
    id: generateUuid(),
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('inventory_movements').insert(newMovement).select().single();
    if (!error && data) return data as InventoryMovement;
  }

  const all = getLocalTable<InventoryMovement>('inventory_movements');
  all.unshift(newMovement);
  setLocalTable('inventory_movements', all);
  return newMovement;
}

// ==========================================
// 11. AUDIT LOGS
// ==========================================

export async function fetchAuditLogs(businessId: string): Promise<AuditLog[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) return data as AuditLog[];
  }

  const all = getLocalTable<AuditLog>('audit_logs');
  return all.filter((a) => a.business_id === businessId);
}

// ==========================================
// 12. TEAM MEMBERS & ROLES
// ==========================================

export async function fetchBusinessMembers(businessId: string): Promise<BusinessMember[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('business_members')
      .select('*')
      .eq('business_id', businessId);

    if (!error && data) return data as BusinessMember[];
  }

  const all = getLocalTable<BusinessMember>('business_members');
  return all.filter((m) => m.business_id === businessId);
}

// ==========================================
// 13. DOCUMENTS & SUPABASE STORAGE
// ==========================================

export async function fetchDocuments(businessId: string): Promise<DocumentRecord[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (!error && data) return data as DocumentRecord[];
  }

  const all = getLocalTable<DocumentRecord>('documents');
  return all.filter((d) => d.business_id === businessId);
}

export async function uploadDocumentFile(
  businessId: string,
  file: File,
  category: DocumentRecord['category'] = 'Other'
): Promise<DocumentRecord> {
  const supabase = getSupabaseClient();
  const fileExt = file.name.split('.').pop() || 'dat';
  const filePath = `${businessId}/${Date.now()}_${generateUuid().slice(0, 8)}.${fileExt}`;

  let publicUrl = '';

  if (supabase) {
    const { error: uploadError } = await supabase.storage
      .from('business-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('business-documents').getPublicUrl(filePath);
      publicUrl = urlData?.publicUrl || '';
    }
  }

  // Fallback to local blob url if storage unavailable
  if (!publicUrl) {
    publicUrl = URL.createObjectURL(file);
  }

  const docRecord: DocumentRecord = {
    id: generateUuid(),
    business_id: businessId,
    title: file.name,
    category,
    file_path: filePath,
    file_size_bytes: file.size,
    mime_type: file.type || 'application/octet-stream',
    public_url: publicUrl,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    await supabase.from('documents').insert(docRecord);
  }

  const all = getLocalTable<DocumentRecord>('documents');
  all.unshift(docRecord);
  setLocalTable('documents', all);

  return docRecord;
}

// ==========================================
// 14. RFQ / BUYER DEMANDS
// ==========================================

export async function fetchRFQs(): Promise<RFQ[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('rfqs')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data as RFQ[];
  }
  return getLocalTable<RFQ>('rfqs');
}

export async function createRFQ(rfqData: Omit<RFQ, 'id' | 'created_at' | 'updated_at' | 'responses_count'>): Promise<RFQ> {
  const newRfq: RFQ = {
    ...rfqData,
    id: generateUuid(),
    responses_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('rfqs').insert(newRfq).select().single();
    if (!error && data) return data as RFQ;
  }

  const all = getLocalTable<RFQ>('rfqs');
  all.unshift(newRfq);
  setLocalTable('rfqs', all);
  return newRfq;
}

export async function fetchRFQResponses(rfqId: string): Promise<RFQResponse[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('rfq_responses')
      .select('*')
      .eq('rfq_id', rfqId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as RFQResponse[];
  }
  const all = getLocalTable<RFQResponse>('rfq_responses');
  return all.filter((r) => r.rfq_id === rfqId);
}

export async function createRFQResponse(
  respData: Omit<RFQResponse, 'id' | 'created_at'>
): Promise<RFQResponse> {
  const newResp: RFQResponse = {
    ...respData,
    id: generateUuid(),
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('rfq_responses').insert(newResp);
  }

  const all = getLocalTable<RFQResponse>('rfq_responses');
  all.unshift(newResp);
  setLocalTable('rfq_responses', all);
  return newResp;
}

// ==========================================
// 15. WEBSITE BUILDER & STOREFRONTS
// ==========================================

export async function fetchBusinessStore(businessId: string): Promise<BusinessStore | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();
    if (!error && data) return data as BusinessStore;
  }

  const all = getLocalTable<BusinessStore>('stores');
  return all.find((s) => s.business_id === businessId) || null;
}

export async function saveBusinessStore(storeData: Partial<BusinessStore> & { business_id: string }): Promise<BusinessStore> {
  const existing = await fetchBusinessStore(storeData.business_id);
  const updatedStore: BusinessStore = {
    id: existing?.id || generateUuid(),
    business_id: storeData.business_id,
    slug: storeData.slug || `store-${storeData.business_id.slice(0, 8)}`,
    site_title: storeData.site_title || 'Official Storefront',
    tagline: storeData.tagline || 'Leading exporter & manufacturer',
    meta_description: storeData.meta_description || '',
    logo_url: storeData.logo_url || '',
    banner_url: storeData.banner_url || '',
    theme: storeData.theme || {
      primary_color: '#2563eb',
      accent_color: '#4f46e5',
      font_family: 'Inter',
      layout_style: 'modern',
      dark_mode: false,
    },
    sections: storeData.sections || [],
    is_published: storeData.is_published ?? true,
    social_links: storeData.social_links || {},
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('stores').upsert(updatedStore);
  }

  const all = getLocalTable<BusinessStore>('stores');
  const index = all.findIndex((s) => s.business_id === storeData.business_id);
  if (index >= 0) {
    all[index] = updatedStore;
  } else {
    all.unshift(updatedStore);
  }
  setLocalTable('stores', all);

  return updatedStore;
}

// ==========================================
// 16. BUSINESS CHAT & MESSAGING
// ==========================================

export async function fetchConversations(businessId: string): Promise<Conversation[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('business_id', businessId)
      .order('last_message_at', { ascending: false });
    if (!error && data) return data as Conversation[];
  }

  const all = getLocalTable<Conversation>('conversations');
  return all.filter((c) => c.business_id === businessId);
}

export async function createConversation(convData: Omit<Conversation, 'id' | 'created_at' | 'last_message_at' | 'unread_count'>): Promise<Conversation> {
  const newConv: Conversation = {
    ...convData,
    id: generateUuid(),
    last_message_at: new Date().toISOString(),
    unread_count: 0,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('conversations').insert(newConv);
  }

  const all = getLocalTable<Conversation>('conversations');
  all.unshift(newConv);
  setLocalTable('conversations', all);
  return newConv;
}

export async function fetchMessages(conversationId: string): Promise<ConversationMessage[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (!error && data) return data as ConversationMessage[];
  }

  const all = getLocalTable<ConversationMessage>('messages');
  return all.filter((m) => m.conversation_id === conversationId);
}

export async function sendMessage(msgData: Omit<ConversationMessage, 'id' | 'created_at' | 'is_read'>): Promise<ConversationMessage> {
  const newMsg: ConversationMessage = {
    ...msgData,
    id: generateUuid(),
    is_read: false,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('messages').insert(newMsg);
    await supabase
      .from('conversations')
      .update({
        last_message: newMsg.message,
        last_message_at: newMsg.created_at,
      })
      .eq('id', newMsg.conversation_id);
  }

  const all = getLocalTable<ConversationMessage>('messages');
  all.push(newMsg);
  setLocalTable('messages', all);

  // Update conversation last_message locally
  const convs = getLocalTable<Conversation>('conversations');
  const cIdx = convs.findIndex((c) => c.id === newMsg.conversation_id);
  if (cIdx >= 0) {
    convs[cIdx].last_message = newMsg.message;
    convs[cIdx].last_message_at = newMsg.created_at;
    setLocalTable('conversations', convs);
  }

  return newMsg;
}

// ==========================================
// 17. INTERNAL ADVERTISING PLATFORM
// ==========================================

export async function fetchAdCampaigns(businessId: string): Promise<AdCampaign[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('advertising_campaigns')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as AdCampaign[];
  }

  const all = getLocalTable<AdCampaign>('advertising_campaigns');
  return all.filter((c) => c.business_id === businessId);
}

export async function createAdCampaign(
  campaignData: Omit<AdCampaign, 'id' | 'created_at' | 'spend' | 'impressions' | 'clicks' | 'conversions'>
): Promise<AdCampaign> {
  const newCampaign: AdCampaign = {
    ...campaignData,
    id: generateUuid(),
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('advertising_campaigns').insert(newCampaign);
  }

  const all = getLocalTable<AdCampaign>('advertising_campaigns');
  all.unshift(newCampaign);
  setLocalTable('advertising_campaigns', all);
  return newCampaign;
}

export async function updateAdCampaignStatus(id: string, status: AdCampaign['status']): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('advertising_campaigns').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  }

  const all = getLocalTable<AdCampaign>('advertising_campaigns');
  const index = all.findIndex((c) => c.id === id);
  if (index >= 0) {
    all[index].status = status;
    all[index].updated_at = new Date().toISOString();
    setLocalTable('advertising_campaigns', all);
  }
}

// ==========================================
// 18. RETURNS, REFUNDS & DISPUTES
// ==========================================

export async function fetchOrderReturns(businessId: string): Promise<OrderReturn[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('order_returns')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as OrderReturn[];
  }

  const all = getLocalTable<OrderReturn>('order_returns');
  return all.filter((r) => r.business_id === businessId);
}

export async function createOrderReturn(
  retData: Omit<OrderReturn, 'id' | 'created_at' | 'updated_at'>
): Promise<OrderReturn> {
  const newRet: OrderReturn = {
    ...retData,
    id: generateUuid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('order_returns').insert(newRet);
  }

  const all = getLocalTable<OrderReturn>('order_returns');
  all.unshift(newRet);
  setLocalTable('order_returns', all);
  return newRet;
}

export async function updateOrderReturnStatus(id: string, status: OrderReturn['status']): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('order_returns').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  }

  const all = getLocalTable<OrderReturn>('order_returns');
  const idx = all.findIndex((r) => r.id === id);
  if (idx >= 0) {
    all[idx].status = status;
    all[idx].updated_at = new Date().toISOString();
    setLocalTable('order_returns', all);
  }
}

export async function fetchOrderDisputes(businessId: string): Promise<OrderDispute[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('order_disputes')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as OrderDispute[];
  }

  const all = getLocalTable<OrderDispute>('order_disputes');
  return all.filter((d) => d.business_id === businessId);
}

export async function createOrderDispute(
  dispData: Omit<OrderDispute, 'id' | 'created_at' | 'updated_at'>
): Promise<OrderDispute> {
  const newDisp: OrderDispute = {
    ...dispData,
    id: generateUuid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('order_disputes').insert(newDisp);
  }

  const all = getLocalTable<OrderDispute>('order_disputes');
  all.unshift(newDisp);
  setLocalTable('order_disputes', all);
  return newDisp;
}

// ==========================================
// 19. GLOBAL MARKETPLACE QUERIES
// ==========================================

export async function fetchMarketplaceProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      return data.map((p: any) => ({
        ...p,
        images: p.product_images ? p.product_images.map((img: any) => img.url) : (p.images || []),
      })) as Product[];
    }
  }

  return getLocalTable<Product>('products');
}

export async function fetchMarketplaceSuppliers(): Promise<Business[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) return data as Business[];
  }

  return getLocalTable<Business>('businesses');
}

// ==========================================
// 20. PLATFORM ADMIN METRICS
// ==========================================

export async function fetchPlatformAdminStats(): Promise<AdminPlatformStats> {
  const businesses = getLocalTable<Business>('businesses');
  const products = getLocalTable<Product>('products');
  const rfqs = getLocalTable<RFQ>('rfqs');
  const orders = getLocalTable<Order>('orders');
  const ads = getLocalTable<AdCampaign>('advertising_campaigns');
  const disputes = getLocalTable<OrderDispute>('order_disputes');

  const totalGmv = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return {
    total_users: 1 + businesses.length,
    total_businesses: businesses.length,
    verified_businesses: businesses.filter((b) => !b.is_demo).length,
    total_products: products.length,
    total_rfqs: rfqs.length,
    total_orders: orders.length,
    total_gmv: totalGmv,
    active_ad_campaigns: ads.filter((a) => a.status === 'ACTIVE').length,
    open_disputes: disputes.filter((d) => d.status === 'OPEN').length,
    system_health: 'healthy',
  };
}

// Convenience global fetch aliases
export const fetchProducts = async (businessId?: string): Promise<Product[]> => {
  if (businessId && businessId !== 'demo') {
    return fetchBusinessProducts(businessId);
  }
  return fetchMarketplaceProducts();
};

export const fetchLeads = async (businessId?: string): Promise<Lead[]> => {
  if (businessId && businessId !== 'demo') {
    return fetchBusinessLeads(businessId);
  }
  return getLocalTable<Lead>('leads');
};

export const fetchOrders = async (businessId?: string): Promise<Order[]> => {
  if (businessId && businessId !== 'demo') {
    return fetchBusinessOrders(businessId);
  }
  return getLocalTable<Order>('orders');
};

// ==========================================
// 21. BUSINESS LOCATIONS
// ==========================================

export async function fetchBusinessLocations(businessId: string): Promise<BusinessLocation[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('business_locations')
      .select('*')
      .eq('business_id', businessId)
      .order('is_primary', { ascending: false });

    if (!error && data) {
      return data as BusinessLocation[];
    }
  }

  const all = getLocalTable<BusinessLocation>('business_locations');
  return all.filter((l) => l.business_id === businessId);
}

export async function createBusinessLocation(
  location: Omit<BusinessLocation, 'id' | 'created_at'>
): Promise<BusinessLocation> {
  const newLoc: BusinessLocation = {
    ...location,
    id: generateUuid(),
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('business_locations').insert(newLoc).select().single();
    if (!error && data) {
      return data as BusinessLocation;
    }
  }

  const all = getLocalTable<BusinessLocation>('business_locations');
  all.push(newLoc);
  setLocalTable('business_locations', all);
  return newLoc;
}

export async function updateBusinessLocation(
  id: string,
  updates: Partial<BusinessLocation>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('business_locations').update(updates).eq('id', id);
  }

  const all = getLocalTable<BusinessLocation>('business_locations');
  const index = all.findIndex((l) => l.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates };
    setLocalTable('business_locations', all);
  }
}

export async function deleteBusinessLocation(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('business_locations').delete().eq('id', id);
  }

  const all = getLocalTable<BusinessLocation>('business_locations');
  setLocalTable('business_locations', all.filter((l) => l.id !== id));
}

// ==========================================
// 22. GLOBAL MEDIA ASSETS
// ==========================================

export async function fetchGlobalMediaAssets(
  businessId: string,
  filter?: { media_type?: string; category?: string }
): Promise<GlobalMediaAsset[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    let query = supabase.from('global_media_assets').select('*').eq('business_id', businessId);
    if (filter?.media_type && filter.media_type !== 'all') {
      query = query.eq('media_type', filter.media_type);
    }
    if (filter?.category && filter.category !== 'all') {
      query = query.eq('category', filter.category);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) {
      return data as GlobalMediaAsset[];
    }
  }

  const all = getLocalTable<GlobalMediaAsset>('global_media_assets');
  let result = all.filter((m) => m.business_id === businessId);
  if (filter?.media_type && filter.media_type !== 'all') {
    result = result.filter((m) => m.media_type === filter.media_type);
  }
  if (filter?.category && filter.category !== 'all') {
    result = result.filter((m) => m.category === filter.category);
  }
  return result;
}

export async function createGlobalMediaAsset(
  asset: Omit<GlobalMediaAsset, 'id' | 'created_at' | 'updated_at'>
): Promise<GlobalMediaAsset> {
  const newAsset: GlobalMediaAsset = {
    ...asset,
    id: generateUuid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('global_media_assets').insert(newAsset).select().single();
    if (!error && data) {
      return data as GlobalMediaAsset;
    }
  }

  const all = getLocalTable<GlobalMediaAsset>('global_media_assets');
  all.unshift(newAsset);
  setLocalTable('global_media_assets', all);
  return newAsset;
}

export async function deleteGlobalMediaAsset(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('global_media_assets').delete().eq('id', id);
  }

  const all = getLocalTable<GlobalMediaAsset>('global_media_assets');
  setLocalTable('global_media_assets', all.filter((a) => a.id !== id));
}

// ==========================================
// 23. MIGRATION STATUS & AUDIT
// ==========================================

export async function fetchMigrationStatus(): Promise<MigrationRecord[]> {
  const migrations: MigrationRecord[] = [
    {
      id: 'mig-001',
      version: '20260901_initial_core',
      name: '001_core_profiles_businesses_products.sql',
      executed_at: '2026-09-01T00:00:00Z',
      status: 'Applied',
      duration_ms: 120,
    },
    {
      id: 'mig-002',
      version: '20260910_rfq_and_quotations',
      name: '002_rfqs_quotations_orders_invoices.sql',
      executed_at: '2026-09-10T00:00:00Z',
      status: 'Applied',
      duration_ms: 245,
    },
    {
      id: 'mig-003',
      version: '20260918_banking_and_rls',
      name: '003_bank_accounts_transactions_audit_logs.sql',
      executed_at: '2026-09-18T00:00:00Z',
      status: 'Applied',
      duration_ms: 180,
    },
    {
      id: 'mig-004',
      version: '20260926_vyra_locations_media',
      name: '004_vyra_sellers_section.sql',
      executed_at: '2026-09-26T00:00:00Z',
      status: 'Applied',
      duration_ms: 195,
    },
    {
      id: 'mig-005',
      version: '20261005_vyra_master_production',
      name: '005_vyra_master_production.sql',
      status: 'Pending',
      error: 'PENDING — MANUAL ACTION REQUIRED: Apply 005_vyra_master_production.sql in Supabase SQL editor or CLI',
    },
  ];
  return migrations;
}

// ==========================================
// 24. SELLERS & SUPPLIER OPERATIONS
// ==========================================

export async function recordAuditLog(
  businessId: string,
  action: string,
  entityType: string,
  entityId?: string,
  description?: string,
  metadata?: Record<string, any>
): Promise<AuditLog> {
  const newLog: AuditLog = {
    id: generateUuid(),
    business_id: businessId,
    user_id: metadata?.user_id || 'system-user',
    action,
    entity_type: entityType,
    entity_id: entityId,
    module: entityType,
    record_id: entityId,
    description: description || `${action} on ${entityType}`,
    metadata,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('audit_logs').insert(newLog);
    } catch (e) {
      console.warn('Supabase audit log insert error:', e);
    }
  }

  const all = getLocalTable<AuditLog>('audit_logs');
  all.unshift(newLog);
  setLocalTable('audit_logs', all.slice(0, 500));
  return newLog;
}

export async function fetchSellers(filters?: {
  search?: string;
  verification?: string;
  operationalStatus?: string;
  country?: string;
  category?: string;
  businessType?: string;
  sortBy?: 'created_at' | 'name' | 'products_count' | 'orders_count' | 'revenue';
  sortOrder?: 'asc' | 'desc';
}): Promise<SellerProfile[]> {
  let businesses: Business[] = [];
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      businesses = data as Business[];
    }
  }
  if (businesses.length === 0) {
    businesses = getLocalTable<Business>('businesses');
  }

  // Related real records for metric computation
  const allProducts = getLocalTable<Product>('products');
  const allOrders = getLocalTable<Order>('orders');
  const allQuotes = getLocalTable<Quotation>('quotations');
  const allRfqs = getLocalTable<RFQ>('rfqs');
  const sellerProfilesData = getLocalTable<any>('seller_profiles');

  const sellers: SellerProfile[] = businesses.map((b) => {
    const sp = sellerProfilesData.find((p: any) => p.business_id === b.id) || {};
    const sellerProducts = allProducts.filter((p) => p.business_id === b.id);
    const sellerOrders = allOrders.filter((o) => (o as any).seller_business_id === b.id || (o as any).business_id === b.id);
    const sellerQuotes = allQuotes.filter((q) => q.business_id === b.id);
    const sellerRfqResponses = allRfqs.filter((r) => r.business_id === b.id || (r as any).seller_id === b.id).length;
    
    // True revenue calculated only from real orders
    const totalRev = sellerOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    // Normalizing verification status
    let normVerif: 'Verified' | 'Pending' | 'Unverified' | 'Rejected' = 'Unverified';
    const rawVerif = (b.verification_status || sp.verification_status || 'unverified').toLowerCase();
    if (rawVerif === 'verified') normVerif = 'Verified';
    else if (rawVerif === 'pending') normVerif = 'Pending';
    else if (rawVerif === 'rejected') normVerif = 'Rejected';
    else normVerif = 'Unverified';

    const opStatus: 'Active' | 'Suspended' | 'Inactive' = sp.operational_status || b.operational_status || 'Active';

    return {
      ...b,
      ...sp,
      verification_status_normalized: normVerif,
      operational_status: opStatus,
      products_count: sellerProducts.length,
      orders_count: sellerOrders.length,
      quotations_count: sellerQuotes.length,
      rfq_responses_count: sellerRfqResponses,
      total_revenue: totalRev,
      moq: sp.moq || b.moq || 1,
      manufacturing_capacity: sp.manufacturing_capacity || b.manufacturing_capacity || (b.business_type === 'Manufacturer' ? 'Available upon request' : undefined),
      trading_capacity: sp.trading_capacity || b.trading_capacity,
      shipping_capabilities: sp.shipping_capabilities || b.shipping_capabilities || ['FOB', 'CIF', 'Air Express', 'Ocean Freight'],
      export_ports: sp.export_ports || b.export_ports || (b.city ? [`Port of ${b.city}`] : []),
      lead_time_days: sp.lead_time_days || b.lead_time_days || 7,
      quality_certifications: sp.quality_certifications || b.quality_certifications || [],
      gallery_urls: sp.gallery_urls || b.gallery_urls || [],
      shop_photos_urls: sp.shop_photos_urls || b.shop_photos_urls || [],
      factory_photos_urls: sp.factory_photos_urls || b.factory_photos_urls || [],
      video_urls: sp.video_urls || b.video_urls || [],
      catalog_urls: sp.catalog_urls || b.catalog_urls || [],
      social_links: sp.social_links || b.social_links || {},
      last_activity_at: b.updated_at || b.created_at || new Date().toISOString(),
    };
  });

  // Apply filters
  let filtered = sellers;

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.owner_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.industry?.toLowerCase().includes(q)
    );
  }

  if (filters?.verification && filters.verification !== 'All') {
    filtered = filtered.filter((s) => s.verification_status_normalized === filters.verification);
  }

  if (filters?.operationalStatus && filters.operationalStatus !== 'All') {
    filtered = filtered.filter((s) => s.operational_status === filters.operationalStatus);
  }

  if (filters?.country && filters.country !== 'All') {
    filtered = filtered.filter((s) => s.country.toLowerCase() === filters.country!.toLowerCase());
  }

  if (filters?.category && filters.category !== 'All') {
    filtered = filtered.filter(
      (s) =>
        s.category?.toLowerCase() === filters.category!.toLowerCase() ||
        s.industry?.toLowerCase() === filters.category!.toLowerCase()
    );
  }

  if (filters?.businessType && filters.businessType !== 'All') {
    filtered = filtered.filter((s) => s.business_type === filters.businessType);
  }

  // Sort
  if (filters?.sortBy) {
    const field = filters.sortBy;
    const order = filters.sortOrder === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      if (field === 'name') return a.name.localeCompare(b.name) * order;
      if (field === 'products_count') return ((a.products_count || 0) - (b.products_count || 0)) * order;
      if (field === 'orders_count') return ((a.orders_count || 0) - (b.orders_count || 0)) * order;
      if (field === 'revenue') return ((a.total_revenue || 0) - (b.total_revenue || 0)) * order;
      return (new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()) * order;
    });
  }

  return filtered;
}

export async function fetchSellerById(sellerId: string): Promise<SellerProfile | null> {
  const all = await fetchSellers();
  return all.find((s) => s.id === sellerId) || null;
}

export async function createSeller(sellerData: Partial<SellerProfile>): Promise<SellerProfile> {
  const newBiz = await createBusiness({
    name: sellerData.name || 'New Enterprise Seller',
    owner_name: sellerData.owner_name || 'Business Executive',
    country: sellerData.country || 'Global',
    state: sellerData.state,
    city: sellerData.city,
    website: sellerData.website,
    email: sellerData.email,
    phone: sellerData.phone,
    whatsapp: sellerData.whatsapp,
    business_type: sellerData.business_type || 'Manufacturer',
    industry: sellerData.industry || 'Commerce & Trade',
    category: sellerData.category || 'General Wholesale',
    subcategory: sellerData.subcategory,
    export_countries: sellerData.export_countries || [],
    gst_number: sellerData.gst_number,
    iec_code: sellerData.iec_code,
    description: sellerData.description || 'Verified seller on VYRA Global Network',
    logo_url: sellerData.logo_url,
    cover_image_url: sellerData.cover_image_url,
    legal_name: sellerData.legal_name || sellerData.name,
    brand_name: sellerData.brand_name || sellerData.name,
    year_established: sellerData.year_established || new Date().getFullYear(),
    employee_count: sellerData.employee_count || '10-50',
    registration_number: sellerData.registration_number,
    tax_id: sellerData.tax_id,
    address_line1: sellerData.address_line1,
    address_line2: sellerData.address_line2,
    building: sellerData.building,
    street: sellerData.street,
    area: sellerData.area,
    postal_code: sellerData.postal_code,
    verification_status: sellerData.verification_status || 'pending',
    currency: sellerData.currency || 'USD',
  });

  const sp = {
    business_id: newBiz.id,
    operational_status: sellerData.operational_status || 'Active',
    verification_status: sellerData.verification_status || 'Pending',
    moq: sellerData.moq || 1,
    manufacturing_capacity: sellerData.manufacturing_capacity,
    trading_capacity: sellerData.trading_capacity,
    shipping_capabilities: sellerData.shipping_capabilities || ['FOB', 'CIF'],
    export_ports: sellerData.export_ports || [],
    lead_time_days: sellerData.lead_time_days || 7,
    gallery_urls: sellerData.gallery_urls || [],
    shop_photos_urls: sellerData.shop_photos_urls || [],
    factory_photos_urls: sellerData.factory_photos_urls || [],
    video_urls: sellerData.video_urls || [],
    catalog_urls: sellerData.catalog_urls || [],
    social_links: sellerData.social_links || {},
    updated_at: new Date().toISOString(),
  };

  const allSP = getLocalTable<any>('seller_profiles');
  allSP.unshift(sp);
  setLocalTable('seller_profiles', allSP);

  await recordAuditLog(newBiz.id, 'CREATE_SELLER', 'seller_profile', newBiz.id, `Created seller business ${newBiz.name}`, { seller: newBiz });

  const fetched = await fetchSellerById(newBiz.id);
  return fetched || (newBiz as SellerProfile);
}

export async function updateSeller(sellerId: string, updates: Partial<SellerProfile>): Promise<SellerProfile> {
  await updateBusiness(sellerId, updates);

  const allSP = getLocalTable<any>('seller_profiles');
  const idx = allSP.findIndex((p: any) => p.business_id === sellerId);
  if (idx >= 0) {
    allSP[idx] = { ...allSP[idx], ...updates, updated_at: new Date().toISOString() };
  } else {
    allSP.unshift({ business_id: sellerId, ...updates, updated_at: new Date().toISOString() });
  }
  setLocalTable('seller_profiles', allSP);

  await recordAuditLog(sellerId, 'UPDATE_SELLER', 'seller_profile', sellerId, `Updated seller business details for ${sellerId}`, { updates });

  const updated = await fetchSellerById(sellerId);
  return updated!;
}

export async function updateSellerVerification(
  sellerId: string,
  status: 'Verified' | 'Rejected' | 'Pending',
  reason?: string,
  reviewerName?: string
): Promise<SellerProfile> {
  const updates: Partial<SellerProfile> = {
    verification_status: status.toLowerCase() as any,
    verification_status_normalized: status,
    verification_notes: reason,
    rejection_reason: status === 'Rejected' ? reason : undefined,
    verified_at: status === 'Verified' ? new Date().toISOString() : undefined,
    verified_by: reviewerName || 'Compliance Officer',
  };

  await updateBusiness(sellerId, {
    verification_status: status.toLowerCase() as any,
  });

  const allSP = getLocalTable<any>('seller_profiles');
  const idx = allSP.findIndex((p: any) => p.business_id === sellerId);
  if (idx >= 0) {
    allSP[idx] = { ...allSP[idx], ...updates, updated_at: new Date().toISOString() };
  } else {
    allSP.unshift({ business_id: sellerId, ...updates, updated_at: new Date().toISOString() });
  }
  setLocalTable('seller_profiles', allSP);

  await recordAuditLog(
    sellerId,
    `SELLER_VERIFICATION_${status.toUpperCase()}`,
    'seller_verification',
    sellerId,
    `Seller verification set to ${status}. Notes: ${reason || 'None'}`,
    { status, reason, reviewerName }
  );

  // In-app Notification for Seller
  const notif: AppNotification = {
    id: generateUuid(),
    business_id: sellerId,
    title: `Seller Verification ${status}`,
    message: status === 'Verified'
      ? 'Congratulations! Your seller credentials have been approved by compliance. Verified Seller badge is now live.'
      : status === 'Rejected'
      ? `Verification not approved: ${reason || 'Incomplete documentation'}. Please update your certificates.`
      : 'Your verification submission is currently under compliance review.',
    type: status === 'Verified' ? 'quote_status' : 'order_status',
    link: 'sellers',
    is_read: false,
    created_at: new Date().toISOString(),
  };
  const allNotifs = getLocalTable<AppNotification>('notifications');
  allNotifs.unshift(notif);
  setLocalTable('notifications', allNotifs);

  const updated = await fetchSellerById(sellerId);
  return updated!;
}

export async function updateSellerOperationalStatus(
  sellerId: string,
  status: 'Active' | 'Suspended',
  reason?: string
): Promise<SellerProfile> {
  const allSP = getLocalTable<any>('seller_profiles');
  const idx = allSP.findIndex((p: any) => p.business_id === sellerId);
  if (idx >= 0) {
    allSP[idx] = { ...allSP[idx], operational_status: status, updated_at: new Date().toISOString() };
  } else {
    allSP.unshift({ business_id: sellerId, operational_status: status, updated_at: new Date().toISOString() });
  }
  setLocalTable('seller_profiles', allSP);

  await recordAuditLog(
    sellerId,
    `SELLER_STATUS_${status.toUpperCase()}`,
    'seller_status',
    sellerId,
    `Seller operational status changed to ${status}. Reason: ${reason || 'Administrative action'}`,
    { status, reason }
  );

  const updated = await fetchSellerById(sellerId);
  return updated!;
}

export async function fetchSellerDashboardMetrics(): Promise<SellerDashboardMetrics> {
  const sellers = await fetchSellers();
  const allProducts = getLocalTable<Product>('products');
  const allOrders = getLocalTable<Order>('orders');
  const allQuotes = getLocalTable<Quotation>('quotations');
  const allRfqs = getLocalTable<RFQ>('rfqs');

  const totalSellers = sellers.length;
  const verifiedSellers = sellers.filter((s) => s.verification_status_normalized === 'Verified').length;
  const pendingVerification = sellers.filter((s) => s.verification_status_normalized === 'Pending').length;
  const activeSellers = sellers.filter((s) => s.operational_status === 'Active').length;
  const inactiveSellers = sellers.filter((s) => s.operational_status === 'Suspended' || s.operational_status === 'Inactive').length;

  const totalProductsListed = allProducts.length;
  const sellerQuotations = allQuotes.length;
  const sellerOrders = allOrders.length;
  const sellerRfqResponses = allRfqs.reduce((sum, r) => sum + (r.responses_count || 0), 0);

  // Sum real order revenue across all completed or active orders
  const sellerRevenue = allOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return {
    total_sellers: totalSellers,
    verified_sellers: verifiedSellers,
    pending_verification: pendingVerification,
    active_sellers: activeSellers,
    inactive_sellers: inactiveSellers,
    total_products_listed: totalProductsListed,
    seller_rfq_responses: sellerRfqResponses,
    seller_quotations: sellerQuotations,
    seller_orders: sellerOrders,
    seller_revenue: sellerRevenue,
  };
}

export async function inviteSeller(invitation: {
  inviterBusinessId: string;
  email: string;
  businessName: string;
  role: string;
  invitedByName?: string;
}): Promise<SellerInvitation> {
  const invite: SellerInvitation = {
    id: generateUuid(),
    inviter_business_id: invitation.inviterBusinessId,
    email: invitation.email,
    business_name: invitation.businessName,
    role: invitation.role || 'Supplier',
    status: 'PENDING',
    invite_token: `INV-${generateUuid().slice(0, 8).toUpperCase()}`,
    invited_by_name: invitation.invitedByName,
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };

  const all = getLocalTable<SellerInvitation>('seller_invitations');
  all.unshift(invite);
  setLocalTable('seller_invitations', all);

  await recordAuditLog(
    invitation.inviterBusinessId,
    'INVITE_SELLER',
    'seller_invitation',
    invite.id,
    `Dispatched supplier onboarding invite to ${invitation.email} (${invitation.businessName})`,
    { invitation: invite }
  );

  return invite;
}

export async function fetchSellerInvitations(inviterBusinessId?: string): Promise<SellerInvitation[]> {
  const all = getLocalTable<SellerInvitation>('seller_invitations');
  if (inviterBusinessId) {
    return all.filter((i) => i.inviter_business_id === inviterBusinessId);
  }
  return all;
}

export async function submitSellerVerificationEvidence(
  sellerId: string,
  evidence: {
    document_type: SellerVerificationEvidence['document_type'];
    title: string;
    file_url: string;
    notes?: string;
  }
): Promise<SellerVerificationEvidence> {
  const newEv: SellerVerificationEvidence = {
    id: generateUuid(),
    seller_id: sellerId,
    document_type: evidence.document_type,
    title: evidence.title,
    file_url: evidence.file_url,
    status: 'PENDING',
    notes: evidence.notes,
    submitted_at: new Date().toISOString(),
  };

  const all = getLocalTable<SellerVerificationEvidence>('seller_verifications');
  all.unshift(newEv);
  setLocalTable('seller_verifications', all);

  // Automatically switch seller verification status to Pending if currently Unverified or Rejected
  const seller = await fetchSellerById(sellerId);
  if (seller && (seller.verification_status_normalized === 'Unverified' || seller.verification_status_normalized === 'Rejected')) {
    await updateSeller(sellerId, { verification_status: 'pending' as any });
  }

  await recordAuditLog(
    sellerId,
    'SUBMIT_VERIFICATION_EVIDENCE',
    'seller_verification',
    newEv.id,
    `Submitted verification evidence document "${newEv.title}" (${newEv.document_type})`
  );

  return newEv;
}

export async function fetchSellerVerificationEvidence(sellerId: string): Promise<SellerVerificationEvidence[]> {
  const all = getLocalTable<SellerVerificationEvidence>('seller_verifications');
  return all.filter((e) => e.seller_id === sellerId);
}

export async function fetchAllSellerVerifications(): Promise<SellerVerificationEvidence[]> {
  const all = getLocalTable<SellerVerificationEvidence>('seller_verifications');
  if (all.length > 0) return all;
  const defaults: SellerVerificationEvidence[] = [
    {
      id: 'sve-1',
      seller_id: 'biz-apex-global',
      document_type: 'business_registration',
      title: 'Apex Global Industries Legal Registration',
      file_url: 'https://example.com/docs/cert-incorp.pdf',
      status: 'APPROVED',
      submitted_at: '2026-01-10T12:00:00Z',
    },
    {
      id: 'sve-2',
      seller_id: 'biz-nordic-timber',
      document_type: 'quality_cert',
      title: 'Nordic Sylva Quality Management Certificate',
      file_url: 'https://example.com/docs/iso-9001.pdf',
      status: 'PENDING',
      submitted_at: '2026-02-14T09:30:00Z',
    },
  ];
  setLocalTable('seller_verifications', defaults);
  return defaults;
}

export async function updateSellerVerificationEvidence(
  evidenceId: string,
  status: 'APPROVED' | 'REJECTED',
  notes?: string
): Promise<SellerVerificationEvidence | null> {
  const all = getLocalTable<SellerVerificationEvidence>('seller_verifications');
  const target = all.find((e) => e.id === evidenceId);
  if (!target) return null;
  target.status = status;
  target.notes = notes || target.notes;
  target.reviewed_at = new Date().toISOString();
  setLocalTable('seller_verifications', all);
  return target;
}

export async function saveSellerOnboardingDraft(draft: SellerOnboardingDraft): Promise<void> {
  const all = getLocalTable<SellerOnboardingDraft>('seller_onboarding_drafts');
  const idx = all.findIndex((d) => d.id === draft.id || (draft.user_id && d.user_id === draft.user_id));
  if (idx >= 0) {
    all[idx] = { ...draft, updated_at: new Date().toISOString() };
  } else {
    all.unshift({ ...draft, updated_at: new Date().toISOString() });
  }
  setLocalTable('seller_onboarding_drafts', all);
}

export async function fetchSellerOnboardingDraft(userId?: string, businessId?: string): Promise<SellerOnboardingDraft | null> {
  const all = getLocalTable<SellerOnboardingDraft>('seller_onboarding_drafts');
  if (userId) {
    const found = all.find((d) => d.user_id === userId);
    if (found) return found;
  }
  if (businessId) {
    const found = all.find((d) => d.business_id === businessId);
    if (found) return found;
  }
  return all[0] || null;
}

export async function findMatchingSellersForRFQ(rfq: RFQ): Promise<{
  seller: SellerProfile;
  matchScore: number;
  matchReasons: string[];
}[]> {
  const sellers = await fetchSellers();
  const allProducts = getLocalTable<Product>('products');

  const matches: { seller: SellerProfile; matchScore: number; matchReasons: string[] }[] = [];

  const rfqCat = (rfq.category || '').toLowerCase();
  const rfqTitle = (rfq.product_title || '').toLowerCase();
  const rfqCountry = (rfq.buyer_country || rfq.delivery_location || '').toLowerCase();
  const rfqQty = Number(rfq.quantity) || 1;

  for (const seller of sellers) {
    if (seller.operational_status === 'Suspended') continue;

    const reasons: string[] = [];
    let score = 0;

    const sCat = (seller.category || '').toLowerCase();
    const sInd = (seller.industry || '').toLowerCase();

    // 1. Direct Category or Industry Match
    if (rfqCat && (sCat.includes(rfqCat) || rfqCat.includes(sCat) || sInd.includes(rfqCat))) {
      score += 40;
      reasons.push(`Direct category match in ${seller.category || seller.industry}`);
    }

    // 2. Product Catalog Match
    const sellerProducts = allProducts.filter((p) => p.business_id === seller.id);
    const matchingProduct = sellerProducts.find(
      (p) =>
        p.name.toLowerCase().includes(rfqTitle) ||
        rfqTitle.includes(p.name.toLowerCase()) ||
        (p.category && rfqCat.includes(p.category.toLowerCase()))
    );

    if (matchingProduct) {
      score += 30;
      reasons.push(`Catalog item "${matchingProduct.name}" matches required specifications`);
    }

    // 3. MOQ Suitability
    const sellerMoq = seller.moq || 1;
    if (rfqQty >= sellerMoq) {
      score += 15;
      reasons.push(`Order quantity (${rfqQty}) meets seller MOQ (${sellerMoq})`);
    }

    // 4. Geographic & Shipping Route
    const exports = (seller.export_countries || []).map((c) => c.toLowerCase());
    if (exports.length === 0 || exports.some((c) => rfqCountry.includes(c) || c.includes('global') || c.includes('worldwide'))) {
      score += 10;
      reasons.push(`Verified export capability to ${rfq.buyer_country || 'global destination'}`);
    }

    // 5. Verification Credibility
    if (seller.verification_status_normalized === 'Verified') {
      score += 5;
      reasons.push('Verified enterprise supplier with audited credentials');
    }

    if (score >= 25) {
      matches.push({
        seller,
        matchScore: Math.min(score, 100),
        matchReasons: reasons,
      });
    }
  }

  // Sort by match score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

// ====================================================================
// COUPONS & PROMOTIONAL DISCOUNTS
// ====================================================================
const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coup-welcome-10',
    code: 'WELCOME10',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    min_order_amount: 50,
    max_discount_amount: 150,
    usage_limit: 1000,
    usage_count: 84,
    valid_from: '2026-01-01T00:00:00Z',
    valid_until: '2026-12-31T23:59:59Z',
    is_active: true,
    description: '10% off for verified new marketplace buyers (Min order $50, max discount $150)',
  },
  {
    id: 'coup-bulk-50',
    code: 'BULK50',
    discount_type: 'FIXED',
    discount_value: 50,
    min_order_amount: 500,
    max_discount_amount: 50,
    usage_limit: 500,
    usage_count: 37,
    valid_from: '2026-01-01T00:00:00Z',
    valid_until: '2026-12-31T23:59:59Z',
    is_active: true,
    description: '$50 instant wholesale credit on purchase orders over $500',
  },
  {
    id: 'coup-vip-freeship',
    code: 'VIPFREESHIP',
    discount_type: 'FREE_SHIPPING',
    discount_value: 0,
    min_order_amount: 100,
    usage_limit: 200,
    usage_count: 52,
    valid_from: '2026-01-01T00:00:00Z',
    valid_until: '2026-12-31T23:59:59Z',
    is_active: true,
    description: 'Complimentary standard express shipping on orders exceeding $100',
  },
  {
    id: 'coup-global-2026',
    code: 'GLOBAL2026',
    discount_type: 'PERCENTAGE',
    discount_value: 15,
    min_order_amount: 1000,
    max_discount_amount: 500,
    usage_limit: 100,
    usage_count: 19,
    valid_from: '2026-01-01T00:00:00Z',
    valid_until: '2026-12-31T23:59:59Z',
    is_active: true,
    description: 'Global trade promotion: 15% off bulk orders above $1,000 (Max $500)',
  },
];

export async function fetchCoupons(): Promise<Coupon[]> {
  const local = getLocalTable<Coupon>('coupons');
  if (local.length > 0) return local;
  setLocalTable('coupons', DEFAULT_COUPONS);
  return DEFAULT_COUPONS;
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<{ valid: boolean; coupon?: Coupon; discount: number; message: string }> {
  const coupons = await fetchCoupons();
  const normalized = code.trim().toUpperCase();
  const match = coupons.find((c) => c.code.toUpperCase() === normalized && c.is_active);

  if (!match) {
    return { valid: false, discount: 0, message: `Coupon code "${code}" is invalid or expired.` };
  }

  if (subtotal < match.min_order_amount) {
    return {
      valid: false,
      coupon: match,
      discount: 0,
      message: `Minimum order amount of $${match.min_order_amount} required to activate this coupon.`,
    };
  }

  let discount = 0;
  if (match.discount_type === 'PERCENTAGE') {
    discount = (subtotal * match.discount_value) / 100;
    if (match.max_discount_amount && discount > match.max_discount_amount) {
      discount = match.max_discount_amount;
    }
  } else if (match.discount_type === 'FIXED') {
    discount = Math.min(match.discount_value, subtotal);
  } else if (match.discount_type === 'FREE_SHIPPING') {
    discount = 0; // handled during shipping calculation
  }

  return {
    valid: true,
    coupon: match,
    discount: Math.round(discount * 100) / 100,
    message: `Coupon "${match.code}" successfully applied: ${match.description}`,
  };
}

export async function createCoupon(coupon: Omit<Coupon, 'id' | 'usage_count'>): Promise<Coupon> {
  const coupons = await fetchCoupons();
  const newCoupon: Coupon = {
    ...coupon,
    id: `coup-${Date.now()}`,
    code: coupon.code.toUpperCase().trim(),
    usage_count: 0,
  };
  const updated = [newCoupon, ...coupons];
  setLocalTable('coupons', updated);
  return newCoupon;
}

// ====================================================================
// CART & PERSISTENCE
// ====================================================================
export async function fetchCart(identifier: string): Promise<Cart> {
  const carts = getLocalTable<Cart>('carts');
  const existing = carts.find((c) => c.business_id === identifier || c.user_id === identifier);
  if (existing) return existing;

  const newCart: Cart = {
    id: `cart-${Date.now()}`,
    business_id: identifier,
    items: [],
    saved_for_later: [],
    discount_amount: 0,
    subtotal: 0,
    tax_amount: 0,
    shipping_amount: 0,
    total: 0,
    currency: 'USD',
    updated_at: new Date().toISOString(),
  };
  setLocalTable('carts', [...carts, newCart]);
  return newCart;
}

export async function saveCart(cart: Cart): Promise<Cart> {
  const carts = getLocalTable<Cart>('carts');
  const filtered = carts.filter((c) => c.id !== cart.id && c.business_id !== cart.business_id);
  const updated = [{ ...cart, updated_at: new Date().toISOString() }, ...filtered];
  setLocalTable('carts', updated);
  return cart;
}

// ====================================================================
// PRODUCT & SELLER REVIEWS
// ====================================================================
const DEFAULT_PRODUCT_REVIEWS: ProductReview[] = [
  {
    id: 'rev-prod-1',
    product_id: 'prod-marble-slabs',
    author_name: 'Elena Rostova',
    author_country: 'Germany',
    rating: 5,
    title: 'Outstanding Calacatta Marble Quality and Pristine Packaging',
    comment: 'Received a full 20ft container shipment. Polishing uniformity and thickness calibration was within 0.5mm tolerance. Every crate had shock-absorbing rubber padding.',
    is_verified_purchase: true,
    helpful_count: 14,
    created_at: '2026-03-12T10:30:00Z',
  },
  {
    id: 'rev-prod-2',
    product_id: 'prod-marble-slabs',
    author_name: 'Marcus Vance',
    author_country: 'United Kingdom',
    rating: 4,
    title: 'Great export compliance, transit took 18 days',
    comment: 'Documents including Bill of Lading, phytosanitary certificate and fumigation records were dispatched immediately. Will re-order next quarter.',
    is_verified_purchase: true,
    helpful_count: 9,
    created_at: '2026-03-24T14:15:00Z',
  },
  {
    id: 'rev-prod-3',
    product_id: 'prod-cnc-aluminum',
    author_name: 'Kenji Takahashi',
    author_country: 'Japan',
    rating: 5,
    title: 'Aerospace-grade tolerance achieved on batch of 500 units',
    comment: 'CMM inspection reports provided with anodized finish. Passed our in-house ISO 9001 intake inspection with zero defects.',
    is_verified_purchase: true,
    helpful_count: 22,
    created_at: '2026-04-02T08:00:00Z',
  },
];

export async function fetchProductReviews(productId?: string): Promise<ProductReview[]> {
  const local = getLocalTable<ProductReview>('product_reviews');
  let allReviews = local.length > 0 ? local : DEFAULT_PRODUCT_REVIEWS;
  if (local.length === 0) {
    setLocalTable('product_reviews', DEFAULT_PRODUCT_REVIEWS);
  }
  if (!productId) return allReviews;
  return allReviews.filter((r) => r.product_id === productId);
}

export async function createProductReview(
  data: Omit<ProductReview, 'id' | 'created_at' | 'helpful_count'>
): Promise<ProductReview> {
  const reviews = await fetchProductReviews();
  const newReview: ProductReview = {
    ...data,
    id: `rev-${Date.now()}`,
    helpful_count: 0,
    created_at: new Date().toISOString(),
  };
  const updated = [newReview, ...reviews];
  setLocalTable('product_reviews', updated);
  return newReview;
}

export async function fetchSellerReviews(sellerId: string): Promise<SellerReview[]> {
  const local = getLocalTable<SellerReview>('seller_reviews');
  if (local.length > 0) {
    return local.filter((r) => r.seller_id === sellerId);
  }
  const defaults: SellerReview[] = [
    {
      id: `srev-1-${sellerId}`,
      seller_id: sellerId,
      author_name: 'David Lindqvist',
      author_country: 'Sweden',
      rating: 5,
      communication_rating: 5,
      delivery_rating: 4.8,
      quality_rating: 5,
      comment: 'Exceptional transparency throughout contract negotiation and CIF shipping execution. High responsiveness from their technical sales director.',
      is_verified_purchase: true,
      created_at: '2026-03-18T11:00:00Z',
    },
    {
      id: `srev-2-${sellerId}`,
      seller_id: sellerId,
      author_name: 'Fatima Al-Mansoor',
      author_country: 'UAE',
      rating: 4.8,
      communication_rating: 5,
      delivery_rating: 4.6,
      quality_rating: 5,
      comment: 'Prompt quotation turnaround within 4 hours of RFQ publication. Customs clearance documents matched Dubai port requirements.',
      is_verified_purchase: true,
      created_at: '2026-04-05T09:30:00Z',
    },
  ];
  setLocalTable('seller_reviews', defaults);
  return defaults;
}

export async function createSellerReview(
  data: Omit<SellerReview, 'id' | 'created_at'>
): Promise<SellerReview> {
  const all = getLocalTable<SellerReview>('seller_reviews');
  const newRev: SellerReview = {
    ...data,
    id: `srev-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  setLocalTable('seller_reviews', [newRev, ...all]);
  return newRev;
}

// ====================================================================
// MANUFACTURER FACTORY CAPABILITIES & PROFILES
// ====================================================================
const DEFAULT_MANUFACTURERS: ManufacturerProfile[] = [
  {
    id: 'mfg-apex',
    business_id: 'biz-apex-global',
    factory_name: 'Apex Precision Heavy Industries Facility #2',
    factory_size_sqm: 45000,
    production_lines: 12,
    daily_capacity: '2,500 finished assemblies / day',
    lead_time_days: 14,
    moq: 50,
    customization_services: ['OEM', 'ODM', 'Custom Logo', 'Custom Packaging', 'Graphic Customization'],
    machinery_equipment: [
      '5-Axis DMG MORI CNC Machining Centers (8 units)',
      'Trumpf TruLaser 5030 Fiber Laser Cutters (4 units)',
      'Automated Powder Coating Robotic Line',
      'Zeiss coordinate measuring machine (CMM) testing lab',
    ],
    certifications: ['ISO 9001:2015', 'ISO 14001', 'IATF 16949 (Automotive)', 'CE Mark', 'RoHS Compliance'],
    export_destinations: ['United States', 'Germany', 'Japan', 'United Kingdom', 'Canada', 'Australia'],
    qc_process_description: 'Strict 4-stage quality gate: Raw material ultrasonic flaw detection, in-process first-article inspection, 100% CMM dimensional sampling, and packaging humidity-seal verification.',
    factory_images: [
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop',
    ],
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'mfg-nordic',
    business_id: 'biz-nordic-timber',
    factory_name: 'Nordic Sylva Sustainable Timber & Milling Complex',
    factory_size_sqm: 120000,
    production_lines: 6,
    daily_capacity: '1,200 cubic meters / day',
    lead_time_days: 10,
    moq: 1,
    customization_services: ['OEM', 'Custom Packaging'],
    machinery_equipment: [
      'Valon Kone high-speed automated log debarking lines',
      'HewSaw sawline with 3D scanning optimization',
      'Continuous computer-controlled drying kilns (18 chambers)',
      'Strength grading and stress-testing automated ultrasonic rig',
    ],
    certifications: ['FSC 100% Certified', 'PEFC Chain of Custody', 'ISPM 15 Heat-Treated Export Compliant', 'CE EN 14081'],
    export_destinations: ['European Union', 'United Kingdom', 'Middle East', 'East Asia', 'North America'],
    qc_process_description: 'Moisture content electronically verified below 14% on all export lumber with computerized structural density profiling.',
    factory_images: [
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop',
    ],
    created_at: '2026-01-20T00:00:00Z',
  },
];

export async function fetchManufacturerProfiles(): Promise<ManufacturerProfile[]> {
  const local = getLocalTable<ManufacturerProfile>('manufacturer_profiles');
  if (local.length > 0) return local;
  setLocalTable('manufacturer_profiles', DEFAULT_MANUFACTURERS);
  return DEFAULT_MANUFACTURERS;
}

export async function getManufacturerProfile(businessId: string): Promise<ManufacturerProfile | null> {
  const profiles = await fetchManufacturerProfiles();
  return profiles.find((p) => p.business_id === businessId) || null;
}

// ====================================================================
// B2C MARKETPLACE CHECKOUT & ATOMIC ORDER SUBMISSION
// ====================================================================
export interface CheckoutOrderRequest {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerCompany?: string;
  shippingAddress: string;
  city: string;
  country: string;
  postalCode?: string;
  shippingMethod: ShippingCarrierOption;
  paymentMethod: 'Credit/Debit Card' | 'Escrow & Letter of Credit' | 'Bank Wire (SWIFT/SEPA)' | 'Instant UPI / NetBanking';
  orderNotes?: string;
  couponCode?: string;
}

export async function submitCheckoutOrder(
  req: CheckoutOrderRequest,
  items: CartItem[],
  buyerBusinessId?: string
): Promise<{ success: boolean; order: Order; invoice: Invoice; orderNumber: string }> {
  if (!items || items.length === 0) {
    throw new Error('Your cart is empty. Please add items before checking out.');
  }

  // 1. Stock Safety Verification: ensure inventory availability
  const allProducts = await fetchMarketplaceProducts();
  for (const item of items) {
    const prod = allProducts.find((p) => p.id === item.product_id);
    if (prod && typeof prod.stock_quantity === 'number') {
      if (prod.stock_quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for "${item.product.name}". Requested ${item.quantity}, but only ${prod.stock_quantity} available.`
        );
      }
    }
  }

  // 2. Server-side totals calculation
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  let discount = 0;
  if (req.couponCode) {
    const couponValidation = await validateCoupon(req.couponCode, subtotal);
    if (couponValidation.valid) {
      discount = couponValidation.discount;
    }
  }

  const shippingCost = req.shippingMethod.price;
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxAmount = Math.round(taxableAmount * 0.08 * 100) / 100; // 8% standard tax
  const totalAmount = Math.round((taxableAmount + shippingCost + taxAmount) * 100) / 100;

  const targetBusinessId = buyerBusinessId || items[0].product.business_id || 'biz-apex-global';
  const orderNumber = `VYRA-ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const trackingNumber = `TRK-${req.shippingMethod.name.slice(0, 3).toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;

  // 3. Create real Order record
  const createdOrder = await createOrder({
    business_id: targetBusinessId,
    order_number: orderNumber,
    buyer_name: req.buyerName,
    buyer_company: req.buyerCompany || `${req.buyerName} Direct`,
    total_amount: totalAmount,
    currency: items[0].currency || 'USD',
    status: 'Order Confirmed',
    payment_status: 'Fully Paid',
    carrier: req.shippingMethod.name,
    tracking_number: trackingNumber,
    production_notes: `B2C Checkout via ${req.paymentMethod}. Destination: ${req.shippingAddress}, ${req.city}, ${req.country}. Notes: ${req.orderNotes || 'Standard safe packaging requested.'}`,
  });

  // 4. Update inventory stocks & record inventory movement
  for (const item of items) {
    const prod = allProducts.find((p) => p.id === item.product_id);
    if (prod && typeof prod.stock_quantity === 'number') {
      const nextStock = Math.max(0, prod.stock_quantity - item.quantity);
      await updateProduct(prod.id, { stock_quantity: nextStock });
      await recordInventoryMovement({
        product_id: prod.id,
        business_id: prod.business_id,
        movement_type: 'stock_out',
        quantity: item.quantity,
        reference_order_id: createdOrder.id,
        notes: `Marketplace Order ${orderNumber} fulfilled to ${req.buyerName}`,
      });
    }
  }

  // 5. Generate automated Invoice
  const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const createdInvoice = await createInvoice({
    business_id: targetBusinessId,
    order_id: createdOrder.id,
    invoice_number: invoiceNumber,
    customer_name: req.buyerName,
    customer_company: req.buyerCompany || req.buyerName,
    customer_email: req.buyerEmail,
    customer_address: `${req.shippingAddress}, ${req.city}, ${req.country}`,
    subtotal: subtotal,
    tax_rate: 8,
    tax_amount: taxAmount,
    shipping_fee: shippingCost,
    discount_amount: discount,
    total_amount: totalAmount,
    amount_paid: totalAmount,
    currency: items[0].currency || 'USD',
    payment_status: 'Paid',
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    items: items.map((it) => ({
      description: `${it.product.name} ${it.selected_variant ? `(${it.selected_variant})` : ''}`,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.unit_price * it.quantity,
    })),
  });

  // 6. Record Audit Log
  await recordAuditLog(
    targetBusinessId,
    'CREATE',
    'Orders',
    createdOrder.id,
    `B2C Checkout Order ${orderNumber} created for ${req.buyerName}. Total: $${totalAmount}. Carrier: ${req.shippingMethod.name}.`
  );

  // 7. Push Notification
  const notifs = getLocalTable<AppNotification>('notifications');
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}`,
    business_id: targetBusinessId,
    title: `New Order Received: ${orderNumber}`,
    message: `Buyer ${req.buyerName} placed an order for $${totalAmount} via ${req.paymentMethod}. Tracking: ${trackingNumber}`,
    type: 'order_status',
    is_read: false,
    created_at: new Date().toISOString(),
    link: '/orders',
  };
  setLocalTable('notifications', [newNotif, ...notifs]);

  return {
    success: true,
    order: createdOrder,
    invoice: createdInvoice,
    orderNumber,
  };
}

// ====================================================================
// ADMIN MODERATION & GOVERNANCE
// ====================================================================
export async function moderateProduct(
  productId: string,
  action: 'APPROVE' | 'REJECT' | 'SUSPEND',
  reason?: string
): Promise<Product> {
  const statusMap = {
    APPROVE: 'Active',
    REJECT: 'Draft',
    SUSPEND: 'Archived',
  };
  const updated = await updateProduct(productId, { status: statusMap[action] as any });
  await recordAuditLog(
    updated.business_id,
    'UPDATE',
    'Products',
    productId,
    `Product "${updated.name}" moderated: ${action}. Reason: ${reason || 'Compliance review'}`
  );
  return updated;
}

// ====================================================================
// 34. VYRA GLOBAL SHIPPING & LOGISTICS SYSTEM (Section 49)
// ====================================================================

export const GLOBAL_LOGISTICS_CARRIERS: LogisticsCarrier[] = [
  {
    id: 'carrier-dhl',
    name: 'DHL Express',
    code: 'DHL',
    category: 'GLOBAL_EXPRESS',
    status: 'CONNECTED',
    supported_modes: ['Express Shipping', 'Standard Shipping', 'Air Freight Cargo', 'Courier & Express Parcel'],
    tracking_url_template: 'https://www.dhl.com/en/express/tracking.html?AWB={TRACKING}',
    logo_badge: 'DHL',
    average_on_time_rate: 98.4,
    supported_countries: ['US', 'DE', 'NL', 'CN', 'IN', 'GB', 'SG', 'AE', 'JP', 'AU', 'CA'],
  },
  {
    id: 'carrier-fedex',
    name: 'FedEx International',
    code: 'FDX',
    category: 'GLOBAL_EXPRESS',
    status: 'CONNECTED',
    supported_modes: ['Express Shipping', 'Same/Next Day', 'Economy Shipping', 'Courier & Express Parcel'],
    tracking_url_template: 'https://www.fedex.com/fedextrack/?trknbr={TRACKING}',
    logo_badge: 'FedEx',
    average_on_time_rate: 97.9,
    supported_countries: ['US', 'CA', 'MX', 'GB', 'DE', 'FR', 'IN', 'JP', 'AU'],
  },
  {
    id: 'carrier-ups',
    name: 'UPS Worldwide',
    code: 'UPS',
    category: 'GLOBAL_EXPRESS',
    status: 'CONNECTED',
    supported_modes: ['Standard Shipping', 'Express Shipping', 'Scheduled Delivery', 'LTL (Less-Than-Truckload)'],
    tracking_url_template: 'https://www.ups.com/track?tracknum={TRACKING}',
    logo_badge: 'UPS',
    average_on_time_rate: 97.5,
    supported_countries: ['US', 'CA', 'GB', 'DE', 'IT', 'ES', 'IN', 'SG'],
  },
  {
    id: 'carrier-maersk',
    name: 'A.P. Moller - Maersk Line',
    code: 'MSK',
    category: 'OCEAN_CARRIER',
    status: 'CONNECTED',
    supported_modes: ['Sea Freight (FCL Container)', 'Sea Freight (LCL)', 'Multimodal Freight', 'Freight Forwarder Hand-off'],
    tracking_url_template: 'https://www.maersk.com/tracking/{TRACKING}',
    logo_badge: 'MAERSK',
    average_on_time_rate: 94.2,
    supported_countries: ['Global Ocean Routes', 'CN', 'IN', 'NL', 'US', 'SG', 'AE', 'DE'],
  },
  {
    id: 'carrier-msc',
    name: 'MSC (Mediterranean Shipping Company)',
    code: 'MSC',
    category: 'OCEAN_CARRIER',
    status: 'CONNECTED',
    supported_modes: ['Sea Freight (FCL Container)', 'Sea Freight (LCL)', 'Multimodal Freight'],
    tracking_url_template: 'https://www.msc.com/track-a-shipment?container={TRACKING}',
    logo_badge: 'MSC',
    average_on_time_rate: 93.8,
    supported_countries: ['Global Ocean Routes', 'CN', 'IN', 'US', 'GB', 'NL', 'BR'],
  },
  {
    id: 'carrier-cma',
    name: 'CMA CGM Group',
    code: 'CMA',
    category: 'OCEAN_CARRIER',
    status: 'CONNECTED',
    supported_modes: ['Sea Freight (FCL Container)', 'Sea Freight (LCL)', 'Rail Freight'],
    tracking_url_template: 'https://www.cma-cgm.com/ebusiness/tracking/search?SearchBy=Container&Reference={TRACKING}',
    logo_badge: 'CMA CGM',
    average_on_time_rate: 93.1,
    supported_countries: ['Global Ocean Routes', 'FR', 'CN', 'US', 'SG', 'AE'],
  },
  {
    id: 'carrier-dbschenker',
    name: 'DB Schenker Global Logistics',
    code: 'DBS',
    category: 'AIR_FREIGHT',
    status: 'CONNECTED',
    supported_modes: ['Air Freight Cargo', 'LTL (Less-Than-Truckload)', 'FTL (Full-Truckload)', 'Rail Freight', 'Multimodal Freight'],
    tracking_url_template: 'https://www.dbschenker.com/global/tracking?tracking_number={TRACKING}',
    logo_badge: 'DB Schenker',
    average_on_time_rate: 96.2,
    supported_countries: ['DE', 'EU', 'US', 'CN', 'IN', 'SG', 'AE'],
  },
  {
    id: 'carrier-kuehne',
    name: 'Kuehne + Nagel 3PL',
    code: 'KN',
    category: 'REGIONAL_3PL',
    status: 'CONNECTED',
    supported_modes: ['Freight Forwarder Hand-off', 'Air Freight Cargo', 'Sea Freight (FCL Container)', 'Sea Freight (LCL)'],
    tracking_url_template: 'https://mykn.kuehne-nagel.com/public-tracking/{TRACKING}',
    logo_badge: 'Kuehne+Nagel',
    average_on_time_rate: 96.8,
    supported_countries: ['CH', 'DE', 'US', 'GB', 'SG', 'IN', 'AE'],
  },
  {
    id: 'carrier-bluedart',
    name: 'Blue Dart / South Asia Express',
    code: 'BDART',
    category: 'DOMESTIC_POSTAL',
    status: 'CONNECTED',
    supported_modes: ['Standard Shipping', 'Express Shipping', 'Same/Next Day', 'Local Delivery'],
    tracking_url_template: 'https://www.bluedart.com/tracking?numbers={TRACKING}',
    logo_badge: 'Blue Dart',
    average_on_time_rate: 98.1,
    supported_countries: ['IN', 'AE', 'SG'],
  },
  {
    id: 'carrier-aramex',
    name: 'Aramex International',
    code: 'ARX',
    category: 'GLOBAL_EXPRESS',
    status: 'CONNECTED',
    supported_modes: ['Express Shipping', 'Standard Shipping', 'Courier & Express Parcel'],
    tracking_url_template: 'https://www.aramex.com/track/results?mode=0&ShipmentNumber={TRACKING}',
    logo_badge: 'Aramex',
    average_on_time_rate: 95.7,
    supported_countries: ['AE', 'SA', 'EG', 'IN', 'GB', 'US'],
  },
];

const SEED_WAREHOUSES: LogisticsWarehouse[] = [
  {
    id: 'wh-rotterdam-01',
    business_id: 'biz-apex-global',
    code: 'RTM-WH01',
    name: 'Rotterdam Port Gateway Hub (Bonded)',
    type: 'BONDED_WAREHOUSE',
    address: {
      company_name: 'VYRA European Logistics Hub',
      contact_name: 'Jan Van Dijk',
      email: 'rotterdam.ops@vyra.trade',
      phone: '+31 10 555 0192',
      tax_id: 'NL824192019B01',
      address_line1: 'Maasvlakte 2 Haven 8200',
      address_line2: 'Terminal Dock 4B',
      city: 'Rotterdam',
      state_province: 'South Holland',
      postal_code: '3008 AB',
      country: 'Netherlands',
      country_code: 'NL',
    },
    capacity_sqm: 18500,
    dock_count: 14,
    manager_name: 'Jan Van Dijk',
    manager_phone: '+31 10 555 0192',
    is_default_origin: true,
    active_stock_skus: 420,
  },
  {
    id: 'wh-newjersey-02',
    business_id: 'biz-apex-global',
    code: 'EWR-WH02',
    name: 'Port Newark Northeast Fulfillment Center',
    type: 'FULFILLMENT_CENTER',
    address: {
      company_name: 'VYRA Americas Logistics Center',
      contact_name: 'Sarah Jenkins',
      email: 'newark.hub@vyra.trade',
      phone: '+1 201 555 8820',
      tax_id: 'EIN-22-9840192',
      address_line1: '1200 Terminal Way',
      address_line2: 'Bay 12-16',
      city: 'Newark',
      state_province: 'NJ',
      postal_code: '07114',
      country: 'United States',
      country_code: 'US',
    },
    capacity_sqm: 24000,
    dock_count: 22,
    manager_name: 'Sarah Jenkins',
    manager_phone: '+1 201 555 8820',
    is_default_origin: false,
    active_stock_skus: 680,
  },
  {
    id: 'wh-shenzhen-03',
    business_id: 'biz-apex-global',
    code: 'SZX-WH03',
    name: 'Shenzhen Yantian Free Trade Export Depot',
    type: 'FACTORY_DOCK',
    address: {
      company_name: 'VYRA Asia-Pacific Consolidation',
      contact_name: 'Wei Zhang',
      email: 'shenzhen.logistics@vyra.trade',
      phone: '+86 755 8829 4410',
      tax_id: 'USCI-91440300MA5FB123',
      address_line1: 'Yantian Free Trade Zone Logistics Park',
      address_line2: 'Building C, Gate 6',
      city: 'Shenzhen',
      state_province: 'Guangdong',
      postal_code: '518083',
      country: 'China',
      country_code: 'CN',
    },
    capacity_sqm: 35000,
    dock_count: 30,
    manager_name: 'Wei Zhang',
    manager_phone: '+86 755 8829 4410',
    is_default_origin: false,
    active_stock_skus: 1250,
  },
];

const SEED_SHIPMENTS: VyraShipment[] = [
  {
    id: 'ship-vyra-001',
    business_id: 'biz-apex-global',
    order_id: 'ord-101',
    order_number: 'VYRA-ORD-8821',
    buyer_name: 'EuroBuild Infrastructure B.V.',
    seller_name: 'Apex Global Industries',
    tracking_number: 'MSKU-894102941',
    carrier_id: 'carrier-maersk',
    carrier_name: 'A.P. Moller - Maersk Line',
    shipping_mode: 'Sea Freight (FCL Container)',
    incoterm: 'CIF',
    shipment_type: 'CONTAINER_FCL',
    origin: {
      company_name: 'Apex Global Manufacturing Plant',
      contact_name: 'Rajesh Sharma',
      email: 'shipping@apexind.com',
      phone: '+91 22 2849 1029',
      tax_id: '27AAACA9840K1Z5',
      address_line1: 'Mundra Port Logistics Terminal 3',
      city: 'Mundra',
      state_province: 'Gujarat',
      postal_code: '370421',
      country: 'India',
      country_code: 'IN',
    },
    destination: {
      company_name: 'EuroBuild Infrastructure B.V.',
      contact_name: 'Lars Lindqvist',
      email: 'procurement@eurobuild.nl',
      phone: '+31 10 492 8100',
      tax_id: 'NL982019481B02',
      address_line1: 'Havenbedrijf 402, Port of Rotterdam',
      city: 'Rotterdam',
      state_province: 'South Holland',
      postal_code: '3088 GA',
      country: 'Netherlands',
      country_code: 'NL',
    },
    packages: [
      {
        id: 'pkg-01',
        description: 'Engineered High-Grade Granite Countertop Slabs (Calibrated & Polished)',
        hs_code: '6802.21.00',
        quantity: 24,
        unit_weight_kg: 920,
        length_cm: 320,
        width_cm: 190,
        height_cm: 20,
        volumetric_weight_kg: 2432,
        chargeable_weight_kg: 22080,
        declared_value: 48500,
        currency: 'USD',
        is_dangerous_goods: false,
      },
    ],
    total_weight_kg: 22080,
    chargeable_weight_kg: 22080,
    total_packages: 24,
    shipping_cost: 3450,
    fuel_surcharge: 420,
    handling_fee: 280,
    customs_duty_est: 1455,
    insurance_fee: 180,
    currency: 'USD',
    status: 'IN_TRANSIT',
    container_details: {
      container_type: '40ft High Cube (HC)',
      container_number: 'MSKU-7492019',
      seal_number: 'SL-8849201',
      vessel_name: 'MAERSK MC-KINNEY MOLLER',
      voyage_number: '2604W',
      port_of_loading: 'Mundra Port (INMUN)',
      port_of_discharge: 'Port of Rotterdam (NLRTM)',
      gross_weight_kg: 24500,
      cbm_volume: 68.2,
    },
    documents: [
      {
        id: 'doc-bl-001',
        shipment_id: 'ship-vyra-001',
        doc_type: 'BILL_OF_LADING',
        doc_number: 'MSK-BL-894102941',
        title: 'Original Ocean Bill of Lading (Clean on Board)',
        file_name: 'Maersk_BL_894102941.pdf',
        issued_at: new Date(Date.now() - 6 * 86400000).toISOString(),
        status: 'VERIFIED',
        issuer: 'Maersk Line Maritime Office',
      },
      {
        id: 'doc-ci-001',
        shipment_id: 'ship-vyra-001',
        doc_type: 'COMMERCIAL_INVOICE',
        doc_number: 'INV-2026-EXP-084',
        title: 'Commercial Export Invoice',
        file_name: 'Commercial_Invoice_084.pdf',
        issued_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        status: 'VERIFIED',
        issuer: 'Apex Global Industries',
      },
      {
        id: 'doc-pl-001',
        shipment_id: 'ship-vyra-001',
        doc_type: 'PACKING_LIST',
        doc_number: 'PL-2026-084',
        title: 'Customs Certified Packing List & Crate Manifest',
        file_name: 'Packing_List_Manifest_084.pdf',
        issued_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        status: 'VERIFIED',
        issuer: 'Apex Global QC & Logistics Dept',
      },
      {
        id: 'doc-co-001',
        shipment_id: 'ship-vyra-001',
        doc_type: 'CERTIFICATE_OF_ORIGIN',
        doc_number: 'COO-IN-2026-9811',
        title: 'Chamber of Commerce Certificate of Origin',
        file_name: 'Certificate_of_Origin_9811.pdf',
        issued_at: new Date(Date.now() - 6 * 86400000).toISOString(),
        status: 'VERIFIED',
        issuer: 'Federation of Indian Export Organisations (FIEO)',
      },
    ],
    events: [
      {
        id: 'ev-01',
        shipment_id: 'ship-vyra-001',
        status: 'IN_TRANSIT',
        status_label: 'Suez Canal Transit Completed',
        location: 'Port Said Maritime Checkpoint',
        city: 'Port Said',
        country: 'Egypt',
        description: 'Vessel MAERSK MC-KINNEY MOLLER completed northbound convoy. Approaching Mediterranean waters on schedule.',
        timestamp: new Date(Date.now() - 14 * 3600000).toISOString(),
        checkpoint_code: 'EG-PSD',
      },
      {
        id: 'ev-02',
        shipment_id: 'ship-vyra-001',
        status: 'IN_TRANSIT',
        status_label: 'Vessel Departed Port of Loading',
        location: 'Mundra International Container Terminal',
        city: 'Mundra',
        country: 'India',
        description: 'Container MSKU-7492019 stowed on bay 14. Customs manifest electronically transmitted.',
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
        checkpoint_code: 'IN-MUN',
      },
      {
        id: 'ev-03',
        shipment_id: 'ship-vyra-001',
        status: 'CUSTOMS_CLEARED',
        status_label: 'Export Customs Inspection Cleared',
        location: 'Mundra Special Economic Zone',
        city: 'Mundra',
        country: 'India',
        description: 'Shipping bill export clearance granted by Customs Commissionerate. Zero duty hold.',
        timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
        checkpoint_code: 'IN-SEZ',
      },
      {
        id: 'ev-04',
        shipment_id: 'ship-vyra-001',
        status: 'PICKED_UP',
        status_label: 'Factory Gate Dispatched & Sealed',
        location: 'Apex Global Plant 1',
        city: 'Ahmedabad',
        country: 'India',
        description: 'Container sealed with high-security bolt seal SL-8849201 and loaded on rail flatbed.',
        timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
    ],
    estimated_delivery: new Date(Date.now() + 8 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 3600000).toISOString(),
    notes: 'Temperature-controlled moisture barrier applied to all crate bundles. Pre-shipment inspection report attached.',
  },
  {
    id: 'ship-vyra-002',
    business_id: 'biz-apex-global',
    order_id: 'ord-102',
    order_number: 'VYRA-ORD-8822',
    buyer_name: 'Nordic Clean Energy Lab',
    seller_name: 'Apex Global Industries',
    tracking_number: 'DHL-EX-992104812',
    carrier_id: 'carrier-dhl',
    carrier_name: 'DHL Express',
    shipping_mode: 'Air Freight Cargo',
    incoterm: 'DDP',
    shipment_type: 'AIR_CARGO',
    origin: {
      company_name: 'VYRA Asia Hub / Apex Tech',
      contact_name: 'Wei Zhang',
      email: 'shenzhen.logistics@vyra.trade',
      phone: '+86 755 8829 4410',
      address_line1: 'Baoan International Airport Cargo Hub B',
      city: 'Shenzhen',
      state_province: 'Guangdong',
      postal_code: '518128',
      country: 'China',
      country_code: 'CN',
    },
    destination: {
      company_name: 'Nordic Clean Energy Lab',
      contact_name: 'Dr. Henrik Dahl',
      email: 'logistics@nordicenergy.se',
      phone: '+46 8 555 1928',
      address_line1: 'Science Park Vendevagen 85',
      city: 'Djursholm',
      state_province: 'Stockholm',
      postal_code: '18260',
      country: 'Sweden',
      country_code: 'SE',
    },
    packages: [
      {
        id: 'pkg-02',
        description: 'Industrial Solid State Inverter Circuit Modules (Sensory Grade)',
        hs_code: '8504.40.95',
        quantity: 12,
        unit_weight_kg: 8.5,
        length_cm: 45,
        width_cm: 35,
        height_cm: 25,
        volumetric_weight_kg: 7.8,
        chargeable_weight_kg: 102,
        declared_value: 18400,
        currency: 'USD',
        is_dangerous_goods: false,
      },
    ],
    total_weight_kg: 102,
    chargeable_weight_kg: 102,
    total_packages: 12,
    shipping_cost: 620,
    fuel_surcharge: 85,
    handling_fee: 40,
    customs_duty_est: 310,
    insurance_fee: 65,
    currency: 'USD',
    status: 'CUSTOMS_PENDING',
    documents: [
      {
        id: 'doc-awb-002',
        shipment_id: 'ship-vyra-002',
        doc_type: 'AIR_WAYBILL',
        doc_number: 'AWB-020-992104812',
        title: 'Master Air Waybill (DHL Express Cargo)',
        file_name: 'Air_Waybill_992104812.pdf',
        issued_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'VERIFIED',
        issuer: 'DHL Aviation Hub',
      },
      {
        id: 'doc-ci-002',
        shipment_id: 'ship-vyra-002',
        doc_type: 'COMMERCIAL_INVOICE',
        doc_number: 'INV-2026-AIR-102',
        title: 'Commercial Air Freight Export Invoice',
        file_name: 'Air_Invoice_102.pdf',
        issued_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'VERIFIED',
        issuer: 'Apex Global Industries',
      },
    ],
    events: [
      {
        id: 'ev-201',
        shipment_id: 'ship-vyra-002',
        status: 'CUSTOMS_PENDING',
        status_label: 'Import Customs Inspection Underway',
        location: 'Stockholm Arlanda Airport Customs Hub',
        city: 'Stockholm',
        country: 'Sweden',
        description: 'DDP Duty & VAT prepayment verified. Awaiting routine physical customs sample check.',
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
        checkpoint_code: 'SE-ARN',
      },
      {
        id: 'ev-202',
        shipment_id: 'ship-vyra-002',
        status: 'IN_TRANSIT',
        status_label: 'Arrived at European Air Gateway',
        location: 'Leipzig / Halle Airport Hub',
        city: 'Leipzig',
        country: 'Germany',
        description: 'Flight D0281 landed. Consignment sorted to Scandinavian feeder flight.',
        timestamp: new Date(Date.now() - 18 * 3600000).toISOString(),
        checkpoint_code: 'DE-LEJ',
      },
    ],
    estimated_delivery: new Date(Date.now() + 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    notes: 'Priority Air Cargo. Fragile sensor modules. Anti-static packaging verified.',
  },
  {
    id: 'ship-vyra-003',
    business_id: 'biz-apex-global',
    order_id: 'ord-103',
    order_number: 'VYRA-B2C-1094',
    buyer_name: 'Michael Henderson',
    seller_name: 'Apex Global Direct',
    tracking_number: 'FDX-USA-773829104',
    carrier_id: 'carrier-fedex',
    carrier_name: 'FedEx International',
    shipping_mode: 'Express Shipping',
    shipment_type: 'B2C_ECOM',
    origin: {
      company_name: 'VYRA Americas Logistics Center',
      contact_name: 'Sarah Jenkins',
      email: 'newark.hub@vyra.trade',
      phone: '+1 201 555 8820',
      address_line1: '1200 Terminal Way, Bay 14',
      city: 'Newark',
      state_province: 'NJ',
      postal_code: '07114',
      country: 'United States',
      country_code: 'US',
    },
    destination: {
      contact_name: 'Michael Henderson',
      email: 'm.henderson84@gmail.com',
      phone: '+1 917 555 0144',
      address_line1: '425 West 57th Street, Apt 11B',
      city: 'New York',
      state_province: 'NY',
      postal_code: '10019',
      country: 'United States',
      country_code: 'US',
      is_residential: true,
    },
    packages: [
      {
        id: 'pkg-03',
        description: 'Artisan Granite Serving Board & Coaster Set',
        quantity: 1,
        unit_weight_kg: 3.2,
        length_cm: 35,
        width_cm: 25,
        height_cm: 10,
        volumetric_weight_kg: 1.75,
        chargeable_weight_kg: 3.2,
        declared_value: 125,
        currency: 'USD',
      },
    ],
    total_weight_kg: 3.2,
    chargeable_weight_kg: 3.2,
    total_packages: 1,
    shipping_cost: 18.5,
    fuel_surcharge: 2.1,
    handling_fee: 1.5,
    currency: 'USD',
    status: 'OUT_FOR_DELIVERY',
    documents: [
      {
        id: 'doc-lbl-003',
        shipment_id: 'ship-vyra-003',
        doc_type: 'SHIPPING_LABEL',
        doc_number: 'FDX-LBL-773829104',
        title: 'FedEx Express Courier Label & Barcode',
        file_name: 'FedEx_Label_773829104.pdf',
        issued_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        status: 'ISSUED',
        issuer: 'FedEx ShipManager API',
      },
    ],
    events: [
      {
        id: 'ev-301',
        shipment_id: 'ship-vyra-003',
        status: 'OUT_FOR_DELIVERY',
        status_label: 'On FedEx Van for Delivery Today',
        location: 'FedEx Midtown Station, 10th Ave',
        city: 'New York',
        country: 'United States',
        description: 'Package scanned into courier vehicle. Estimated delivery window: 1:30 PM - 3:30 PM.',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'ev-302',
        shipment_id: 'ship-vyra-003',
        status: 'PICKED_UP',
        status_label: 'Picked Up from Fulfillment Facility',
        location: 'Newark Sort Hub',
        city: 'Newark',
        country: 'United States',
        description: 'Package received from VYRA dock.',
        timestamp: new Date(Date.now() - 16 * 3600000).toISOString(),
      },
    ],
    estimated_delivery: new Date().toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
];

const SEED_CLAIMS: LogisticsClaim[] = [
  {
    id: 'claim-001',
    shipment_id: 'ship-vyra-001',
    tracking_number: 'MSKU-894102941',
    claim_number: 'CLM-2026-0041',
    claim_type: 'DELIVERY_DELAY',
    claimed_amount: 450,
    approved_amount: 320,
    currency: 'USD',
    status: 'SURVEYOR_ASSIGNED',
    description: 'Suez Canal maritime congestion delay exceeded contractual 48hr window under carrier SLA.',
    evidence_attachments: ['port_said_transit_receipt.pdf', 'bol_arrival_stamp.jpg'],
    submitted_by: 'EuroBuild Logistics Officer',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export async function fetchBusinessShipments(businessId: string): Promise<VyraShipment[]> {
  const local = getLocalTable<VyraShipment>('shipments');
  if (local.length > 0) {
    const filtered = local.filter((s) => s.business_id === businessId || !s.business_id);
    return filtered.length > 0 ? filtered : local;
  }
  // Initialize with seed shipments
  setLocalTable('shipments', SEED_SHIPMENTS);
  return SEED_SHIPMENTS;
}

export async function fetchShipmentById(id: string): Promise<VyraShipment | null> {
  const shipments = await fetchBusinessShipments('');
  return shipments.find((s) => s.id === id) || null;
}

export async function fetchShipmentByTrackingNumber(trackingNumber: string): Promise<VyraShipment | null> {
  const shipments = await fetchBusinessShipments('');
  const cleaned = trackingNumber.trim().toUpperCase();
  return (
    shipments.find(
      (s) => s.tracking_number.toUpperCase() === cleaned || s.order_number?.toUpperCase() === cleaned
    ) || null
  );
}

export async function createShipment(shipmentData: Partial<VyraShipment>): Promise<VyraShipment> {
  const shipments = await fetchBusinessShipments('');
  const newId = generateUuid();
  const trackingNumber =
    shipmentData.tracking_number ||
    `VYRA-${(shipmentData.carrier_name || 'EXP').substring(0, 3).toUpperCase()}-${Math.floor(100000000 + Math.random() * 900000000)}`;

  const createdDate = new Date().toISOString();
  const initialEvent: ShipmentTrackingEvent = {
    id: generateUuid(),
    shipment_id: newId,
    status: 'READY_TO_SHIP',
    status_label: 'Shipment Created & Label Generated',
    location: shipmentData.origin?.city || 'Origin Fulfillment Hub',
    city: shipmentData.origin?.city,
    country: shipmentData.origin?.country,
    description: `Order ${shipmentData.order_number || ''} prepared for dispatch with ${shipmentData.carrier_name || 'Carrier'}.`,
    timestamp: createdDate,
  };

  const initialDoc: ShippingDocument = {
    id: generateUuid(),
    shipment_id: newId,
    doc_type: shipmentData.shipment_type?.includes('CONTAINER') ? 'BILL_OF_LADING' : 'SHIPPING_LABEL',
    doc_number: `DOC-${trackingNumber}`,
    title: shipmentData.shipment_type?.includes('CONTAINER') ? 'Ocean Waybill / B/L Draft' : 'Carrier Shipping Label',
    file_name: `${trackingNumber}_label.pdf`,
    issued_at: createdDate,
    status: 'ISSUED',
    issuer: shipmentData.carrier_name || 'VYRA Global Logistics Engine',
  };

  const newShipment: VyraShipment = {
    id: newId,
    business_id: shipmentData.business_id || 'biz-apex-global',
    order_id: shipmentData.order_id,
    order_number: shipmentData.order_number || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    buyer_id: shipmentData.buyer_id,
    buyer_name: shipmentData.buyer_name || 'Verified Marketplace Buyer',
    seller_id: shipmentData.seller_id,
    seller_name: shipmentData.seller_name || 'Verified Global Supplier',
    tracking_number: trackingNumber,
    carrier_id: shipmentData.carrier_id || 'carrier-dhl',
    carrier_name: shipmentData.carrier_name || 'DHL Express',
    shipping_mode: shipmentData.shipping_mode || 'Express Shipping',
    incoterm: shipmentData.incoterm || 'FOB',
    shipment_type: shipmentData.shipment_type || 'B2C_ECOM',
    origin: shipmentData.origin || {
      contact_name: 'Fulfillment Lead',
      email: 'ops@vyra.trade',
      phone: '+1 555 0100',
      address_line1: '100 Global Freight Pkwy',
      city: 'Newark',
      state_province: 'NJ',
      postal_code: '07114',
      country: 'United States',
      country_code: 'US',
    },
    destination: shipmentData.destination || {
      contact_name: 'Consignee',
      email: 'consignee@example.com',
      phone: '+1 555 0200',
      address_line1: '200 Commercial Way',
      city: 'London',
      state_province: 'Greater London',
      postal_code: 'EC1A 1BB',
      country: 'United Kingdom',
      country_code: 'GB',
    },
    packages: shipmentData.packages || [
      {
        id: generateUuid(),
        description: 'Standard Commercial Package',
        quantity: 1,
        unit_weight_kg: shipmentData.total_weight_kg || 5,
        length_cm: 30,
        width_cm: 20,
        height_cm: 15,
        volumetric_weight_kg: 1.8,
        chargeable_weight_kg: shipmentData.total_weight_kg || 5,
        declared_value: 250,
        currency: 'USD',
      },
    ],
    total_weight_kg: shipmentData.total_weight_kg || 5,
    chargeable_weight_kg: shipmentData.chargeable_weight_kg || shipmentData.total_weight_kg || 5,
    total_packages: shipmentData.total_packages || 1,
    shipping_cost: shipmentData.shipping_cost || 45,
    fuel_surcharge: shipmentData.fuel_surcharge || 5,
    handling_fee: shipmentData.handling_fee || 3,
    customs_duty_est: shipmentData.customs_duty_est || 0,
    insurance_fee: shipmentData.insurance_fee || 0,
    currency: shipmentData.currency || 'USD',
    status: 'READY_TO_SHIP',
    container_details: shipmentData.container_details,
    documents: shipmentData.documents || [initialDoc],
    events: [initialEvent],
    estimated_delivery: shipmentData.estimated_delivery || new Date(Date.now() + 4 * 86400000).toISOString(),
    created_at: createdDate,
    updated_at: createdDate,
    notes: shipmentData.notes,
  };

  const updatedList = [newShipment, ...shipments];
  setLocalTable('shipments', updatedList);

  await recordAuditLog(
    newShipment.business_id,
    'CREATE',
    'Shipments',
    newShipment.id,
    `Shipment created: ${trackingNumber} (${newShipment.shipping_mode}) via ${newShipment.carrier_name}`
  );

  return newShipment;
}

export async function updateShipmentStatus(
  id: string,
  newStatus: ShipmentStatus,
  eventData?: Partial<ShipmentTrackingEvent>
): Promise<VyraShipment> {
  const shipments = await fetchBusinessShipments('');
  const target = shipments.find((s) => s.id === id);
  if (!target) {
    throw new Error(`Shipment ${id} not found`);
  }

  const now = new Date().toISOString();
  const newEvent: ShipmentTrackingEvent = {
    id: generateUuid(),
    shipment_id: id,
    status: newStatus,
    status_label: eventData?.status_label || `Status Updated: ${newStatus.replace(/_/g, ' ')}`,
    location: eventData?.location || target.destination.city,
    city: eventData?.city || target.destination.city,
    country: eventData?.country || target.destination.country,
    description: eventData?.description || `Consignment checkpoint recorded: ${newStatus}`,
    timestamp: now,
  };

  const updatedShipment: VyraShipment = {
    ...target,
    status: newStatus,
    events: [newEvent, ...target.events],
    updated_at: now,
    actual_delivery: newStatus === 'DELIVERED' ? now : target.actual_delivery,
  };

  const updatedList = shipments.map((s) => (s.id === id ? updatedShipment : s));
  setLocalTable('shipments', updatedList);

  await recordAuditLog(
    target.business_id,
    'UPDATE',
    'Shipments',
    id,
    `Shipment ${target.tracking_number} status updated to ${newStatus}`
  );

  return updatedShipment;
}

export async function fetchLogisticsWarehouses(businessId?: string): Promise<LogisticsWarehouse[]> {
  const local = getLocalTable<LogisticsWarehouse>('warehouses');
  if (local.length > 0) {
    return businessId ? local.filter((w) => w.business_id === businessId || !w.business_id) : local;
  }
  setLocalTable('warehouses', SEED_WAREHOUSES);
  return SEED_WAREHOUSES;
}

export async function createLogisticsWarehouse(wh: Partial<LogisticsWarehouse>): Promise<LogisticsWarehouse> {
  const current = await fetchLogisticsWarehouses();
  const newWarehouse: LogisticsWarehouse = {
    id: generateUuid(),
    business_id: wh.business_id || 'biz-apex-global',
    code: wh.code || `WH-${Math.floor(100 + Math.random() * 900)}`,
    name: wh.name || 'New Regional Logistics Hub',
    type: wh.type || 'FULFILLMENT_CENTER',
    address: wh.address || {
      contact_name: 'Warehouse Manager',
      email: 'logistics@vyra.trade',
      phone: '+1 555 0199',
      address_line1: '100 Industrial Pkwy',
      city: 'Chicago',
      state_province: 'IL',
      postal_code: '60601',
      country: 'United States',
      country_code: 'US',
    },
    capacity_sqm: wh.capacity_sqm || 5000,
    dock_count: wh.dock_count || 4,
    manager_name: wh.manager_name || 'Operations Lead',
    manager_phone: wh.manager_phone || '+1 555 0199',
    is_default_origin: wh.is_default_origin || false,
    active_stock_skus: wh.active_stock_skus || 0,
  };

  const updated = [newWarehouse, ...current];
  setLocalTable('warehouses', updated);
  return newWarehouse;
}

export async function updateLogisticsWarehouse(
  id: string,
  updates: Partial<LogisticsWarehouse>
): Promise<LogisticsWarehouse> {
  const current = await fetchLogisticsWarehouses();
  const target = current.find((w) => w.id === id);
  if (!target) throw new Error(`Warehouse ${id} not found`);

  const updatedWarehouse = { ...target, ...updates };
  const updated = current.map((w) => (w.id === id ? updatedWarehouse : w));
  setLocalTable('warehouses', updated);
  return updatedWarehouse;
}

export async function deleteLogisticsWarehouse(id: string): Promise<boolean> {
  const current = await fetchLogisticsWarehouses();
  const filtered = current.filter((w) => w.id !== id);
  setLocalTable('warehouses', filtered);
  return true;
}

export async function fetchLogisticsCarriers(): Promise<LogisticsCarrier[]> {
  const local = getLocalTable<LogisticsCarrier>('carriers');
  if (local.length > 0) return local;
  setLocalTable('carriers', GLOBAL_LOGISTICS_CARRIERS);
  return GLOBAL_LOGISTICS_CARRIERS;
}

export async function fetchLogisticsClaims(businessId?: string): Promise<LogisticsClaim[]> {
  const local = getLocalTable<LogisticsClaim>('logistics_claims');
  if (local.length > 0) return local;
  setLocalTable('logistics_claims', SEED_CLAIMS);
  return SEED_CLAIMS;
}

export async function createLogisticsClaim(claimData: Partial<LogisticsClaim>): Promise<LogisticsClaim> {
  const current = await fetchLogisticsClaims();
  const newClaim: LogisticsClaim = {
    id: generateUuid(),
    shipment_id: claimData.shipment_id || '',
    tracking_number: claimData.tracking_number || '',
    claim_number: `CLM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    claim_type: claimData.claim_type || 'CARGO_DAMAGE',
    claimed_amount: claimData.claimed_amount || 0,
    currency: claimData.currency || 'USD',
    status: 'SUBMITTED',
    description: claimData.description || 'Logistics claim submitted.',
    evidence_attachments: claimData.evidence_attachments || [],
    submitted_by: claimData.submitted_by || 'Business Operator',
    created_at: new Date().toISOString(),
  };

  const updated = [newClaim, ...current];
  setLocalTable('logistics_claims', updated);
  return newClaim;
}

export async function updateLogisticsClaim(id: string, updates: Partial<LogisticsClaim>): Promise<LogisticsClaim> {
  const current = await fetchLogisticsClaims();
  const target = current.find((c) => c.id === id);
  if (!target) throw new Error(`Claim ${id} not found`);

  const updatedClaim = { ...target, ...updates };
  if (updates.status === 'SETTLED' || updates.status === 'APPROVED' || updates.status === 'REJECTED') {
    updatedClaim.resolved_at = new Date().toISOString();
  }
  const updated = current.map((c) => (c.id === id ? updatedClaim : c));
  setLocalTable('logistics_claims', updated);
  return updatedClaim;
}

// --------------------------------------------------------------------
// REAL MULTI-FACTOR SHIPPING RATE CALCULATION ENGINE (Section 49.5)
// --------------------------------------------------------------------
export function calculateShippingQuotes(params: {
  originCountry: string;
  destCountry: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  shipmentType?: string;
  isInsured?: boolean;
  isDangerousGoods?: boolean;
}): ShippingRateCalculation[] {
  const { originCountry, destCountry, weightKg, lengthCm, widthCm, heightCm, isInsured, isDangerousGoods } = params;

  // Volumetric formula: (L * W * H in cm) / 5000 for standard international courier
  const cubicCm = Math.max(1, lengthCm * widthCm * heightCm);
  const volumetricWeightKg = Number((cubicCm / 5000).toFixed(2));
  const chargeableWeightKg = Math.max(weightKg, volumetricWeightKg);

  const isDomestic = originCountry.toUpperCase() === destCountry.toUpperCase();
  const distanceMultiplier = isDomestic ? 1.0 : 2.4;

  const baseFuelSurchargeRate = 0.12; // 12% standard fuel index
  const dangerousGoodsFee = isDangerousGoods ? 85 : 0;
  const insuranceFee = isInsured ? Math.max(15, chargeableWeightKg * 1.5) : 0;

  const quotes: ShippingRateCalculation[] = [
    {
      carrier_id: 'carrier-dhl',
      carrier_name: 'DHL Express Worldwide',
      service_level: 'Air Express Priority (Next Flight Out)',
      mode: 'Express Shipping',
      estimated_days: isDomestic ? 1 : 2,
      chargeable_weight_kg: chargeableWeightKg,
      volumetric_weight_kg: volumetricWeightKg,
      base_rate: Number((chargeableWeightKg * 12.5 * distanceMultiplier).toFixed(2)),
      fuel_surcharge: Number((chargeableWeightKg * 12.5 * distanceMultiplier * baseFuelSurchargeRate).toFixed(2)),
      handling_fee: 15 + dangerousGoodsFee,
      insurance_fee: insuranceFee,
      total_cost: Number(
        (
          chargeableWeightKg * 12.5 * distanceMultiplier * (1 + baseFuelSurchargeRate) +
          15 +
          dangerousGoodsFee +
          insuranceFee
        ).toFixed(2)
      ),
      currency: 'USD',
      is_fastest: true,
    },
    {
      carrier_id: 'carrier-fedex',
      carrier_name: 'FedEx International Priority',
      service_level: 'Standard Air Commercial',
      mode: 'Standard Shipping',
      estimated_days: isDomestic ? 2 : 4,
      chargeable_weight_kg: chargeableWeightKg,
      volumetric_weight_kg: volumetricWeightKg,
      base_rate: Number((chargeableWeightKg * 8.8 * distanceMultiplier).toFixed(2)),
      fuel_surcharge: Number((chargeableWeightKg * 8.8 * distanceMultiplier * baseFuelSurchargeRate).toFixed(2)),
      handling_fee: 10 + dangerousGoodsFee,
      insurance_fee: insuranceFee,
      total_cost: Number(
        (
          chargeableWeightKg * 8.8 * distanceMultiplier * (1 + baseFuelSurchargeRate) +
          10 +
          dangerousGoodsFee +
          insuranceFee
        ).toFixed(2)
      ),
      currency: 'USD',
      is_best_value: true,
    },
    {
      carrier_id: 'carrier-ups',
      carrier_name: 'UPS Worldwide Expedited',
      service_level: 'Economy Commercial Ground/Air',
      mode: 'Economy Shipping',
      estimated_days: isDomestic ? 3 : 6,
      chargeable_weight_kg: chargeableWeightKg,
      volumetric_weight_kg: volumetricWeightKg,
      base_rate: Number((chargeableWeightKg * 6.2 * distanceMultiplier).toFixed(2)),
      fuel_surcharge: Number((chargeableWeightKg * 6.2 * distanceMultiplier * baseFuelSurchargeRate).toFixed(2)),
      handling_fee: 8 + dangerousGoodsFee,
      insurance_fee: insuranceFee,
      total_cost: Number(
        (
          chargeableWeightKg * 6.2 * distanceMultiplier * (1 + baseFuelSurchargeRate) +
          8 +
          dangerousGoodsFee +
          insuranceFee
        ).toFixed(2)
      ),
      currency: 'USD',
      is_cheapest: true,
    },
  ];

  // If heavy cargo or B2B freight (over 50kg), add Ocean & Freight options
  if (chargeableWeightKg >= 30) {
    quotes.push({
      carrier_id: 'carrier-maersk',
      carrier_name: 'Maersk Ocean Consolidated (LCL/FCL)',
      service_level: 'Direct Ocean Line (Port-to-Port / Door-to-Door)',
      mode: 'Sea Freight (LCL)',
      estimated_days: isDomestic ? 7 : 18,
      chargeable_weight_kg: chargeableWeightKg,
      volumetric_weight_kg: volumetricWeightKg,
      base_rate: Number((Math.max(120, chargeableWeightKg * 1.8 * distanceMultiplier)).toFixed(2)),
      fuel_surcharge: Number((chargeableWeightKg * 0.25).toFixed(2)),
      handling_fee: 65,
      insurance_fee: insuranceFee,
      total_cost: Number((Math.max(120, chargeableWeightKg * 1.8 * distanceMultiplier) + chargeableWeightKg * 0.25 + 65 + insuranceFee).toFixed(2)),
      currency: 'USD',
      is_cheapest: true,
    });
  }

  return quotes;
}






