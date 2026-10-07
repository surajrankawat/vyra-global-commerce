import { getSupabaseServerClient } from './supabaseServer';

export interface RawQuotationItem {
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface CalculatedQuotation {
  items: Array<RawQuotationItem & { total_price: number }>;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  tax_amount: number;
  total_amount: number;
}

/**
 * Recalculates all pricing math server-side to guarantee integrity
 */
export function calculateQuotationTotals(
  items: RawQuotationItem[],
  discountAmount: number = 0,
  shippingFee: number = 0,
  taxRatePercent: number = 0
): CalculatedQuotation {
  let subtotal = 0;

  const processedItems = items.map((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unit_price) || 0);
    const lineTotal = Math.round(qty * price * 100) / 100;
    subtotal += lineTotal;
    return {
      product_id: item.product_id,
      description: item.description.trim(),
      quantity: qty,
      unit_price: price,
      total_price: lineTotal,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  const safeDiscount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  const safeShipping = Math.max(0, Number(shippingFee) || 0);

  const taxableBase = Math.max(0, subtotal - safeDiscount);
  const taxAmount = Math.round((taxableBase * (Math.max(0, Number(taxRatePercent) || 0) / 100)) * 100) / 100;

  const totalAmount = Math.round((subtotal - safeDiscount + safeShipping + taxAmount) * 100) / 100;

  return {
    items: processedItems,
    subtotal,
    discount_amount: safeDiscount,
    shipping_fee: safeShipping,
    tax_amount: taxAmount,
    total_amount: totalAmount,
  };
}

/**
 * Generates sequential quotation numbers like NEXA-2026-000001
 */
export async function generateSequentialQuotationNumber(businessId: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `NEXA-${currentYear}-`;

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomSuffix}`;
  }

  try {
    const { count, error } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    const nextSeq = (count || 0) + 1;
    const padded = nextSeq.toString().padStart(6, '0');
    return `${prefix}${padded}`;
  } catch {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomSuffix}`;
  }
}

/**
 * Generates sequential invoice numbers like INV-2026-000001
 */
export async function generateSequentialInvoiceNumber(businessId: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomSuffix}`;
  }

  try {
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    const nextSeq = (count || 0) + 1;
    const padded = nextSeq.toString().padStart(6, '0');
    return `${prefix}${padded}`;
  } catch {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomSuffix}`;
  }
}
