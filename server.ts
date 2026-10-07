import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  getSupabaseServerClient,
  authenticateToken,
  verifyBusinessMembership,
  recordAuditLog,
} from './server/supabaseServer';
import { PaymentGatewayService } from './server/payments';
import {
  calculateQuotationTotals,
  generateSequentialQuotationNumber,
  generateSequentialInvoiceNumber,
} from './server/quotationEngine';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// ----------------------------------------------------------------------
// Rate Limiting (In-Memory sliding window)
// ----------------------------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function rateLimiter(maxRequests: number = 60, windowSeconds: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'anonymous';
    const key = `${ip}_${req.baseUrl || req.path}`;
    const now = Date.now();
    const record = rateLimits.get(key);

    if (!record || now > record.resetAt) {
      rateLimits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down and try again shortly.',
        },
      });
    }

    record.count += 1;
    return next();
  };
}

// ----------------------------------------------------------------------
// Standard Error Response Helper
// ----------------------------------------------------------------------
function sendError(res: Response, statusCode: number, code: string, message: string) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

// ----------------------------------------------------------------------
// Gemini SDK Client
// ----------------------------------------------------------------------
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatAiErrorMessage(error: any): string {
  if (!error) return 'The AI service encountered an unexpected error. Please try again.';
  const rawMessage = error?.message || String(error);

  // Try extracting inner JSON error if present
  try {
    if (rawMessage.includes('{"error":')) {
      const jsonStart = rawMessage.indexOf('{"error":');
      const parsed = JSON.parse(rawMessage.substring(jsonStart));
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    }
  } catch {}

  if (rawMessage.includes('503') || rawMessage.includes('UNAVAILABLE') || rawMessage.includes('high demand')) {
    return 'The AI model is currently experiencing temporary high demand across regional clusters. Please try again in a few moments.';
  }
  if (rawMessage.includes('429') || rawMessage.includes('Resource has been exhausted')) {
    return 'The AI request quota has temporarily been reached. Please wait a few seconds and try again.';
  }
  return rawMessage;
}

function sendAiNotConfiguredError(res: Response) {
  return sendError(res, 503, 'AI_NOT_CONFIGURED', 'AI NOT CONFIGURED');
}

interface GeminiRetryParams {
  model?: string;
  contents: any;
  config?: any;
}

async function callGeminiWithRetry(ai: GoogleGenAI, params: GeminiRetryParams): Promise<any> {
  const primaryModel = params.model || 'gemini-3.8-flash';
  // Candidate sequence with fallback models per gemini-api skill
  const candidateModels = [
    primaryModel,
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError: any = null;

  for (let m = 0; m < candidateModels.length; m++) {
    const currentModel = candidateModels[m];
    const maxTries = m === 0 ? 3 : 2;

    for (let attempt = 0; attempt < maxTries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || '');
        const code = err?.status || err?.code || err?.error?.code;
        const isQuotaExceeded =
          msg.includes('resource_exhausted') ||
          msg.includes('Resource has been exhausted') ||
          msg.includes('Quota exceeded') ||
          msg.includes('exceeded your current quota');

        if (isQuotaExceeded) {
          console.warn(`[Gemini Fallback] Model "${currentModel}" quota exhausted. Instantly advancing to next fallback model...`);
          break;
        }

        const isTransient =
          code === 503 ||
          code === 429 ||
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('overloaded') ||
          msg.includes('ECONNRESET') ||
          msg.includes('ETIMEDOUT');

        if (!isTransient) {
          // Non-transient error (e.g. invalid arguments)
          break;
        }

        const delay = Math.min(600 * Math.pow(1.6, attempt) + Math.random() * 400, 2500);
        console.warn(`[Gemini Retry] Model "${currentModel}" returned transient notice (${code || 'high demand'}). Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxTries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

function extractJson<T>(rawText: string, fallback?: T): T {
  let cleaned = (rawText || '').trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (directErr) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1)) as T;
      } catch {}
    }

    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1)) as T;
      } catch {}
    }

    if (fallback !== undefined) {
      return fallback;
    }
    throw directErr;
  }
}

// ----------------------------------------------------------------------
// Authentication Middleware
// ----------------------------------------------------------------------
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
  businessId?: string;
  userRole?: string;
}

async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const headerUserId = req.headers['x-user-id'] as string;
  const headerUserEmail = req.headers['x-user-email'] as string;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const authResult = await authenticateToken(authHeader);
    if (authResult.user) {
      req.user = authResult.user;
      return next();
    }
  }

  // Support local development / direct client identity when token is absent
  if (headerUserId) {
    req.user = {
      id: headerUserId,
      email: headerUserEmail || 'user@msnexus.com',
      full_name: (headerUserEmail || 'user').split('@')[0],
    };
    return next();
  }

  return next();
}

// ----------------------------------------------------------------------
// 1. HEALTH & ENVIRONMENT CHECK
// ----------------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_KEY;
  const hasSupabaseUrl = Boolean(supabaseUrl && !supabaseUrl.includes('your-project') && !supabaseUrl.includes('placeholder'));
  const hasSupabase = Boolean(hasSupabaseUrl && supabaseAnon && !supabaseAnon.includes('your-anon') && !supabaseAnon.includes('placeholder'));
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 10);
  const paymentStatus = PaymentGatewayService.getProviderStatus();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      ai_configured: hasGemini,
      supabase_env_configured: hasSupabase,
      supabase_service_role_configured: hasServiceRole,
      stripe_configured: paymentStatus.stripe_configured,
      razorpay_configured: paymentStatus.razorpay_configured,
      payouts_configured: paymentStatus.payout_configured,
      active_payment_provider: paymentStatus.active_provider,
    },
  });
});

app.get('/api/config', (req: Request, res: Response) => {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const anonKey = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  // STRICTLY browser-safe credentials only. NEVER return service role or payment secrets.
  res.json({
    supabaseUrl: url && !url.includes('your-project') && !url.includes('placeholder') ? url : '',
    supabaseAnonKey: anonKey && !anonKey.includes('your-anon') && !anonKey.includes('placeholder') ? anonKey : '',
  });
});

// ----------------------------------------------------------------------
// 2. BUSINESSES & TENANT MANAGEMENT
// ----------------------------------------------------------------------
app.get('/api/businesses', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const userId = req.user?.id;

  if (!supabase || !userId) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { data: memberBizs } = await supabase
      .from('business_members')
      .select('business_id, role')
      .eq('user_id', userId)
      .eq('status', 'active');

    const bizIds = (memberBizs || []).map((m) => m.business_id);

    let query = supabase.from('businesses').select('*');
    if (bizIds.length > 0) {
      query = query.or(`user_id.eq.${userId},owner_id.eq.${userId},id.in.(${bizIds.join(',')})`);
    } else {
      query = query.or(`user_id.eq.${userId},owner_id.eq.${userId}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return sendError(res, 500, 'DB_ERROR', err.message);
  }
});

app.post('/api/businesses', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const userId = req.user?.id;

  if (!userId) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required to create a business');
  }

  const { name, business_type, country, currency, industry, export_countries } = req.body;
  if (!name) {
    return sendError(res, 400, 'INVALID_INPUT', 'Business name is required');
  }

  if (!supabase) {
    return res.json({
      success: true,
      data: {
        id: 'biz_' + Date.now(),
        name,
        business_type: business_type || 'Manufacturer',
        country: country || 'India',
        currency: currency || 'USD',
        industry: industry || 'B2B Commerce',
        created_at: new Date().toISOString(),
      },
    });
  }

  try {
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        name: name.trim(),
        user_id: userId,
        owner_id: userId,
        business_type: business_type || 'Manufacturer',
        country: country || 'India',
        currency: currency || 'USD',
        industry: industry || 'B2B Commerce',
        export_countries: export_countries || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Add user as OWNER in business_members
    await supabase.from('business_members').insert({
      business_id: data.id,
      user_id: userId,
      role: 'OWNER',
      status: 'active',
    });

    await recordAuditLog({
      businessId: data.id,
      userId,
      userEmail: req.user?.email,
      action: 'BUSINESS_CREATED',
      entityType: 'business',
      entityId: data.id,
      description: `Created business entity: ${data.name}`,
    });

    return res.json({ success: true, data });
  } catch (err: any) {
    return sendError(res, 500, 'CREATE_BUSINESS_FAILED', err.message);
  }
});

// ----------------------------------------------------------------------
// 3. PRODUCTS & INVENTORY
// ----------------------------------------------------------------------
app.get('/api/products', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string);

  if (!supabase || !businessId) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return sendError(res, 500, 'FETCH_PRODUCTS_ERROR', err.message);
  }
});

app.post('/api/products', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const userId = req.user?.id;
  const { business_id, name, category, price, currency, moq, stock_quantity, description, sku, images } = req.body;

  if (!business_id || !name || !category) {
    return sendError(res, 400, 'INVALID_INPUT', 'business_id, name, and category are required');
  }

  if (!supabase) {
    return res.json({
      success: true,
      data: {
        id: 'prod_' + Date.now(),
        business_id,
        name,
        category,
        price: price || 0,
        currency: currency || 'USD',
        moq: moq || 1,
        stock_quantity: stock_quantity || 0,
        description: description || '',
        images: images || [],
        created_at: new Date().toISOString(),
      },
    });
  }

  try {
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        business_id,
        name: name.trim(),
        sku: sku || undefined,
        category: category.trim(),
        price: Number(price) || 0,
        currency: currency || 'USD',
        moq: Number(moq) || 1,
        stock_quantity: Number(stock_quantity) || 0,
        description: description || '',
        images: images || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Record initial inventory movement
    if (Number(stock_quantity) > 0) {
      await supabase.from('inventory_movements').insert({
        business_id,
        product_id: product.id,
        movement_type: 'stock_in',
        quantity_change: Number(stock_quantity),
        previous_stock: 0,
        new_stock: Number(stock_quantity),
        reason: 'Initial stock on product creation',
        created_by: userId || null,
      });
    }

    await recordAuditLog({
      businessId: business_id,
      userId,
      userEmail: req.user?.email,
      action: 'PRODUCT_CREATED',
      entityType: 'product',
      entityId: product.id,
      description: `Created product: ${product.name} (${product.sku || 'No SKU'})`,
    });

    return res.json({ success: true, data: product });
  } catch (err: any) {
    return sendError(res, 500, 'CREATE_PRODUCT_FAILED', err.message);
  }
});

