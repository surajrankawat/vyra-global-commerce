import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchBusinessProducts } from '../lib/db';
import { Product, AIRevenueAgentOutput } from '../types';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Save,
  Send,
  Building2,
  Globe,
  DollarSign,
  Package,
  Mail,
  MessageSquare,
  ShieldCheck,
  Search,
  Target,
  ArrowRight,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface AIRevenueAgentViewProps {
  onProceedToOutreach?: () => void;
  initialProduct?: Product | null;
}

export const AIRevenueAgentView: React.FC<AIRevenueAgentViewProps> = ({ onProceedToOutreach, initialProduct }) => {
  const { currentBusiness } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Form Inputs
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState('USD');
  const [moq, setMoq] = useState<number | ''>(1);
  const [quantityAvailable, setQuantityAvailable] = useState<number | ''>('');
  const [targetCountries, setTargetCountries] = useState('United States, UAE, United Kingdom, Germany, Australia');
  const [targetBuyerType, setTargetBuyerType] = useState('Importers, Commercial Contractors, Stone Wholesalers, Distributors');
  const [shippingInfo, setShippingInfo] = useState('CIF / FOB Port of Export, seaworthy crating');
  const [paymentTerms, setPaymentTerms] = useState('30% T/T Advance, 70% against B/L copy or L/C at sight');
  const [customNotes, setCustomNotes] = useState('Zero chemical treatment, hand-carved finishing available');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIRevenueAgentOutput | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!currentBusiness) return;
    setCurrency(currentBusiness.currency || 'USD');
    if (currentBusiness.export_countries && currentBusiness.export_countries.length > 0) {
      setTargetCountries(currentBusiness.export_countries.join(', '));
    }
    fetchBusinessProducts(currentBusiness.id)
      .then((prods) => {
        setProducts(prods);
        if (initialProduct) {
          handleSelectProduct(initialProduct);
        } else if (prods.length > 0 && !selectedProductId) {
          handleSelectProduct(prods[0]);
        }
      })
      .catch(console.error);
  }, [currentBusiness, initialProduct]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProductId(p.id);
    setProductName(p.name);
    setProductCategory(p.category);
    setProductDescription(p.description);
    setPrice(p.price);
    setCurrency(p.currency);
    setMoq(p.moq);
    setQuantityAvailable(p.stock_quantity ?? '');
    if (p.shipping_notes) setShippingInfo(p.shipping_notes);
    if (p.payment_terms) setPaymentTerms(p.payment_terms);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!productName.trim() || !productCategory.trim()) {
      setError('Please provide at least a Product Name and Category.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/ai/revenue-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          productCategory,
          productDescription,
          price,
          currency,
          moq,
          quantityAvailable,
          targetCountries,
          targetBuyerType,
          shippingInfo,
          paymentTerms,
          customNotes,
          businessProfile: currentBusiness,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const rawErr = typeof data.error === 'string' ? data.error : data.error?.message || data.error?.code || '';
        if (response.status === 503 || rawErr.toLowerCase().includes('not configured') || rawErr.includes('AI_UNAVAILABLE') || rawErr.includes('AI_NOT_CONFIGURED')) {
          throw new Error('AI NOT CONFIGURED');
        }
        throw new Error(rawErr || 'Failed to generate revenue strategy.');
      }

      setResult(data.data as AIRevenueAgentOutput);
    } catch (err: any) {
      setError(err.message || 'AI service is currently unavailable. Check your API configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveToStrategy = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div id="ai-revenue-agent-view" className="space-y-6">
      {/* View Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-900/50 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Institutional Commerce Engine</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">AI Revenue Agent</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Analyzes your products, builds precise buyer personas, derives targeted search keywords, and crafts ready-to-send B2B outreach and follow-up sequences.
            </p>
          </div>
          {products.length > 0 && (
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 shrink-0">
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Load from Product Catalog:
              </label>
              <select
                id="select-existing-product"
                value={selectedProductId}
                onChange={(e) => {
                  const found = products.find((p) => p.id === e.target.value);
                  if (found) handleSelectProduct(found);
                }}
                className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 outline-none w-full max-w-xs"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Input Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
              <input
                id="agent-input-product-name"
                type="text"
                required
                placeholder="e.g. Makrana White Marble Slabs (Bookmatched)"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Category *</label>
              <input
                id="agent-input-category"
                type="text"
                required
                placeholder="e.g. Natural Stone / Temple Handicrafts"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price</label>
                <input
                  id="agent-input-price"
                  type="number"
                  placeholder="e.g. 145"
                  value={price}
                  onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
                <select
                  id="agent-select-currency"
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Product Description / Technical Specifications</label>
            <textarea
              id="agent-input-description"
              rows={2}
              placeholder="Detail the material properties, dimensions, quarry origin, finishing, and certifications..."
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Order Qty (MOQ)</label>
              <input
                id="agent-input-moq"
                type="number"
                placeholder="e.g. 200 sq.m / 1 container"
                value={moq}
                onChange={(e) => setMoq(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock / Production Capacity</label>
              <input
                id="agent-input-stock"
                type="text"
                placeholder="e.g. 5,000 sq.m / 2 containers/mo"
                value={quantityAvailable}
                onChange={(e) => setQuantityAvailable(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Countries</label>
              <input
                id="agent-input-countries"
                type="text"
                placeholder="e.g. USA, UAE, UK, Germany"
                value={targetCountries}
                onChange={(e) => setTargetCountries(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Buyer Type</label>
              <input
                id="agent-input-buyer-type"
                type="text"
                placeholder="e.g. Wholesalers, Importers, Contractors"
                value={targetBuyerType}
                onChange={(e) => setTargetBuyerType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shipping & Logistics Notes</label>
              <input
                id="agent-input-shipping"
                type="text"
                placeholder="e.g. FOB Mundra / CIF Long Beach, seaworthy fumigated crates"
                value={shippingInfo}
                onChange={(e) => setShippingInfo(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms</label>
              <input
                id="agent-input-payment-terms"
                type="text"
                placeholder="e.g. 30% T/T Advance, 70% against B/L or LC at sight"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unique Craftsmanship / Notes</label>
              <input
                id="agent-input-notes"
                type="text"
                placeholder="e.g. Quarried from historic veins, master artisan carvings"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              id="btn-run-revenue-agent"
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Commercial Strategy...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Revenue Strategy
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <div id="revenue-agent-results" className="space-y-6 animate-in fade-in duration-200">
          {/* Action Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">Commercial Strategy Generated Successfully</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-save-strategy"
                type="button"
                onClick={handleSaveToStrategy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <Save className="w-3.5 h-3.5" />
                {savedSuccess ? 'Saved to Workspace!' : 'Save Strategy'}
              </button>
              <button
                id="btn-regenerate-strategy"
                type="button"
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* A. Product Analysis */}
            <div id="card-product-analysis" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-600" /> A. Commercial Product Analysis
                </h3>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.product_analysis.summary, 'analysis')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {copiedKey === 'analysis' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{result.product_analysis.summary}</p>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Market Appeal</p>
                <p className="text-xs text-slate-600">{result.product_analysis.market_appeal}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Perceived Value Drivers</p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                  {result.product_analysis.perceived_value_drivers.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* B. Ideal Customer Profile (ICP) */}
            <div id="card-icp" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-600" /> B. Ideal Customer Profile (ICP)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Target Industries</p>
                  <p className="text-slate-700 font-medium">{result.ideal_customer_profile.target_industries.join(', ')}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Company Types</p>
                  <p className="text-slate-700 font-medium">{result.ideal_customer_profile.company_types.join(', ')}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Key Decision Makers</p>
                  <p className="text-slate-700 font-medium">{result.ideal_customer_profile.key_decision_makers.join(', ')}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Geographical Focus</p>
                  <p className="text-slate-700 font-medium">{result.ideal_customer_profile.geographical_markets.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* C. Buyer Personas */}
            <div id="card-buyer-personas" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-600" /> C. Buyer Personas
                </h3>
              </div>
              {result.buyer_personas.map((persona, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900">{persona.title}</div>
                  <div className="text-slate-500">{persona.role}</div>
                  <div className="pt-1 text-[11px]">
                    <span className="font-bold text-slate-600">Pain Points: </span>
                    <span className="text-slate-500">{persona.pain_points.join('; ')}</span>
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-600">Buying Triggers: </span>
                    <span className="text-slate-500">{persona.buying_triggers.join('; ')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* D. Buyer Search Keywords */}
            <div id="card-search-keywords" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-amber-600" /> D. Buyer Search Strings & HS Codes
                </h3>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.buyer_search_keywords.b2b_trade_queries.join('\n'), 'keywords')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {copiedKey === 'keywords' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">B2B Directory & Customs Search Strings</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.buyer_search_keywords.b2b_trade_queries.map((q, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono">
                      {q}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">HS Code Classification</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.buyer_search_keywords.hs_code_suggestions.map((code, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[11px] font-mono font-bold">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* E & F. Sales Positioning & USPs */}
            <div id="card-positioning" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">E & F. Strategic Positioning & USPs</h3>
              </div>
              <p className="text-xs text-slate-700 italic border-l-2 border-blue-500 pl-3">
                "{result.sales_positioning}"
              </p>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Core Differentiators</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.unique_selling_points.map((usp, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{usp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* G. Suggested Offer Structure */}
            <div id="card-offer" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> G. Suggested B2B Commercial Offer
                </h3>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs space-y-1">
                <div className="font-bold text-emerald-900">{result.suggested_offer.headline}</div>
                <p className="text-emerald-800">{result.suggested_offer.structure}</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  <strong>Risk Reversal:</strong> {result.suggested_offer.risk_reversal_guarantee}
                </p>
              </div>
            </div>
          </div>

          {/* Outreach Templates (Email, WhatsApp, Sales Message) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* H. Personalized Sales Message */}
            <div id="card-sales-msg" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" /> H. Direct Sales Message
                </h3>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.personalized_sales_message, 'salesmsg')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {copiedKey === 'salesmsg' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-mono">
                {result.personalized_sales_message}
              </div>
            </div>

            {/* I. Email Draft */}
            <div id="card-email-draft" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-600" /> I. B2B Commercial Email Draft
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `Subject: ${result.email_draft.subject}\n\n${result.email_draft.body}`,
                      'email'
                    )
                  }
                  className="text-slate-400 hover:text-slate-600"
                >
                  {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-900">Subject: </span>
                {result.email_draft.subject}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-mono max-h-56 overflow-y-auto">
                {result.email_draft.body}
              </div>
            </div>

            {/* J. WhatsApp Draft */}
            <div id="card-whatsapp-draft" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" /> J. WhatsApp Trade Intro
                </h3>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.whatsapp_draft, 'wa')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {copiedKey === 'wa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-mono">
                {result.whatsapp_draft}
              </div>
            </div>
          </div>

          {/* K & L & M: Follow-up sequence, Objection handling, Next action */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* K. Follow-up Sequence */}
            <div id="card-followup-sequence" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">K. 3-Touch Follow-up Sequence</h3>
              </div>
              <div className="space-y-2">
                {result.follow_up_sequence.map((step, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Day {step.day}: {step.title}</span>
                      <span className="text-[10px] text-slate-400">{step.channel}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2">{step.template}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* L. Objection Handling */}
            <div id="card-objections" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">L. Objection Handling</h3>
              </div>
              <div className="space-y-2">
                {result.objection_handling.map((obj, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-red-800">Objection: "{obj.objection}"</div>
                    <div className="text-slate-700 text-[11px]">
                      <strong>Defense:</strong> {obj.response}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* M. Suggested Next Action */}
            <div id="card-next-action" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-blue-600">M. Recommended Immediate Action</h3>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-2">
                <p className="font-semibold text-blue-950">{result.suggested_next_action}</p>
                <div className="pt-2 text-[11px] text-blue-800">
                  Ready to add a prospect or launch Buyer Discovery to find importers matching this profile?
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
