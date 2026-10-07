import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchBusinessQuotations, createQuotation, updateQuotation, fetchBusinessProducts, fetchBusinessLeads, createOrder } from '../lib/db';
import { Quotation, QuotationItem, Product, Lead, QuotationStatus } from '../types';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Send,
  X,
  Building2,
  ShieldCheck,
  Search,
  ShoppingBag,
} from 'lucide-react';

interface QuotationsViewProps {
  initialLead?: Lead | null;
  onScheduleFollowUp?: (quotation: Quotation) => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({ initialLead, onScheduleFollowUp }) => {
  const { currentBusiness } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<Quotation | null>(null);

  // Form Fields
  const [quoteNumber, setQuoteNumber] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerCountry, setBuyerCountry] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentTerms, setPaymentTerms] = useState('30% T/T Advance, 70% against B/L copy');
  const [deliveryTerms, setDeliveryTerms] = useState('CIF Destination Port (Incoterms 2020)');
  const [validityDays, setValidityDays] = useState(30);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [notes, setNotes] = useState('Packaging in seaworthy fumigated timber crates. Transit insurance covered.');

  const [items, setItems] = useState<Array<{ productId?: string; description: string; quantity: number; unitPrice: number }>>([
    { description: 'Natural Stone / Marble Slabs', quantity: 1, unitPrice: 150 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setCurrency(currentBusiness.currency || 'USD');
    Promise.all([
      fetchBusinessQuotations(currentBusiness.id),
      fetchBusinessProducts(currentBusiness.id),
      fetchBusinessLeads(currentBusiness.id),
    ])
      .then(([q, p, l]) => {
        setQuotations(q);
        setProducts(p);
        setLeads(l);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentBusiness]);

  useEffect(() => {
    if (initialLead) {
      openCreateModalWithLead(initialLead);
    }
  }, [initialLead]);

  const openCreateModalWithLead = (lead?: Lead) => {
    setFormError(null);
    const nextNum = `Q-${new Date().getFullYear()}-${String(quotations.length + 1).padStart(3, '0')}`;
    setQuoteNumber(nextNum);
    setBuyerName(lead?.name || '');
    setBuyerCompany(lead?.company || '');
    setBuyerCountry(lead?.country || '');
    setBuyerEmail(lead?.email || '');
    setBuyerPhone(lead?.phone || '');
    setDiscountAmount(0);
    setShippingFee(0);
    setTaxAmount(0);

    if (products.length > 0) {
      setItems([
        {
          productId: products[0].id,
          description: products[0].name,
          quantity: products[0].moq || 1,
          unitPrice: products[0].price,
        },
      ]);
    } else {
      setItems([{ description: lead?.product_interest || 'Commercial Goods', quantity: 1, unitPrice: 1000 }]);
    }

    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const found = products.find((p) => p.id === prodId);
    if (!found) return;
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        productId: found.id,
        description: found.name,
        quantity: found.moq || 1,
        unitPrice: found.price,
      };
      return copy;
    });
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const totalAmount = Math.max(0, subtotal - Number(discountAmount) + Number(shippingFee) + Number(taxAmount));

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!currentBusiness) return;
    if (!quoteNumber.trim() || !buyerName.trim()) {
      setFormError('Quotation number and Buyer name are required.');
      return;
    }

    setLoading(true);
    try {
      const validityDate = new Date(Date.now() + validityDays * 86400000).toISOString().split('T')[0];
      const created = await createQuotation({
        business_id: currentBusiness.id,
        quote_number: quoteNumber.trim(),
        seller_details: {
          name: currentBusiness.name,
          owner_name: currentBusiness.owner_name,
          email: currentBusiness.email,
          phone: currentBusiness.phone,
          whatsapp: currentBusiness.whatsapp,
          address: `${currentBusiness.city || ''}, ${currentBusiness.state || ''}, ${currentBusiness.country}`,
          gst_number: currentBusiness.gst_number,
          iec_code: currentBusiness.iec_code,
        },
        buyer_name: buyerName.trim(),
        buyer_company: buyerCompany.trim() || undefined,
        buyer_country: buyerCountry.trim() || undefined,
        buyer_email: buyerEmail.trim() || undefined,
        buyer_phone: buyerPhone.trim() || undefined,
        currency,
        items: items.map((item) => ({
          id: Math.random().toString(36).substring(2, 9),
          product_id: item.productId,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          unit_price: Number(item.unitPrice),
          total_price: Number(item.quantity) * Number(item.unitPrice),
        })),
        subtotal,
        discount_amount: Number(discountAmount) || 0,
        shipping_fee: Number(shippingFee) || 0,
        tax_amount: Number(taxAmount) || 0,
        total_amount: totalAmount,
        payment_terms: paymentTerms,
        delivery_terms: deliveryTerms,
        validity_date: validityDate,
        status: 'Sent',
        notes,
      });

      const updatedQuotes = await fetchBusinessQuotations(currentBusiness.id);
      setQuotations(updatedQuotes);
      setIsModalOpen(false);
      setPreviewQuote(created);
      setBannerNotice({ type: 'success', text: `Quotation ${created.quote_number} generated successfully!` });
      setTimeout(() => setBannerNotice(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (quote: Quotation, newStatus: QuotationStatus) => {
    try {
      await updateQuotation(quote.id, { status: newStatus });
      setQuotations((prev) => prev.map((q) => (q.id === quote.id ? { ...q, status: newStatus } : q)));
      if (previewQuote && previewQuote.id === quote.id) {
        setPreviewQuote({ ...previewQuote, status: newStatus });
      }
    } catch (err) {
      console.error('Status change error:', err);
    }
  };

  const handleConvertToOrder = async (quote: Quotation) => {
    if (!currentBusiness) return;
    try {
      const orderNum = `ORD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      await createOrder({
        business_id: currentBusiness.id,
        quotation_id: quote.id,
        order_number: orderNum,
        buyer_name: quote.buyer_name,
        buyer_company: quote.buyer_company,
        total_amount: quote.total_amount,
        currency: quote.currency,
        status: 'Order Confirmed',
        payment_status: 'Advance Paid',
        production_notes: `Created from accepted quotation ${quote.quote_number}. Items: ${quote.items?.length || 1} product lines.`,
      });

      // Update quote status to Accepted
      await updateQuotation(quote.id, { status: 'Accepted' });
      setQuotations((prev) =>
        prev.map((q) => (q.id === quote.id ? { ...q, status: 'Accepted' } : q))
      );

      setBannerNotice({ type: 'success', text: `Quotation ${quote.quote_number} successfully converted to Commercial Order ${orderNum}! View it in the Orders section.` });
      setTimeout(() => setBannerNotice(null), 6000);
    } catch (err: any) {
      setBannerNotice({ type: 'error', text: `Failed to convert quotation to order: ${err.message}` });
      setTimeout(() => setBannerNotice(null), 6000);
    }
  };

  return (
    <div id="quotations-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Formal Quotations & Proforma Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate compliant B2B export proposals with custom taxes, shipping freight, Incoterms, and payment milestones.
          </p>
        </div>
        <button
          id="btn-new-quote"
          type="button"
          onClick={() => openCreateModalWithLead()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Create Quotation
        </button>
      </div>

      {bannerNotice && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          bannerNotice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {bannerNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{bannerNotice.text}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="ml-3 text-slate-500 hover:text-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quotations List */}
      {quotations.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No Quotations Issued Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Build your first proforma quotation to send to prospective buyers or convert from your leads.
          </p>
          <button
            type="button"
            onClick={() => openCreateModalWithLead()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
          >
            Create First Quotation
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">Quote #</th>
                <th className="px-4 py-3">Buyer & Company</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.map((q) => (
                <tr key={q.id} id={`quote-row-${q.id}`} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">
                    {q.quote_number}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{q.buyer_name}</div>
                    <div className="text-[11px] text-slate-500">{q.buyer_company || 'Independent'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(q.created_at || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {q.total_amount.toLocaleString()} {q.currency}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={q.status}
                      onChange={(e) => handleStatusChange(q, e.target.value as QuotationStatus)}
                      className={`text-[10px] font-bold px-2 py-1 rounded border outline-none ${
                        q.status === 'Accepted'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : q.status === 'Sent'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        id={`btn-view-invoice-${q.id}`}
                        type="button"
                        onClick={() => setPreviewQuote(q)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <button
                        id={`btn-quote-followup-${q.id}`}
                        type="button"
                        onClick={() => onScheduleFollowUp && onScheduleFollowUp(q)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Follow-up
                      </button>
                      <button
                        id={`btn-convert-order-${q.id}`}
                        type="button"
                        onClick={() => handleConvertToOrder(q)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold"
                        title="Convert to Order"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        To Order
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create Quotation */}
      {isModalOpen && (
        <div id="quote-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Generate Proforma Quotation</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuotation} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between">
                  <span>{formError}</span>
                  <button type="button" onClick={() => setFormError(null)} className="ml-2 font-bold text-red-500 hover:text-red-800">✕</button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quote Reference # *</label>
                  <input
                    id="modal-quote-num"
                    type="text"
                    required
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validity (Days)</label>
                  <input
                    id="modal-quote-validity"
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
                  <select
                    id="modal-quote-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Buyer Information</span>
                  {leads.length > 0 && (
                    <select
                      onChange={(e) => {
                        const l = leads.find((lead) => lead.id === e.target.value);
                        if (l) {
                          setBuyerName(l.name);
                          setBuyerCompany(l.company || '');
                          setBuyerCountry(l.country || '');
                          setBuyerEmail(l.email || '');
                          setBuyerPhone(l.phone || '');
                        }
                      }}
                      className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 outline-none"
                    >
                      <option value="">Select from CRM Leads...</option>
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.company || l.country})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Buyer Name *</label>
                    <input
                      id="modal-buyer-name"
                      type="text"
                      required
                      placeholder="e.g. Marcus Vance"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Company</label>
                    <input
                      id="modal-buyer-company"
                      type="text"
                      placeholder="e.g. Vance Luxury Surfaces"
                      value={buyerCompany}
                      onChange={(e) => setBuyerCompany(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Country</label>
                    <input
                      id="modal-buyer-country"
                      type="text"
                      placeholder="e.g. USA"
                      value={buyerCountry}
                      onChange={(e) => setBuyerCountry(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email</label>
                    <input
                      id="modal-buyer-email"
                      type="email"
                      placeholder="email@buyer.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone / WhatsApp</label>
                    <input
                      id="modal-buyer-phone"
                      type="text"
                      placeholder="+1..."
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {products.length > 0 && (
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full sm:w-48 text-xs p-1.5 border border-slate-300 rounded-lg outline-none bg-white"
                        >
                          <option value="">Choose Catalog Product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        placeholder="Description of goods or custom work"
                        value={item.description}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].description = e.target.value;
                          setItems(copy);
                        }}
                        className="flex-1 w-full text-xs p-1.5 border border-slate-300 rounded-lg outline-none bg-white"
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="w-20">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => {
                              const copy = [...items];
                              copy[idx].quantity = Number(e.target.value);
                              setItems(copy);
                            }}
                            className="w-full text-xs p-1.5 border border-slate-300 rounded-lg outline-none bg-white"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Rate"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const copy = [...items];
                              copy[idx].unitPrice = Number(e.target.value);
                              setItems(copy);
                            }}
                            className="w-full text-xs p-1.5 border border-slate-300 rounded-lg outline-none bg-white"
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-800 w-24 text-right">
                          {(item.quantity * item.unitPrice).toLocaleString()} {currency}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adjustments: Discount, Shipping, Tax */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Subtotal</label>
                  <div className="text-xs font-bold text-slate-900 p-2 bg-slate-100 rounded-lg">
                    {subtotal.toLocaleString()} {currency}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Discount (-)</label>
                  <input
                    id="modal-quote-discount"
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Freight / Shipping (+)</label>
                  <input
                    id="modal-quote-shipping"
                    type="number"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tax / VAT (+)</label>
                  <input
                    id="modal-quote-tax"
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-semibold">Grand Total Payable: </span>
                  <span className="text-base font-black text-slate-900">
                    {totalAmount.toLocaleString()} {currency}
                  </span>
                </div>
              </div>

              {/* Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Delivery Terms (Incoterms)</label>
                  <input
                    type="text"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Commercial Notes & Quality Assurances</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="modal-btn-save-quote"
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition"
                >
                  Issue & Finalize Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proforma Invoice Clean Preview Modal */}
      {previewQuote && (
        <div id="invoice-preview-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto print:p-0">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 print:border-none print:shadow-none print:my-0">
            {/* Action Bar (Hidden during Print) */}
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="text-xs font-bold text-slate-300">
                Official Proforma Quotation — {previewQuote.quote_number}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewQuote(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 space-y-6 text-slate-800">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {previewQuote.seller_details.name}
                  </h2>
                  <p className="text-xs text-slate-500">{previewQuote.seller_details.address}</p>
                  <p className="text-xs text-slate-500">
                    Email: {previewQuote.seller_details.email} • Tel: {previewQuote.seller_details.phone}
                  </p>
                  {previewQuote.seller_details.gst_number && (
                    <p className="text-[11px] text-slate-400 font-mono">
                      GST: {previewQuote.seller_details.gst_number} • IEC: {previewQuote.seller_details.iec_code}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase text-blue-600 tracking-widest block">
                    PROFORMA QUOTATION
                  </span>
                  <span className="text-base font-mono font-bold text-slate-900">
                    {previewQuote.quote_number}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Date: {new Date(previewQuote.created_at || Date.now()).toLocaleDateString()}
                  </p>
                  {previewQuote.validity_date && (
                    <p className="text-xs text-slate-500">
                      Valid Until: {new Date(previewQuote.validity_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Bill To */}
              <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Quotation Prepared For:</span>
                <p className="font-bold text-slate-900 text-sm">{previewQuote.buyer_name}</p>
                {previewQuote.buyer_company && <p className="text-slate-700">{previewQuote.buyer_company}</p>}
                {previewQuote.buyer_country && <p className="text-slate-600">{previewQuote.buyer_country}</p>}
                {previewQuote.buyer_email && <p className="text-slate-500">{previewQuote.buyer_email}</p>}
              </div>

              {/* Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 uppercase text-[10px] font-bold">
                    <th className="py-2">Item & Description</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Unit Rate ({previewQuote.currency})</th>
                    <th className="py-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewQuote.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 font-medium text-slate-800">{item.description}</td>
                      <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-600">
                        {item.unit_price ? item.unit_price.toLocaleString() : (item as any).unitPrice?.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        {(item.quantity * ((item.unit_price || (item as any).unitPrice) || 0)).toLocaleString()}{' '}
                        {previewQuote.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Totals */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">
                      {previewQuote.subtotal.toLocaleString()} {previewQuote.currency}
                    </span>
                  </div>
                  {previewQuote.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span>-{previewQuote.discount_amount.toLocaleString()} {previewQuote.currency}</span>
                    </div>
                  )}
                  {previewQuote.shipping_fee > 0 && (
                    <div className="flex justify-between">
                      <span>Freight & Shipping:</span>
                      <span>+{previewQuote.shipping_fee.toLocaleString()} {previewQuote.currency}</span>
                    </div>
                  )}
                  {previewQuote.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Taxes & Duties:</span>
                      <span>+{previewQuote.tax_amount.toLocaleString()} {previewQuote.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-300 font-bold text-sm text-slate-900">
                    <span>Total Payable:</span>
                    <span>{previewQuote.total_amount.toLocaleString()} {previewQuote.currency}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Bank details */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-[11px] text-slate-600">
                <div>
                  <span className="font-bold text-slate-700 uppercase text-[10px]">Payment & Commercial Terms:</span>
                  <p className="mt-0.5">{previewQuote.payment_terms || 'Standard B2B Terms'}</p>
                  <p className="mt-0.5">{previewQuote.delivery_terms || 'Ex-Works'}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 uppercase text-[10px]">Special Instructions:</span>
                  <p className="mt-0.5">{previewQuote.notes || 'Goods strictly compliant with export standards.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