// Inventory stock adjustment
app.post('/api/inventory/movements', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const userId = req.user?.id;
  const { business_id, product_id, movement_type, quantity_change, reason } = req.body;

  if (!business_id || !product_id || !movement_type || quantity_change === undefined) {
    return sendError(res, 400, 'INVALID_INPUT', 'business_id, product_id, movement_type, quantity_change required');
  }

  if (!supabase) {
    return res.json({ success: true, message: 'Stock updated in local session' });
  }

  try {
    const { data: prod, error: fetchErr } = await supabase
      .from('products')
      .select('stock_quantity, name')
      .eq('id', product_id)
      .single();

    if (fetchErr || !prod) {
      return sendError(res, 404, 'NOT_FOUND', 'Product not found');
    }

    const currentStock = prod.stock_quantity || 0;
    const newStock = Math.max(0, currentStock + Number(quantity_change));

    await supabase.from('products').update({ stock_quantity: newStock }).eq('id', product_id);

    const { data: movement, error: moveErr } = await supabase
      .from('inventory_movements')
      .insert({
        business_id,
        product_id,
        movement_type,
        quantity_change: Number(quantity_change),
        previous_stock: currentStock,
        new_stock: newStock,
        reason: reason || 'Manual stock adjustment',
        created_by: userId || null,
      })
      .select()
      .single();

    if (moveErr) throw moveErr;

    await recordAuditLog({
      businessId: business_id,
      userId,
      userEmail: req.user?.email,
      action: 'INVENTORY_ADJUSTED',
      entityType: 'inventory',
      entityId: product_id,
      description: `Stock adjusted for ${prod.name}: ${currentStock} -> ${newStock} (${quantity_change > 0 ? '+' : ''}${quantity_change})`,
    });

    return res.json({ success: true, data: { new_stock: newStock, movement } });
  } catch (err: any) {
    return sendError(res, 500, 'INVENTORY_UPDATE_FAILED', err.message);
  }
});

// ----------------------------------------------------------------------
// 4. CRM & LEADS
// ----------------------------------------------------------------------
app.post('/api/leads', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const userId = req.user?.id;
  const { business_id, name, company, country, email, phone, product_interest, estimated_deal_value, currency, notes, status } = req.body;

  if (!business_id || !name) {
    return sendError(res, 400, 'INVALID_INPUT', 'business_id and name are required');
  }

  if (!supabase) {
    return res.json({
      success: true,
      data: {
        id: 'lead_' + Date.now(),
        business_id,
        name,
        company: company || 'Direct Buyer',
        country: country || 'International',
        status: status || 'New',
        created_at: new Date().toISOString(),
      },
    });
  }

  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        business_id,
        name: name.trim(),
        company: company?.trim() || 'Direct Buyer',
        country: country || 'International',
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        product_interest: product_interest || null,
        estimated_deal_value: Number(estimated_deal_value) || 0,
        currency: currency || 'USD',
        notes: notes || null,
        status: status || 'New',
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('lead_activities').insert({
      business_id,
      lead_id: lead.id,
      activity_type: 'LEAD_CREATED',
      description: `Lead created from inbound intake: ${lead.name} (${lead.company})`,
      created_by: userId || null,
    });

    await recordAuditLog({
      businessId: business_id,
      userId,
      userEmail: req.user?.email,
      action: 'LEAD_CREATED',
      entityType: 'lead',
      entityId: lead.id,
      description: `Added lead: ${lead.name} (${lead.company})`,
    });

    return res.json({ success: true, data: lead });
  } catch (err: any) {
    return sendError(res, 500, 'CREATE_LEAD_FAILED', err.message);
  }
});

// Update lead with lifecycle tracking
app.put('/api/leads/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const userId = req.user?.id;
  const leadId = req.params.id;
  const updates = req.body;

  if (!supabase) {
    return res.json({ success: true, data: { id: leadId, ...updates } });
  }

  try {
    const { data: oldLead } = await supabase.from('leads').select('*').eq('id', leadId).single();

    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;

    // Track status change activity
    if (oldLead && updates.status && oldLead.status !== updates.status) {
      await supabase.from('lead_activities').insert({
        business_id: updatedLead.business_id,
        lead_id: leadId,
        activity_type: 'STATUS_CHANGED',
        description: `Status changed from ${oldLead.status} to ${updates.status}`,
        created_by: userId || null,
      });

      await recordAuditLog({
        businessId: updatedLead.business_id,
        userId,
        userEmail: req.user?.email,
        action: 'LEAD_STATUS_CHANGED',
        entityType: 'lead',
        entityId: leadId,
        description: `Lead "${updatedLead.name}" status changed: ${oldLead.status} -> ${updates.status}`,
      });
    }

    return res.json({ success: true, data: updatedLead });
  } catch (err: any) {
    return sendError(res, 500, 'UPDATE_LEAD_FAILED', err.message);
  }
});

// ----------------------------------------------------------------------
// 5. QUOTATIONS (Server-Side Pricing Math & Sequential Numbering)
// ----------------------------------------------------------------------
app.post('/api/quotations', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const userId = req.user?.id;
  const {
    business_id,
    buyer_name,
    buyer_company,
    buyer_email,
    buyer_country,
    buyer_phone,
    currency,
    items,
    discount_amount,
    shipping_fee,
    tax_rate,
    payment_terms,
    delivery_terms,
    validity_date,
    notes,
    seller_details,
  } = req.body;

  if (!business_id || !buyer_name || !items || !Array.isArray(items) || items.length === 0) {
    return sendError(res, 400, 'INVALID_INPUT', 'business_id, buyer_name, and at least one item are required');
  }

  // Strict Server-Side Financial Math
  const calculated = calculateQuotationTotals(
    items,
    Number(discount_amount) || 0,
    Number(shipping_fee) || 0,
    Number(tax_rate) || 0
  );

  const quoteNumber = await generateSequentialQuotationNumber(business_id);

  if (!supabase) {
    return res.json({
      success: true,
      data: {
        id: 'quote_' + Date.now(),
        business_id,
        quote_number: quoteNumber,
        buyer_name,
        buyer_company,
        currency: currency || 'USD',
        ...calculated,
        status: 'Draft',
        created_at: new Date().toISOString(),
      },
    });
  }

  try {
    const { data: quote, error: quoteErr } = await supabase
      .from('quotations')
      .insert({
        business_id,
        quote_number: quoteNumber,
        buyer_name,
        buyer_company: buyer_company || null,
        buyer_email: buyer_email || null,
        buyer_country: buyer_country || null,
        buyer_phone: buyer_phone || null,
        currency: currency || 'USD',
        subtotal: calculated.subtotal,
        discount_amount: calculated.discount_amount,
        shipping_fee: calculated.shipping_fee,
        tax_amount: calculated.tax_amount,
        total_amount: calculated.total_amount,
        payment_terms: payment_terms || '30% advance, balance against B/L',
        delivery_terms: delivery_terms || 'FOB',
        validity_date: validity_date || null,
        notes: notes || null,
        seller_details: seller_details || {},
        status: 'Draft',
      })
      .select()
      .single();

    if (quoteErr) throw quoteErr;

    // Insert quotation line items
    const lineItems = calculated.items.map((it) => ({
      quotation_id: quote.id,
      product_id: it.product_id || null,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price,
    }));

    await supabase.from('quotation_items').insert(lineItems);

    await recordAuditLog({
      businessId: business_id,
      userId,
      userEmail: req.user?.email,
      action: 'QUOTATION_CREATED',
      entityType: 'quotation',
      entityId: quote.id,
      description: `Generated proforma quotation ${quoteNumber} for ${buyer_name} (${currency || 'USD'} ${calculated.total_amount})`,
    });

    return res.json({ success: true, data: { ...quote, items: calculated.items } });
  } catch (err: any) {
    return sendError(res, 500, 'CREATE_QUOTATION_FAILED', err.message);
  }
});

// ----------------------------------------------------------------------
// 6. INVOICING & ORDERS
// ----------------------------------------------------------------------
app.post('/api/invoices', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const userId = req.user?.id;
  const {
    business_id,
    order_id,
    quotation_id,
    customer_name,
    customer_company,
    customer_email,
    customer_address,
    currency,
    items,
    tax_rate,
    discount_amount,
    shipping_fee,
    due_date,
    notes,
  } = req.body;

  if (!business_id || !customer_name || !items || !Array.isArray(items)) {
    return sendError(res, 400, 'INVALID_INPUT', 'business_id, customer_name, and items are required');
  }

  const calculated = calculateQuotationTotals(
    items,
    Number(discount_amount) || 0,
    Number(shipping_fee) || 0,
    Number(tax_rate) || 0
  );

  const invoiceNumber = await generateSequentialInvoiceNumber(business_id);

  if (!supabase) {
    return res.json({
      success: true,
      data: {
        id: 'inv_' + Date.now(),
        business_id,
        invoice_number: invoiceNumber,
        customer_name,
        currency: currency || 'USD',
        ...calculated,
        payment_status: 'Issued',
        created_at: new Date().toISOString(),
      },
    });
  }

  try {
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        business_id,
        order_id: order_id || null,
        quotation_id: quotation_id || null,
        invoice_number: invoiceNumber,
        customer_name,
        customer_company: customer_company || null,
        customer_email: customer_email || null,
        customer_address: customer_address || null,
        currency: currency || 'USD',
        subtotal: calculated.subtotal,
        tax_rate: Number(tax_rate) || 0,
        tax_amount: calculated.tax_amount,
        discount_amount: calculated.discount_amount,
        shipping_fee: calculated.shipping_fee,
        total_amount: calculated.total_amount,
        amount_paid: 0,
        payment_status: 'Issued',
        due_date: due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        notes: notes || null,
      })
      .select()
      .single();

    if (invErr) throw invErr;

    const invoiceItems = calculated.items.map((it) => ({
      invoice_id: invoice.id,
      product_id: it.product_id || null,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price,
    }));

    await supabase.from('invoice_items').insert(invoiceItems);

    await recordAuditLog({
      businessId: business_id,
      userId,
      userEmail: req.user?.email,
      action: 'INVOICE_ISSUED',
      entityType: 'invoice',
      entityId: invoice.id,
      description: `Issued invoice ${invoiceNumber} to ${customer_name} (${currency || 'USD'} ${calculated.total_amount})`,
    });

    return res.json({ success: true, data: { ...invoice, items: calculated.items } });
  } catch (err: any) {
    return sendError(res, 500, 'CREATE_INVOICE_FAILED', err.message);
  }
});

// ----------------------------------------------------------------------
// 7. PAYMENTS & BANKING (Sanitized, No Secrets, Real Providers)
// ----------------------------------------------------------------------
app.get('/api/payments/status', (req: Request, res: Response) => {
  const status = PaymentGatewayService.getProviderStatus();
  return res.json({ success: true, data: status });
});

app.post('/api/payments/create-intent', rateLimiter(20, 60), async (req: Request, res: Response) => {
  const { business_id, order_id, invoice_id, amount, currency, customer_email, customer_name } = req.body;

  if (!business_id || !order_id || !amount || !currency) {
    return sendError(res, 400, 'INVALID_INPUT', 'business_id, order_id, amount, and currency are required');
  }

  const result = await PaymentGatewayService.createPaymentIntent({
    businessId: business_id,
    orderId: order_id,
    invoiceId: invoice_id,
    amount: Number(amount),
    currency,
    customerEmail: customer_email,
    customerName: customer_name,
  });

  if (!result.configured) {
    return res.status(200).json({
      success: false,
      configured: false,
      provider: 'none',
      message: 'PAYMENT PROVIDER NOT CONFIGURED',
    });
  }

  return res.json(result);
});

// Secure Server-Side Payment Verification
app.post('/api/payments/verify', rateLimiter(30, 60), async (req: Request, res: Response) => {
  const { provider, paymentId, orderId, signature } = req.body;

  if (!provider) {
    return sendError(res, 400, 'INVALID_INPUT', 'Payment provider is required');
  }

  const result = await PaymentGatewayService.verifyPayment({
    provider,
    paymentId,
    orderId,
    signature,
  });

  if (!result.verified) {
    return res.status(400).json({
      success: false,
      verified: false,
      error: result.error || 'Payment could not be verified by server',
    });
  }

  // If orderId is provided, update the order status to PAID and record order_status_history
  if (orderId) {
    const supabase = getSupabaseServerClient(req.headers.authorization);
    if (supabase) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'Paid',
          status: 'Confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      const { data: ord } = await supabase.from('orders').select('business_id').eq('id', orderId).maybeSingle();
      if (ord) {
        await supabase.from('order_status_history').insert({
          id: randomUUID(),
          business_id: ord.business_id,
          order_id: orderId,
          old_status: 'Draft',
          new_status: 'Confirmed',
          notes: `Payment verified via ${provider}. Transaction ID: ${result.transactionId}`,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  return res.json({
    success: true,
    verified: true,
    data: result,
  });
});

// Bank Accounts (Sanitized: only stores last4, bank name, holder name)
app.post('/api/banking/accounts', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const userId = req.user?.id;
  const { business_id, account_holder_name, bank_name, account_type, country, currency, account_number_raw } = req.body;

  if (!business_id || !account_holder_name || !bank_name || !account_number_raw) {
    return sendError(res, 400, 'INVALID_INPUT', 'Account holder name, bank name, and account number are required');
  }

  // Security check: Never store full account or card number
  const rawClean = String(account_number_raw).replace(/\s+/g, '');
  const last4 = rawClean.slice(-4);

  if (!supabase) {
    return res.json({
      success: true,
      data: {
        id: 'bank_' + Date.now(),
        business_id,
        account_holder_name,
        bank_name,
        account_type: account_type || 'current',
        country: country || 'India',
        currency: currency || 'USD',
        last4,
        status: 'active',
        is_primary: true,
      },
    });
  }

  try {
    const { data: bankAccount, error } = await supabase
      .from('bank_accounts')
      .insert({
        business_id,
        account_holder_name: account_holder_name.trim(),
        bank_name: bank_name.trim(),
        account_type: account_type || 'current',
        country: country || 'India',
        currency: currency || 'USD',
        provider: 'Direct_Wire',
        last4,
        is_primary: true,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    await recordAuditLog({
      businessId: business_id,
      userId,
      userEmail: req.user?.email,
      action: 'BANK_ACCOUNT_LINKED',
      entityType: 'bank_account',
      entityId: bankAccount.id,
      description: `Linked corporate account at ${bank_name} (Ending in ***${last4})`,
    });

    return res.json({ success: true, data: bankAccount });
  } catch (err: any) {
    return sendError(res, 500, 'LINK_BANK_FAILED', err.message);
  }
});

// Payout Initiation (Guarded, never simulates payout)
app.post('/api/banking/payouts', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { business_id, bank_account_id, amount, currency, notes } = req.body;

  if (!business_id || !bank_account_id || !amount) {
    return sendError(res, 400, 'INVALID_INPUT', 'business_id, bank_account_id, and amount are required');
  }

  const result = await PaymentGatewayService.requestBankPayout({
    businessId: business_id,
    bankAccountId: bank_account_id,
    amount: Number(amount),
    currency: currency || 'USD',
    notes,
  });

  return res.json(result);
});

// ----------------------------------------------------------------------
// 8. REAL DATABASE ANALYTICS
// ----------------------------------------------------------------------
app.get('/api/analytics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string);

  if (!supabase || !businessId) {
    return res.json({
      success: true,
      data: {
        total_revenue: 0,
        gross_sales: 0,
        paid_invoices_count: 0,
        pending_invoices_amount: 0,
        total_leads: 0,
        qualified_leads: 0,
        open_quotations_value: 0,
        total_orders: 0,
        conversion_rate_percent: 0,
      },
    });
  }

  try {
    const [ordersRes, leadsRes, quotesRes, invoicesRes, expensesRes] = await Promise.all([
      supabase.from('orders').select('total_amount, status, payment_status').eq('business_id', businessId),
      supabase.from('leads').select('id, status, estimated_deal_value').eq('business_id', businessId),
      supabase.from('quotations').select('total_amount, status').eq('business_id', businessId),
      supabase.from('invoices').select('total_amount, amount_paid, payment_status').eq('business_id', businessId),
      supabase.from('expenses').select('amount').eq('business_id', businessId),
    ]);

    const orders = ordersRes.data || [];
    const leads = leadsRes.data || [];
    const quotes = quotesRes.data || [];
    const invoices = invoicesRes.data || [];
    const expenses = expensesRes.data || [];

    // Real calculations
    const grossSales = orders
      .filter((o) => o.payment_status === 'Paid' || o.payment_status === 'Advance Paid' || o.payment_status === 'Fully Paid')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const paidInvoicesAmount = invoices
      .filter((i) => i.payment_status === 'Paid')
      .reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);

    const pendingReceivables = invoices
      .filter((i) => i.payment_status === 'Issued' || i.payment_status === 'Partially Paid' || i.payment_status === 'Overdue')
      .reduce((sum, i) => sum + ((Number(i.total_amount) || 0) - (Number(i.amount_paid) || 0)), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const qualifiedLeadsCount = leads.filter((l) => l.status === 'Qualified' || l.status === 'Quotation Sent' || l.status === 'Won').length;
    const wonLeadsCount = leads.filter((l) => l.status === 'Won').length;
    const conversionRate = leads.length > 0 ? Math.round((wonLeadsCount / leads.length) * 100) : 0;

    const pipelineValue = quotes
      .filter((q) => q.status === 'Sent' || q.status === 'Negotiation' || q.status === 'Viewed')
      .reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0);

    return res.json({
      success: true,
      data: {
        total_revenue: grossSales || paidInvoicesAmount,
        gross_sales: grossSales,
        paid_invoices_count: invoices.filter((i) => i.payment_status === 'Paid').length,
        pending_invoices_amount: pendingReceivables,
        total_expenses: totalExpenses,
        net_profit: (grossSales || paidInvoicesAmount) - totalExpenses,
        total_leads: leads.length,
        qualified_leads: qualifiedLeadsCount,
        open_quotations_value: pipelineValue,
        total_orders: orders.length,
        conversion_rate_percent: conversionRate,
      },
    });
  } catch (err: any) {
    return sendError(res, 500, 'ANALYTICS_ERROR', err.message);
  }
});

// ----------------------------------------------------------------------
// 9. AUDIT LOGS & DATA EXPORT
// ----------------------------------------------------------------------
app.get('/api/audit-logs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string);

  if (!supabase || !businessId) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return sendError(res, 500, 'FETCH_AUDIT_ERROR', err.message);
  }
});

// Multi-entity JSON/CSV Export
app.get('/api/export', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const supabase = getSupabaseServerClient(req.headers.authorization);
  const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string);
  const format = (req.query.format as string) || 'json';

  if (!supabase || !businessId) {
    return sendError(res, 400, 'INVALID_REQUEST', 'Business ID is required for export');
  }

  try {
    const [bizRes, prodsRes, leadsRes, quotesRes, ordersRes, invsRes] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', businessId).single(),
      supabase.from('products').select('*').eq('business_id', businessId),
      supabase.from('leads').select('*').eq('business_id', businessId),
      supabase.from('quotations').select('*').eq('business_id', businessId),
      supabase.from('orders').select('*').eq('business_id', businessId),
      supabase.from('invoices').select('*').eq('business_id', businessId),
    ]);

    const exportBundle = {
      business: bizRes.data,
      exported_at: new Date().toISOString(),
      products: prodsRes.data || [],
      leads: leadsRes.data || [],
      quotations: quotesRes.data || [],
      orders: ordersRes.data || [],
      invoices: invsRes.data || [],
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="ms_nexus_export_${businessId}.json"`);
      return res.send(JSON.stringify(exportBundle, null, 2));
    }

    return res.json({ success: true, data: exportBundle });
  } catch (err: any) {
    return sendError(res, 500, 'EXPORT_FAILED', err.message);
  }
});

// ----------------------------------------------------------------------
// Real Business Database Snapshot Resolver for AI
// ----------------------------------------------------------------------
async function getRealBusinessSnapshot(authHeader?: string, businessId?: string) {
  const supabase = getSupabaseServerClient(authHeader);
  if (!supabase || !businessId) {
    return {
      products: [] as any[],
      leads: [] as any[],
      orders: [] as any[],
      quotations: [] as any[],
      rfqs: [] as any[],
      business: null as any,
    };
  }

  try {
    const [bizRes, prodRes, leadRes, ordRes, quoteRes, rfqRes] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', businessId).maybeSingle(),
      supabase.from('products').select('id, title, price, currency, stock_quantity, category').eq('business_id', businessId).limit(50),
      supabase.from('leads').select('id, company_name, contact_name, stage, deal_value, score, country').eq('business_id', businessId).limit(50),
      supabase.from('orders').select('id, order_number, total_amount, currency, status, created_at').eq('business_id', businessId).limit(50),
      supabase.from('quotations').select('id, quotation_number, buyer_name, total_amount, currency, status').eq('business_id', businessId).limit(50),
      supabase.from('rfqs').select('id, title, category, target_price, quantity, delivery_country, status').limit(30),
    ]);

    return {
      business: bizRes.data || null,
      products: prodRes.data || [],
      leads: leadRes.data || [],
      orders: ordRes.data || [],
      quotations: quoteRes.data || [],
      rfqs: rfqRes.data || [],
    };
  } catch (err) {
    console.error('Real snapshot query notice:', err);
    return {
      products: [] as any[],
      leads: [] as any[],
      orders: [] as any[],
      quotations: [] as any[],
      rfqs: [] as any[],
      business: null as any,
    };
  }
}

// ----------------------------------------------------------------------
// 10. AI SERVICES (NEXA Real Autonomous Engine, Sandboxed to Tenant)
// ----------------------------------------------------------------------
app.post('/api/ai/revenue-agent', rateLimiter(30, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const {
      productName,
      productDescription,
      productCategory,
      price,
      currency,
      moq,
      quantityAvailable,
      targetCountries,
      targetBuyerType,
      shippingInfo,
      paymentTerms,
      customNotes,
      businessProfile,
    } = req.body;

    if (!productName || !productCategory) {
      return sendError(res, 400, 'INVALID_INPUT', 'Product name and category are required');
    }

    const prompt = `
You are the Chief Commercial Officer & Global Revenue Engine for an international B2B commerce platform.
Analyze this product and generate a complete, institutional-grade commercial sales strategy for finding and converting buyers.

PRODUCT DATA:
- Product Name: ${productName}
- Category: ${productCategory}
- Description: ${productDescription || 'N/A'}
- Unit Price: ${price ? `${price} ${currency || 'USD'}` : 'Quote on request'}
- Minimum Order Quantity (MOQ): ${moq || 1} units
- Available Stock/Production Capacity: ${quantityAvailable || 'Made to order'}
- Target Countries: ${Array.isArray(targetCountries) ? targetCountries.join(', ') : targetCountries || 'Global export markets'}
- Target Buyer Type: ${targetBuyerType || 'Importers, Wholesalers, Distributors, Commercial Contractors'}
- Shipping Terms: ${shippingInfo || 'FOB / CIF negotiable'}
- Payment Terms: ${paymentTerms || 'T/T, L/C, 30% advance'}
- Custom Notes: ${customNotes || 'None'}

SELLER BUSINESS PROFILE:
- Business: ${businessProfile?.name || 'Authorized Manufacturer/Supplier'}
- Type: ${businessProfile?.business_type || 'Manufacturer & Exporter'}
- Origin Country: ${businessProfile?.country || 'Export Origin'}
- Export Focus: ${businessProfile?.export_countries?.join(', ') || 'International'}

IMPORTANT MANDATE:
Do NOT make unrealistic guarantees or claim "₹2.5 crore guaranteed". Provide strategic estimates, scenario analysis, and actionable trade positioning.

Provide a rigorous, actionable output in valid JSON strictly conforming to this structure:
{
  "product_analysis": {
    "summary": "Concise commercial assessment of the product in target B2B trade",
    "market_appeal": "Why buyers in target markets purchase this product",
    "perceived_value_drivers": ["driver 1", "driver 2", "driver 3"],
    "potential_limitations": ["commercial limitation or compliance challenge to address"]
  },
  "ideal_customer_profile": {
    "target_industries": ["industry 1", "industry 2"],
    "company_types": ["type 1", "type 2"],
    "ideal_company_size": "Revenue/procurement profile",
    "key_decision_makers": ["Chief Procurement Officer", "Import Director"],
    "geographical_markets": ["Country/Region 1", "Country/Region 2"]
  },
  "buyer_personas": [
    {
      "title": "e.g. Commercial Stone Importer & Distributor",
      "role": "Role description",
      "pain_points": ["Specific friction 1", "Specific friction 2"],
      "buying_triggers": ["Trigger 1", "Trigger 2"],
      "preferred_communication": "Email / WhatsApp / RFQ portal"
    }
  ],
  "buyer_search_keywords": {
    "b2b_trade_queries": ["exact B2B directory search query 1", "query 2"],
    "google_search_keywords": ["keyword 1", "keyword 2"],
    "import_directory_filters": ["filter 1", "filter 2"],
    "hs_code_suggestions": ["Suggested HS code with classification"]
  },
  "sales_positioning": "Strategic 2-3 sentence market positioning statement highlighting quality, compliance, and supply assurance.",
  "unique_selling_points": ["USP 1", "USP 2", "USP 3", "USP 4"],
  "suggested_offer": {
    "headline": "Compelling B2B opening proposition",
    "structure": "Pricing tier, volume discount, sample policy or warranty structure",
    "pricing_guidance": "Recommended negotiation boundaries and margin protection",
    "risk_reversal_guarantee": "Inspection guarantee, container load assurance, or sample rebate"
  },
  "personalized_sales_message": "A crisp, high-converting B2B outreach message (100-150 words) suitable for direct outreach to a verified buyer.",
  "email_draft": {
    "subject": "Clear, non-spammy subject line for B2B procurement decision maker",
    "body": "Formal commercial email draft highlighting specs, MOQ, international shipping terms, and next steps."
  },
  "whatsapp_draft": "Professional yet direct WhatsApp trade introduction with bullet specs and call to action for sending the catalog/quote.",
  "follow_up_sequence": [
    {
      "day": 3,
      "title": "Follow-up #1: Spec Sheet & Case References",
      "channel": "Email",
      "template": "Draft for follow-up 1"
    },
    {
      "day": 7,
      "title": "Follow-up #2: Volume Pricing & Lead Times",
      "channel": "Email / WhatsApp",
      "template": "Draft for follow-up 2"
    },
    {
      "day": 14,
      "title": "Follow-up #3: Direct Procurement Check-in",
      "channel": "Phone / WhatsApp",
      "template": "Draft for follow-up 3"
    }
  ],
  "objection_handling": [
    {
      "objection": "Price is higher than regional competitors",
      "response": "Nuanced, high-margin defense focusing on defect rates, durability, and total landed cost."
    },
    {
      "objection": "Concerned about lead times or international freight damage",
      "response": "Assurance addressing seaworthy export packaging, transit insurance, and milestone tracking."
    }
  ],
  "suggested_next_action": "Immediate tactical step the sales rep should take today."
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Revenue Agent Error:', error);
    return sendError(res, 503, 'AI_GENERATION_FAILED', formatAiErrorMessage(error));
  }
});

app.post('/api/ai/qualify-lead', rateLimiter(40, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { lead, business, products } = req.body;
    if (!lead || !lead.name || !lead.company) {
      return sendError(res, 400, 'INVALID_INPUT', 'Lead details (name, company) are required');
    }

    const prompt = `
You are an expert B2B Deal Qualification Officer using MEDDIC and BANT frameworks.
Analyze the provided lead against the seller's business and product catalog to produce a realistic, transparent opportunity qualification.

LEAD DETAILS:
- Name: ${lead.name}
- Company: ${lead.company}
- Country: ${lead.country || 'Unknown'}
- Email: ${lead.email || 'None provided'}
- Phone/WhatsApp: ${lead.phone || 'None provided'}
- Website: ${lead.website || 'None provided'}
- Acquisition Source: ${lead.source || 'Inbound'}
- Product Interest: ${lead.product_interest || 'General inquiry'}
- Estimated Deal Value: ${lead.estimated_deal_value ? `${lead.estimated_deal_value} ${lead.currency || 'USD'}` : 'Not specified'}
- Current Status: ${lead.status || 'New'}
- Existing Notes: ${lead.notes || 'None'}

SELLER CONTEXT:
- Business: ${business?.name || 'Seller'}
- Industry: ${business?.industry || 'B2B'}
- Products available: ${products?.map((p: any) => `${p.name} (${p.category})`).join(', ') || 'Full catalog'}

IMPORTANT RULE:
Do not claim certainty. Do not guarantee closed revenue.
Classify opportunity signal strictly as "High", "Medium", or "Low" based on evidence.
Identify clear missing information that the sales team must verify before issuing heavy discounts.

Respond strictly in JSON format matching this schema:
{
  "summary": "2-3 sentence candid executive summary of lead viability",
  "signal": "High" | "Medium" | "Low",
  "buying_intent_score": 75,
  "product_fit_score": 80,
  "buying_intent_signals": ["Concrete indicator 1", "Concrete indicator 2"],
  "product_fit_analysis": "Assessment of whether their requirements match our manufacturing/catalog capabilities",
  "missing_information": ["Crucial unverified item 1", "Crucial unverified item 2"],
  "suggested_questions": ["Strategic qualification question to ask buyer in next call"],
  "suggested_next_actions": ["Immediate practical step for sales team"],
  "risk_factors": ["Commercial risk or delivery friction note"]
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Qualify Error:', error);
    return sendError(res, 503, 'AI_QUALIFY_FAILED', formatAiErrorMessage(error));
  }
});

app.post('/api/ai/buyer-discovery', rateLimiter(30, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { product, targetCountry, buyerType, industry, minimumOrderRequirement } = req.body;

    const prompt = `
You are an International Trade Advisor and B2B Market Entry Strategist.
Generate a structured buyer discovery blueprint and acquisition strategy for this product and target market.

PARAMETERS:
- Product / Commodity: ${product || 'Commercial Goods'}
- Target Country / Region: ${targetCountry || 'Global'}
- Target Buyer Category: ${buyerType || 'Importers & Wholesalers'}
- Industry Sector: ${industry || 'Commercial & Industrial'}
- Minimum Order Requirement: ${minimumOrderRequirement || 'Standard Container Load / Wholesale MOQ'}

CRITICAL DIRECTIVE:
Do NOT fabricate fake company names, fake personal phone numbers, fake email addresses, or fake verified purchase orders.
Provide real, authentic search strings, customs directory queries, association directories, trade portal filters, and qualification checklists.

Return JSON in this exact structure:
{
  "target_buyer_profile": "Clear definition of the ideal commercial buyer organization in this country",
  "recommended_discovery_channels": ["Trade database channel 1", "Customs portal/HS code search", "Industry Association directory", "B2B platform filters"],
  "search_strategy": "Step-by-step methodology for locating verified importing entities",
  "search_keywords": ["Specific Boolean trade query 1", "Google B2B keyword string 2", "Directory taxonomy query 3"],
  "qualification_checklist": ["Criteria 1 (import license)", "Criteria 2 (creditworthiness/bank L/C capability)", "Criteria 3 (warehousing/distribution reach)"],
  "outreach_protocol": "Recommended initial contact posture (e.g. intro via sample catalog vs formal RFQ response)"
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Buyer Discovery Error:', error);
    return sendError(res, 503, 'AI_DISCOVERY_FAILED', formatAiErrorMessage(error));
  }
});

app.post('/api/ai/health-check', rateLimiter(20, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { business, products, leads, quotations, orders } = req.body;

    const prompt = `
You are the Chief Operations & Commercial Risk Auditor for an enterprise B2B company.
Evaluate the health, velocity, and risks of this business operating system.

DATA SNAPSHOT:
- Business: ${business?.name} (${business?.business_type})
- Industry: ${business?.industry}
- Catalog: ${products?.length || 0} active products
- Pipeline: ${leads?.length || 0} active leads
- Proposals: ${quotations?.length || 0} quotations
- Fulfilled/In-flight Orders: ${orders?.length || 0} orders

INSTRUCTIONS:
Evaluate commercial bottlenecks, conversion friction, and supply chain readiness.
Return strictly valid JSON matching this schema:
{
  "overall_score": 82, // integer 0-100
  "health_rating": "Strong" | "Moderate" | "Needs Attention",
  "strengths": ["Clear commercial capability 1", "Strength 2"],
  "problems": ["Operational bottleneck 1", "Risk 2"],
  "missing_information": ["Missing metric 1", "Gap 2"],
  "opportunities": ["Growth vector 1", "Expansion 2"],
  "recommended_actions": [
    {
      "priority": "Critical" | "High" | "Medium",
      "action": "Concrete operational task",
      "expected_impact": "Commercial result"
    }
  ],
  "pipeline_efficiency_note": "Assessment of quote-to-cash velocity",
  "export_readiness_assessment": "Assessment of documentation, pricing transparency, and trade compliance"
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Health Check Error:', error);
    return sendError(res, 503, 'AI_HEALTH_FAILED', formatAiErrorMessage(error));
  }
});

app.post('/api/ai/followup', rateLimiter(40, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { quotation, lead, business, tone, previousInteractions } = req.body;

    const prompt = `
You are an expert Commercial B2B Follow-up Strategist.
Generate a structured follow-up sequence to revive or accelerate this commercial negotiation.

PROPOSAL & BUYER CONTEXT:
- Buyer: ${quotation?.buyer_name || lead?.name} (${quotation?.buyer_company || lead?.company})
- Proposal Number: ${quotation?.quote_number || 'Proforma Quote'}
- Value: ${quotation?.currency || 'USD'} ${quotation?.total_amount || 'Negotiable'}
- Current Status: ${quotation?.status || lead?.status || 'Pending Review'}
- Desired Tone: ${tone || 'Professional & Collaborative'}
- Context/Prior History: ${previousInteractions || 'Quote sent with specs'}

Return strictly JSON matching:
{
  "recommended_timing_days": 3,
  "followup_sequence": [
    {
      "sequence_number": 1,
      "title": "Follow-up #1: Spec Sheet & Compliance Review",
      "channel": "Email",
      "subject": "Subject line",
      "message": "Full personalized draft"
    },
    {
      "sequence_number": 2,
      "title": "Follow-up #2: Production Slot & Volume Discount Confirmation",
      "channel": "WhatsApp / Email",
      "subject": "Subject line",
      "message": "Full personalized draft"
    },
    {
      "sequence_number": 3,
      "title": "Follow-up #3: Commercial Order Finalization",
      "channel": "Email",
      "subject": "Subject line",
      "message": "Full personalized draft"
    }
  ]
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Followup Error:', error);
    return sendError(res, 503, 'AI_FOLLOWUP_FAILED', formatAiErrorMessage(error));
  }
});

// Follow-up route alias used by FollowUpsView
app.post('/api/ai/generate-follow-up', rateLimiter(40, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { leadName, company, productInterest, sequenceStep, channel, businessProfile } = req.body;

    const prompt = `
You are an expert commercial B2B follow-up strategist and copywriter for ${businessProfile?.name || 'an enterprise exporter'}.
Craft a personalized, high-conversion commercial follow-up message for:
- Prospect: ${leadName} at ${company}
- Product of Interest: ${productInterest}
- Follow-up Sequence Step: #${sequenceStep || 1}
- Delivery Channel: ${channel || 'Email'}

Provide a valid JSON response strictly matching this schema:
{
  "subject": "Compelling concise subject line",
  "draft": "Full email or chat message draft ready to send immediately"
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}', {
      subject: `Follow-up regarding ${productInterest}`,
      draft: `Dear ${leadName},\n\nFollowing up on our discussions regarding ${productInterest} for ${company}. Please let us know if you need updated technical specifications or tiered wholesale volume pricing.\n\nBest regards,\n${businessProfile?.name || 'Sales Operations'}`
    });

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Generate Follow-up Error:', error);
    return sendError(res, 503, 'AI_FOLLOWUP_FAILED', formatAiErrorMessage(error));
  }
});

app.post('/api/ai/chat', rateLimiter(40, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { message, history, context, businessId, conversationId } = req.body;
    if (!message) {
      return sendError(res, 400, 'INVALID_INPUT', 'Message is required');
    }

    const activeBizId = businessId || context?.business?.id;
    const authHeader = req.headers.authorization;
    const snapshot = await getRealBusinessSnapshot(authHeader, activeBizId);

    const productsCount = snapshot.products.length || context?.productsCount || 0;
    const leadsCount = snapshot.leads.length || context?.leadsCount || 0;
    const ordersCount = snapshot.orders.length || context?.ordersCount || 0;
    const quotesCount = snapshot.quotations.length || context?.quotesCount || 0;

    const productsSummary = snapshot.products.length > 0
      ? snapshot.products.slice(0, 10).map((p: any) => `- ${p.title} (${p.category || 'General'}, Price: ${p.currency || 'USD'} ${p.price}, Stock: ${p.stock_quantity ?? 'N/A'})`).join('\n')
      : (context?.sampleProducts || 'None registered in database yet');

    const leadsSummary = snapshot.leads.length > 0
      ? snapshot.leads.slice(0, 5).map((l: any) => `- ${l.company_name || l.contact_name} (Stage: ${l.stage}, Score: ${l.score ?? 50})`).join('\n')
      : 'None registered in database yet';

    const systemPrompt = `
You are NEXA AI Commercial Director & Revenue Operating Engine. Brand Tagline: "Build. Sell. Grow."
You help the business sell products globally, negotiate B2B contracts, qualify leads, draft proposals, and execute operations.

CRITICAL ACCURACY & INTEGRITY RULES:
1. NEVER fabricate fake business data, fake orders, fake revenue, or fake buyers.
2. If the user asks for information requiring records (e.g. "What are my best selling products?", "Which leads should I follow up with?", "Analyze my sales") and the database has 0 matching records, you MUST explicitly state:
"I need more business data to answer this accurately. Currently, your account has 0 recorded [products / orders / leads] in the NEXA database. Please add your catalog or record transactions so I can provide precise commercial intelligence."
3. NEVER claim guaranteed sales, guaranteed revenue, or guaranteed growth.
4. Human approval is strictly required before sending messages, sending quotations, placing orders, or altering financial records.

REAL DATABASE SNAPSHOT:
- Business Name: ${snapshot.business?.name || context?.business?.name || 'Your Enterprise'}
- Business Type: ${snapshot.business?.business_type || context?.business?.business_type || 'Commercial Enterprise'}
- Industry: ${snapshot.business?.industry || context?.business?.industry || 'Commerce'}
- Origin Country: ${snapshot.business?.country || context?.business?.country || 'Origin'}
- Total Registered Products: ${productsCount}
- Sample Products:\n${productsSummary}
- Total Active Leads: ${leadsCount}
- Sample Leads:\n${leadsSummary}
- Total Orders: ${ordersCount}
- Total Quotations: ${quotesCount}

INSTRUCTIONS:
- Give direct, authoritative, commercially sound advice.
- When drafting messages, quotes, or proposals, format them ready to review, edit, or copy.
- Structure output with clear markdown headings and bullets.
`;

    const chatContents = [];
    chatContents.push({ text: `System context: ${systemPrompt}` });

    if (Array.isArray(history)) {
      for (const h of history.slice(-8)) {
        chatContents.push({ text: `${h.sender === 'user' || h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}` });
      }
    }

    chatContents.push({ text: `User request: ${message}` });

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: chatContents.map((c) => c.text).join('\n\n'),
    });

    const reply = response.text || 'I have analyzed your query. How would you like to proceed?';

    // Persist conversation if authenticated with Supabase
    const supabase = getSupabaseServerClient(authHeader);
    if (supabase && activeBizId) {
      try {
        let activeConvId = conversationId;
        if (!activeConvId) {
          const { data: conv } = await supabase
            .from('ai_conversations')
            .insert({
              business_id: activeBizId,
              title: message.slice(0, 45),
            })
            .select('id')
            .single();
          if (conv) activeConvId = conv.id;
        }

        if (activeConvId) {
          await supabase.from('ai_messages').insert([
            { conversation_id: activeConvId, sender: 'user', content: message },
            { conversation_id: activeConvId, sender: 'assistant', content: reply },
          ]);
        }
      } catch (dbErr) {
        // Non-blocking persistence notice
        console.warn('AI conversation persistence notice:', dbErr);
      }
    }

    return res.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return sendError(res, 503, 'AI_CHAT_FAILED', formatAiErrorMessage(error));
  }
});

// AI Command Center: Executive prompt execution with Real Snapshot and Actions
app.post('/api/ai/command-center', rateLimiter(40, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { actionType, prompt, business, contextData, language = 'en' } = req.body;
    if (!prompt && !actionType) {
      return sendError(res, 400, 'INVALID_INPUT', 'Action or prompt is required');
    }

    const activeBizId = business?.id;
    const authHeader = req.headers.authorization;
    const snapshot = await getRealBusinessSnapshot(authHeader, activeBizId);

    const productsCount = snapshot.products.length || contextData?.productsCount || 0;
    const leadsCount = snapshot.leads.length || contextData?.leadsCount || 0;
    const ordersCount = snapshot.orders.length || contextData?.ordersCount || 0;
    const quotesCount = snapshot.quotations.length || contextData?.quotesCount || 0;

    const commandPrompt = `
You are NEXA, the executive AI Business & Commerce Platform operating system. Tagline: "Build. Sell. Grow."
You possess deep expertise in global trade, B2B wholesale, B2C retail, manufacturing supply chains, export compliance, RFQs, marketing, financial planning, and sales execution.

ACTION REQUIRED: ${actionType || 'custom_inquiry'}
USER PROMPT: ${prompt}
REQUESTED LANGUAGE: Respond in language code: ${language}

CRITICAL ACCURACY & INTEGRITY RULES:
1. NEVER invent fake business data, fake orders, fake revenue, or fake buyers.
2. If the user asks for information requiring records (e.g. "Show my low-stock products", "Find my highest-value leads", "Analyze today's sales", "What are my best selling products?") and the database has 0 records, you MUST explicitly state:
"I need more business data to answer this accurately. Currently, your account has 0 recorded [products / orders / leads] in the NEXA database. Please add your catalog or record transactions so I can provide precise commercial intelligence."
3. NEVER claim guaranteed sales, guaranteed revenue, or guaranteed growth.
4. Human approval is strictly required before sending messages, sending quotations, creating paid advertisements, placing orders, or processing payments.

REAL DATABASE SNAPSHOT:
- Company Name: ${snapshot.business?.name || business?.name || 'Authorized Enterprise'}
- Type: ${snapshot.business?.business_type || business?.business_type || 'Manufacturer & Exporter'}
- Industry: ${snapshot.business?.industry || business?.industry || 'Commerce'}
- Registered Products (${productsCount}): ${snapshot.products.map((p: any) => `${p.title} (Stock: ${p.stock_quantity ?? 'N/A'}, Price: ${p.price})`).join(', ') || 'No products registered yet'}
- Registered Leads (${leadsCount}): ${snapshot.leads.map((l: any) => `${l.company_name || l.contact_name} (Stage: ${l.stage}, Value: ${l.deal_value || 0})`).join(', ') || 'No leads registered yet'}
- Registered Orders (${ordersCount}): ${snapshot.orders.map((o: any) => `#${o.order_number || o.id.slice(0, 6)} (${o.status}, Amount: ${o.total_amount})`).join(', ') || 'No orders registered yet'}
- Registered Quotations (${quotesCount}): ${snapshot.quotations.map((q: any) => `#${q.quotation_number || q.id.slice(0, 6)} (${q.status}, Total: ${q.total_amount})`).join(', ') || 'No quotations registered yet'}

OPERATING MANDATES:
1. Provide practical, step-by-step actionable business execution.
2. Structure output cleanly with Markdown headings, bullet points, and highlight cards where relevant.
3. If drafting communication (email, WhatsApp, ad copy, RFQ response, quotation), make it immediately copy-pasteable.
4. Strictly adhere to the requested language.
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: commandPrompt,
    });

    const replyText = response.text || 'Action analyzed successfully.';

    // Generate contextual action recommendations
    const actions = [];
    const lowerPrompt = (prompt || '').toLowerCase();
    if (lowerPrompt.includes('lead') || lowerPrompt.includes('follow')) {
      actions.push({ id: 'act-leads', label: 'Review Leads', type: 'navigate', target: 'leads' });
      actions.push({ id: 'act-msg', label: 'Generate Message', type: 'action', action: 'draft_message' });
      actions.push({ id: 'act-followup', label: 'Schedule Follow-up', type: 'navigate', target: 'followups' });
    } else if (lowerPrompt.includes('product') || lowerPrompt.includes('stock')) {
      actions.push({ id: 'act-products', label: 'Review Catalog', type: 'navigate', target: 'products' });
      actions.push({ id: 'act-add-prod', label: 'Add Product', type: 'action', action: 'add_product' });
    } else if (lowerPrompt.includes('quotation') || lowerPrompt.includes('quote')) {
      actions.push({ id: 'act-quotes', label: 'Review Quotations', type: 'navigate', target: 'quotations' });
      actions.push({ id: 'act-create-quote', label: 'New Quotation', type: 'action', action: 'create_quotation' });
    } else {
      actions.push({ id: 'act-crm', label: 'Review CRM', type: 'navigate', target: 'leads' });
      actions.push({ id: 'act-catalog', label: 'Review Products', type: 'navigate', target: 'products' });
    }

    return res.json({
      success: true,
      result: replyText,
      actions,
    });
  } catch (error: any) {
    console.error('AI Command Center Error:', error);
    return sendError(res, 503, 'AI_COMMAND_FAILED', formatAiErrorMessage(error));
  }
});

// ----------------------------------------------------------------------
// Dedicated Real AI Endpoints
// ----------------------------------------------------------------------

// 1. /api/ai/business-analysis
app.post('/api/ai/business-analysis', rateLimiter(30, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { businessId, timeframe = 'current' } = req.body;
    const authHeader = req.headers.authorization;
    const snapshot = await getRealBusinessSnapshot(authHeader, businessId);

    const hasData = snapshot.products.length > 0 || snapshot.orders.length > 0 || snapshot.leads.length > 0;
    if (!hasData) {
      return res.json({
        success: true,
        insufficient_data: true,
        data: {
          summary: 'I need more business data to answer this accurately.',
          explanation: 'Currently, your account has 0 recorded products, orders, or leads in the NEXA database. Please add your catalog or record transactions so I can compute actionable commercial analysis.',
          recommendations: [
            'Add at least 3 products with wholesale pricing and stock levels.',
            'Import or add qualified buyer leads to your CRM.',
            'Create binding B2B quotations to track conversion velocity.',
          ],
        },
      });
    }

    const prompt = `
You are the NEXA Business Intelligence Engine. Analyze the following REAL business records for: ${snapshot.business?.name || 'Authorized Business'}.
Products registered: ${snapshot.products.length}
Orders registered: ${snapshot.orders.length}
Leads registered: ${snapshot.leads.length}
Quotations registered: ${snapshot.quotations.length}

Provide a realistic, data-grounded commercial SWOT, operational bottleneck diagnosis, and next revenue priorities.
Never invent fake revenue or promise guaranteed sales.
Respond in valid JSON format:
{
  "summary": "High-level diagnostic summary",
  "strengths": ["list"],
  "weaknesses": ["list"],
  "revenue_priorities": ["list"],
  "recommended_actions": [
    {"action": "Action title", "priority": "High|Medium", "impact": "Commercial rationale"}
  ]
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, insufficient_data: false, data: parsed });
  } catch (error: any) {
    console.error('AI Business Analysis Error:', error);
    return sendError(res, 503, 'AI_ANALYSIS_FAILED', formatAiErrorMessage(error));
  }
});

// 2. /api/ai/product-content
app.post('/api/ai/product-content', rateLimiter(40, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { productTitle, description, category, price, currency, targetCountry, contentType = 'all' } = req.body;

    const prompt = `
You are the NEXA Autonomous Product Merchandising Engine.
Generate optimized commercial B2B/B2C catalog content based on this REAL product:
- Product Title: ${productTitle || 'Commercial Product'}
- Existing Description: ${description || 'N/A'}
- Category: ${category || 'General Merchandise'}
- Price: ${currency || 'USD'} ${price || 'Inquire'}
- Target Country: ${targetCountry || 'Global'}
- Requested Content Type: ${contentType}

Respond in valid JSON format:
{
  "title": "Optimized high-converting product title",
  "description": "Comprehensive multi-paragraph product description with features and specifications",
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tags": ["tag1", "tag2", "tag3"],
  "specifications": [
    {"label": "Material / Composition", "value": "..."},
    {"label": "Standard Compliance", "value": "..."},
    {"label": "Packaging & Export Unit", "value": "..."}
  ],
  "buyer_pitch": "Concise 3-sentence sales pitch targeting wholesale procurement managers"
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Product Content Error:', error);
    return sendError(res, 503, 'AI_PRODUCT_CONTENT_FAILED', formatAiErrorMessage(error));
  }
});

// 3. /api/ai/sales-message
app.post('/api/ai/sales-message', rateLimiter(40, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { businessName, productTitle, buyerCountry, buyerType, productDetails, channel = 'Email' } = req.body;

    const prompt = `
You are an expert international sales negotiator for ${businessName || 'an enterprise exporter'}.
Write a high-converting, professional B2B outreach message for:
- Product: ${productTitle}
- Buyer Type: ${buyerType || 'Wholesale Distributor'}
- Destination Country: ${buyerCountry || 'International'}
- Product Details: ${productDetails || 'Factory direct specifications'}
- Delivery Channel: ${channel}

Provide a valid JSON response strictly matching this schema:
{
  "subject": "Clear, compelling B2B subject line",
  "message": "Full message text ready to send immediately with placeholders clearly marked if any",
  "call_to_action": "Clear next step (e.g. Schedule a 10-minute technical review, Request sample kit)",
  "compliance_notes": "Key trade considerations for this destination market"
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Sales Message Error:', error);
    return sendError(res, 503, 'AI_SALES_MESSAGE_FAILED', formatAiErrorMessage(error));
  }
});

// 4. /api/ai/lead-analysis
app.post('/api/ai/lead-analysis', rateLimiter(40, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { lead, businessProfile } = req.body;
    if (!lead) return sendError(res, 400, 'INVALID_INPUT', 'Lead data is required');

    const prompt = `
You are the NEXA CRM Intelligence Engine. Evaluate this commercial lead:
- Company: ${lead.company_name || 'Prospect'}
- Contact: ${lead.contact_name || 'Procurement Officer'}
- Country: ${lead.country || 'Global'}
- Stage: ${lead.stage || 'NEW'}
- Estimated Deal Value: ${lead.deal_value || 'Undisclosed'}
- Notes / Requirements: ${lead.notes || 'Inquired about product availability'}
- Seller Enterprise: ${businessProfile?.name || 'Authorized Seller'}

Provide a rigorous commercial qualification analysis:
Respond in valid JSON format:
{
  "score": 75,
  "fit_tier": "HIGH|MEDIUM|LOW",
  "qualification_summary": "Detailed summary of purchase intent and feasibility",
  "risk_factors": ["risk1", "risk2"],
  "recommended_actions": [
    {"label": "Review Lead Details", "type": "review"},
    {"label": "Generate Custom Proposal", "type": "draft"},
    {"label": "Schedule Technical Qualification", "type": "schedule"}
  ]
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Lead Analysis Error:', error);
    return sendError(res, 503, 'AI_LEAD_ANALYSIS_FAILED', formatAiErrorMessage(error));
  }
});

// 5. /api/ai/buyer-matching
app.post('/api/ai/buyer-matching', rateLimiter(30, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { businessId, productId } = req.body;
    const authHeader = req.headers.authorization;
    const snapshot = await getRealBusinessSnapshot(authHeader, businessId);

    // If zero RFQs in database
    if (snapshot.rfqs.length === 0) {
      return res.json({
        success: true,
        matches: [],
        message: 'No real buyer records available yet. Once international procurement managers submit RFQs matching your product categories, verified matches will appear here.',
      });
    }

    const selectedProduct = snapshot.products.find((p: any) => p.id === productId) || snapshot.products[0];
    const prompt = `
Match this seller product against REAL open buyer RFQs in the database:
SELLER PRODUCT:
- Title: ${selectedProduct?.title || 'Catalog item'}
- Category: ${selectedProduct?.category || 'General'}
- Price: ${selectedProduct?.price || 'Negotiable'}

AVAILABLE BUYER RFQS (${snapshot.rfqs.length}):
${JSON.stringify(snapshot.rfqs.slice(0, 15))}

Provide a valid JSON response with matched buyers:
{
  "matches": [
    {
      "rfq_id": "UUID",
      "buyer_requirement": "Summary of what buyer needs",
      "match_confidence": 85,
      "match_reason": "Specific category and technical spec alignment",
      "suggested_action": "Recommended response strategy"
    }
  ]
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(response.text || '{}', { matches: [] });
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('AI Buyer Matching Error:', error);
    return sendError(res, 503, 'AI_BUYER_MATCHING_FAILED', formatAiErrorMessage(error));
  }
});

// 6. /api/ai/quotation
app.post('/api/ai/quotation', rateLimiter(40, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { buyerName, buyerCompany, buyerCountry, items, currency = 'USD', incoterm = 'FOB', paymentTerms = '30% T/T Advance, 70% against B/L', businessProfile } = req.body;

    const prompt = `
You are the NEXA Commercial Quotation & Contract Engine.
Generate a structured, professional B2B export quotation draft:
- Buyer: ${buyerName} at ${buyerCompany} (${buyerCountry || 'International'})
- Seller: ${businessProfile?.name || 'Authorized Exporter'} (${businessProfile?.country || 'Export Origin'})
- Line Items: ${JSON.stringify(items || [])}
- Currency: ${currency}
- Incoterm: ${incoterm}
- Payment Terms: ${paymentTerms}

Respond in valid JSON format:
{
  "quotation_notes": "Official commercial notes and warranties",
  "terms_and_conditions": [
    "Prices are quoted under Incoterms 2020 (${incoterm})",
    "Quotation validity: 30 calendar days from issue date",
    "Payment terms: ${paymentTerms}",
    "Inspection: Pre-shipment inspection certificate issued by SGS/TUV upon request"
  ],
  "lead_time_weeks": 3,
  "shipping_recommendations": "Recommended freight type and container specifications",
  "executive_cover_letter": "Professional cover message to accompany the quotation document"
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Quotation Draft Error:', error);
    return sendError(res, 503, 'AI_QUOTATION_FAILED', formatAiErrorMessage(error));
  }
});

// 7. /api/ai/follow-up
app.post('/api/ai/follow-up', rateLimiter(40, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { leadName, company, productInterest, sequenceStep = 1, channel = 'Email', businessProfile } = req.body;

    const prompt = `
You are an expert commercial B2B follow-up strategist for ${businessProfile?.name || 'an enterprise exporter'}.
Craft a personalized, high-conversion commercial follow-up message for:
- Prospect: ${leadName || 'Procurement Lead'} at ${company || 'Enterprise'}
- Product of Interest: ${productInterest || 'Catalog Products'}
- Follow-up Sequence Step: #${sequenceStep}
- Delivery Channel: ${channel}

Provide a valid JSON response strictly matching this schema:
{
  "subject": "Compelling concise subject line",
  "draft": "Full email or chat message draft ready to send immediately",
  "recommended_timing": "Best send day and time for this recipient timezone"
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Follow-up Error:', error);
    return sendError(res, 503, 'AI_FOLLOWUP_FAILED', formatAiErrorMessage(error));
  }
});

// 8. /api/ai/marketing
app.post('/api/ai/marketing', rateLimiter(30, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { campaignGoal, targetAudience, products, businessProfile, channels = ['LinkedIn', 'Google Search', 'Email Newsletter'] } = req.body;

    const prompt = `
You are the NEXA Autonomous Growth & Marketing Engine.
Create high-conversion campaign copy and marketing strategy for:
- Company: ${businessProfile?.name || 'NEXA Commercial Partner'}
- Campaign Goal: ${campaignGoal || 'Drive wholesale inquiries and catalog requests'}
- Target Audience: ${targetAudience || 'B2B Procurement Directors and Importers'}
- Featured Products: ${products || 'Flagship manufactured goods'}

Respond in valid JSON format:
{
  "campaign_name": "Strategic Campaign Title",
  "value_proposition": "Core differentiated trade message",
  "ad_variants": [
    {
      "channel": "LinkedIn / B2B Display",
      "headline": "Punchy headline under 50 characters",
      "primary_text": "Engaging hook addressing margin, reliability, and MOQ",
      "call_to_action": "Request Factory Quote"
    },
    {
      "channel": "Google Search Ad",
      "headline": "Direct Manufacturer Supply | Wholesale Pricing",
      "primary_text": "Certified export manufacturer. Fast dispatch & customized OEM packaging.",
      "call_to_action": "View Catalog"
    }
  ],
  "email_campaign": {
    "subject": "Direct Manufacturer Pricing & Spec Sheet",
    "preview_text": "Tiered volume discounts available for upcoming procurement cycle",
    "body_content": "Clean email copy highlighting product certifications, minimum order quantities, and contact instructions."
  }
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Marketing Error:', error);
    return sendError(res, 503, 'AI_MARKETING_FAILED', formatAiErrorMessage(error));
  }
});

// 9. /api/ai/translation
app.post('/api/ai/translation', rateLimiter(50, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { text, targetLanguage, sourceLanguage = 'auto', domain = 'commercial_trade' } = req.body;
    if (!text || !targetLanguage) {
      return sendError(res, 400, 'INVALID_INPUT', 'Text and targetLanguage are required');
    }

    const prompt = `
Translate the following text into ${targetLanguage} with professional precision in the domain of ${domain} (preserving trade terms like Incoterms, HS Codes, MOQs, specifications, and business tone):

SOURCE TEXT:
${text}

Respond in valid JSON format:
{
  "translated_text": "Accurate, culturally attuned translation",
  "target_language": "${targetLanguage}",
  "terminology_notes": "Any important customs or commercial term clarifications if applicable"
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(response.text || '{}', {
      translated_text: text,
      target_language: targetLanguage,
    });
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Translation Error:', error);
    return sendError(res, 503, 'AI_TRANSLATION_FAILED', formatAiErrorMessage(error));
  }
});

// AI Storefront / Website Generator
app.post('/api/ai/website-builder', rateLimiter(20, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { businessName, industry, products, targetAudience, themeTone } = req.body;

    const sitePrompt = `
Generate a complete, high-converting digital storefront website structure and marketing copy for this business.

BUSINESS DETAILS:
- Name: ${businessName || 'Global Enterprise'}
- Industry: ${industry || 'Manufacturing & Export'}
- Key Products: ${products || 'Custom manufactured goods'}
- Target Audience: ${targetAudience || 'International importers, contractors, and retail buyers'}
- Tone: ${themeTone || 'Modern, trustworthy, professional'}

Provide a valid JSON response strictly matching this structure:
{
  "site_title": "Short brand title",
  "tagline": "Compelling value proposition tagline",
  "meta_description": "SEO meta description under 160 characters",
  "sections": [
    {
      "id": "hero_1",
      "type": "hero",
      "title": "Main Hero Headline",
      "subtitle": "Clear supporting subheadline explaining unique trade advantage",
      "button_text": "Explore Catalog & Request Quote",
      "is_visible": true,
      "order_index": 0
    },
    {
      "id": "about_1",
      "type": "about",
      "title": "About Our Manufacturing & Quality Standards",
      "content": "Professional summary of production capacity, testing, and global export heritage",
      "is_visible": true,
      "order_index": 1
    },
    {
      "id": "rfq_1",
      "type": "rfq_banner",
      "title": "Direct Factory Quotations & Custom Orders",
      "subtitle": "Get factory-direct wholesale pricing within 24 hours",
      "button_text": "Submit Buying Requirement",
      "is_visible": true,
      "order_index": 2
    },
    {
      "id": "faq_1",
      "type": "faq",
      "title": "Frequently Asked Questions",
      "items": [
        {
          "title": "What is your typical MOQ and lead time?",
          "description": "Clear answer regarding minimum order quantities and shipping timelines"
        },
        {
          "title": "What international shipping and payment terms do you support?",
          "description": "FOB, CIF, Letter of Credit, and secure commercial wire terms"
        }
      ],
      "is_visible": true,
      "order_index": 3
    }
  ]
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: sitePrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Website Builder Error:', error);
    return sendError(res, 503, 'AI_WEBSITE_FAILED', formatAiErrorMessage(error));
  }
});

// AI Advertising Copy Generator
app.post('/api/ai/ad-copy', rateLimiter(30, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return sendAiNotConfiguredError(res);

    const { campaignType, productName, targetMarket, targetAudience } = req.body;

    const adPrompt = `
Generate high-converting, professional B2B/B2C advertising copy for the NEXA network.

CAMPAIGN TYPE: ${campaignType || 'Sponsored Product'}
PRODUCT: ${productName || 'Premium B2B Product'}
TARGET MARKET: ${targetMarket || 'Global'}
TARGET AUDIENCE: ${targetAudience || 'Wholesale Buyers & Procurement Managers'}

Provide a valid JSON response strictly matching this structure:
{
  "headlines": [
    "Headline option 1",
    "Headline option 2",
    "Headline option 3"
  ],
  "ad_copy": "Engaging primary advertising body text highlighting key benefits, certifications, and commercial reliability.",
  "call_to_action": "Request Factory Quote",
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4"]
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: adPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('AI Ad Copy Error:', error);
    return sendError(res, 503, 'AI_AD_COPY_FAILED', formatAiErrorMessage(error));
  }
});

// AI Creative Studio: Generates media assets or returns graceful configuration status
app.post('/api/ai/creative-studio', rateLimiter(20, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        success: false,
        configured: false,
        message: 'AI image generation is not configured.',
      });
    }

    const { creativeType, prompt, businessName, category, targetDimensions } = req.body;
    if (!prompt) {
      return sendError(res, 400, 'INVALID_INPUT', 'Creative prompt is required');
    }

    try {
      const imgResponse = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `Commercial marketing asset for ${businessName || 'NEXA Global Commerce'}. Type: ${creativeType || 'marketplace-banner'}. Category: ${category || 'Commerce'}. Details: ${prompt}. Clean, award-winning studio lighting, 8k resolution, photorealistic.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: targetDimensions === 'square' ? '1:1' : targetDimensions === 'portrait' ? '3:4' : '16:9',
        },
      });

      const base64Img = imgResponse.generatedImages?.[0]?.image?.imageBytes;
      if (base64Img) {
        const publicUrl = `data:image/jpeg;base64,${base64Img}`;
        return res.json({
          success: true,
          configured: true,
          data: {
            imageUrl: publicUrl,
            prompt,
            creativeType,
            metadata: {
              model: 'imagen-3.0-generate-002',
              timestamp: new Date().toISOString(),
              aspectRatio: targetDimensions || '16:9',
            },
          },
        });
      }
    } catch (imgErr: any) {
      console.warn('Imagen provider notice:', imgErr?.message);
    }

    return res.status(200).json({
      success: false,
      configured: false,
      message: 'AI image generation is not configured.',
    });
  } catch (error: any) {
    console.error('AI Creative Studio Error:', error);
    return sendError(res, 500, 'CREATIVE_STUDIO_FAILED', error?.message || 'Error processing creative request');
  }
});

// AI Natural Language Marketplace Search Engine
app.post('/api/ai/search-query', rateLimiter(40, 60), async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return sendError(res, 400, 'INVALID_INPUT', 'Search query string is required');
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: true,
        source: 'heuristic',
        intent: {
          original_query: query,
          product_type: query,
          currency: 'USD',
        },
      });
    }

    const searchPrompt = `
You are the AI Search Query Parser for VYRA — Global B2B + B2C Marketplace.
Deconstruct the user's natural language sourcing request into structured commerce search parameters.
USER QUERY: "${query}"

Respond with ONLY a valid JSON object matching:
{
  "product_type": "string or null",
  "quantity": null,
  "unit": "string or null",
  "max_budget": null,
  "currency": "USD",
  "target_country": "string or null",
  "material": "string or null",
  "category": "string or null",
  "verified_only": false
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: searchPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}', {
      product_type: query,
      currency: 'USD',
      verified_only: false,
    });

    return res.json({
      success: true,
      source: 'gemini',
      intent: {
        original_query: query,
        ...parsed,
      },
    });
  } catch (error: any) {
    console.error('AI Search Query Error:', error);
    return res.json({
      success: true,
      source: 'fallback',
      intent: {
        original_query: req.body?.query || '',
        product_type: req.body?.query || '',
      },
    });
  }
});

// ----------------------------------------------------------------------
// 10. VYRA LOGISTICS & SHIPPING API (Section 49)
// ----------------------------------------------------------------------

// 1. Calculate Multi-Carrier Shipping Rates
app.post('/api/logistics/calculate-rates', rateLimiter(60, 60), (req: Request, res: Response) => {
  try {
    const {
      originCountry = 'US',
      destCountry = 'US',
      weightKg = 5,
      lengthCm = 30,
      widthCm = 20,
      heightCm = 15,
      isInsured = false,
      isDangerousGoods = false,
    } = req.body;

    const cubicCm = Math.max(1, Number(lengthCm) * Number(widthCm) * Number(heightCm));
    const volumetricWeightKg = Number((cubicCm / 5000).toFixed(2));
    const chargeableWeightKg = Math.max(Number(weightKg), volumetricWeightKg);
    const isDomestic = String(originCountry).toUpperCase() === String(destCountry).toUpperCase();
    const multiplier = isDomestic ? 1.0 : 2.4;
    const dangerousGoodsFee = isDangerousGoods ? 85 : 0;
    const insuranceFee = isInsured ? Math.max(15, chargeableWeightKg * 1.5) : 0;

    const quotes = [
      {
        carrier_id: 'carrier-dhl',
        carrier_name: 'DHL Express Worldwide',
        service_level: 'Air Express Priority',
        mode: 'Express Shipping',
        estimated_days: isDomestic ? 1 : 2,
        chargeable_weight_kg: chargeableWeightKg,
        volumetric_weight_kg: volumetricWeightKg,
        base_rate: Number((chargeableWeightKg * 12.5 * multiplier).toFixed(2)),
        fuel_surcharge: Number((chargeableWeightKg * 1.5 * multiplier).toFixed(2)),
        handling_fee: 15 + dangerousGoodsFee,
        insurance_fee: insuranceFee,
        total_cost: Number((chargeableWeightKg * 14.0 * multiplier + 15 + dangerousGoodsFee + insuranceFee).toFixed(2)),
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
        base_rate: Number((chargeableWeightKg * 8.8 * multiplier).toFixed(2)),
        fuel_surcharge: Number((chargeableWeightKg * 1.1 * multiplier).toFixed(2)),
        handling_fee: 10 + dangerousGoodsFee,
        insurance_fee: insuranceFee,
        total_cost: Number((chargeableWeightKg * 9.9 * multiplier + 10 + dangerousGoodsFee + insuranceFee).toFixed(2)),
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
        base_rate: Number((chargeableWeightKg * 6.2 * multiplier).toFixed(2)),
        fuel_surcharge: Number((chargeableWeightKg * 0.8 * multiplier).toFixed(2)),
        handling_fee: 8 + dangerousGoodsFee,
        insurance_fee: insuranceFee,
        total_cost: Number((chargeableWeightKg * 7.0 * multiplier + 8 + dangerousGoodsFee + insuranceFee).toFixed(2)),
        currency: 'USD',
        is_cheapest: true,
      },
    ];

    if (chargeableWeightKg >= 25) {
      quotes.push({
        carrier_id: 'carrier-maersk',
        carrier_name: 'Maersk Ocean Consolidated (LCL/FCL)',
        service_level: 'Port-to-Port / Door-to-Door Ocean Line',
        mode: 'Sea Freight (LCL)',
        estimated_days: isDomestic ? 7 : 18,
        chargeable_weight_kg: chargeableWeightKg,
        volumetric_weight_kg: volumetricWeightKg,
        base_rate: Number((Math.max(120, chargeableWeightKg * 1.8 * multiplier)).toFixed(2)),
        fuel_surcharge: Number((chargeableWeightKg * 0.25).toFixed(2)),
        handling_fee: 65,
        insurance_fee: insuranceFee,
        total_cost: Number((Math.max(120, chargeableWeightKg * 1.8 * multiplier) + chargeableWeightKg * 0.25 + 65 + insuranceFee).toFixed(2)),
        currency: 'USD',
        is_cheapest: false,
      });
    }

    return res.json({
      success: true,
      params: { originCountry, destCountry, weightKg, chargeableWeightKg, volumetricWeightKg },
      quotes,
    });
  } catch (error: any) {
    console.error('Shipping Rate Calculation Error:', error);
    return sendError(res, 500, 'CALCULATION_ERROR', 'Failed to calculate shipping quotes');
  }
});

// 2. AI Customs Duty & HS Code Classification Engine
app.post('/api/logistics/customs-declaration', rateLimiter(40, 60), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    const { productDescription, originCountry, destinationCountry, declaredValue = 1000, currency = 'USD' } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        source: 'static',
        declaration: {
          hs_code: '8471.30.01',
          tariff_category: 'General Industrial & Commercial Goods',
          estimated_duty_rate_percent: 4.5,
          estimated_vat_gst_rate_percent: 19.0,
          estimated_duty_amount: Number((declaredValue * 0.045).toFixed(2)),
          estimated_vat_amount: Number((declaredValue * 1.045 * 0.19).toFixed(2)),
          import_restrictions: ['Commercial Invoice Required', 'Country of Origin Declaration Required'],
          certifications_needed: ['CE Mark / FCC Declaration of Conformity'],
          currency,
        },
      });
    }

    const prompt = `
You are the VYRA International Trade & Customs Compliance Engine.
Given this export consignment:
- Product: ${productDescription}
- Origin: ${originCountry}
- Destination: ${destinationCountry}
- Declared Value: ${declaredValue} ${currency}

Provide a verified HS Code classification and customs duty estimate strictly in JSON format:
{
  "hs_code": "6-digit or 8-digit international Harmonized System code",
  "tariff_category": "Official WCO nomenclature category",
  "estimated_duty_rate_percent": number,
  "estimated_vat_gst_rate_percent": number,
  "estimated_duty_amount": number,
  "estimated_vat_amount": number,
  "import_restrictions": ["List of export/import control caveats"],
  "certifications_needed": ["Required trade certificates e.g. COO, RoHS, FDA, etc."],
  "compliance_notes": "Key customs clearance advice for the freight forwarder",
  "currency": "${currency}"
}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(response.text || '{}', {
      hs_code: '8471.30.00',
      tariff_category: 'Commercial Merchandise',
      estimated_duty_rate_percent: 5.0,
      currency,
    });

    return res.json({
      success: true,
      source: 'gemini',
      declaration: parsed,
    });
  } catch (error: any) {
    console.error('Customs AI Error:', error);
    return res.json({
      success: true,
      source: 'fallback',
      declaration: {
        hs_code: '8471.30.00',
        tariff_category: 'General Commercial Goods',
        estimated_duty_rate_percent: 4.0,
        estimated_vat_gst_rate_percent: 15.0,
        estimated_duty_amount: 40,
        estimated_vat_amount: 156,
        currency: req.body?.currency || 'USD',
        compliance_notes: 'Standard WTO most-favoured-nation tariff schedule applied.',
      },
    });
  }
});

// ----------------------------------------------------------------------
// 11. VITE & STATIC SPA SERVING
// ----------------------------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VYRA Server running on port ${PORT}`);
  });
}

start();
