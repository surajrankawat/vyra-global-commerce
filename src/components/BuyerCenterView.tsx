import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  FileText,
  ShoppingBag,
  Heart,
  MessageSquare,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Plus,
  Layers,
  Clock,
  DollarSign,
  Truck,
  Check,
  X,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import {
  fetchRFQs,
  fetchBusinessQuotations,
  fetchBusinessOrders,
  fetchMarketplaceSuppliers,
  createRFQ,
} from '../lib/db';
import { RFQ, Quotation, Order, Business } from '../types';

interface BuyerCenterViewProps {
  onSelectView: (view: string) => void;
  onOpenRFQModal?: () => void;
}

export const BuyerCenterView: React.FC<BuyerCenterViewProps> = ({
  onSelectView,
  onOpenRFQModal,
}) => {
  const { currentBusiness } = useAuth();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Business[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'rfqs' | 'orders'>('overview');
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick RFQ form
  const [isPostingRfq, setIsPostingRfq] = useState(false);
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqCategory, setRfqCategory] = useState('Industrial Goods');
  const [rfqQty, setRfqQty] = useState<number | ''>(100);
  const [rfqUnit, setRfqUnit] = useState('Units');
  const [rfqSpecs, setRfqSpecs] = useState('');
  const [rfqNotice, setRfqNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadBuyerData() {
      setLoading(true);
      try {
        const [loadedRfqs, loadedSuppliers] = await Promise.all([
          fetchRFQs(),
          fetchMarketplaceSuppliers(),
        ]);
        setRfqs(loadedRfqs);
        setSuppliers(loadedSuppliers);

        if (currentBusiness) {
          const [loadedQuotes, loadedOrders] = await Promise.all([
            fetchBusinessQuotations(currentBusiness.id),
            fetchBusinessOrders(currentBusiness.id),
          ]);
          setQuotations(loadedQuotes);
          setOrders(loadedOrders);
          // Pre-select up to 3 quotes for comparison
          setSelectedQuoteIds(loadedQuotes.slice(0, 3).map((q) => q.id));
        }
      } catch (err) {
        console.error('Error loading buyer hub data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBuyerData();
  }, [currentBusiness]);

  const handleCreateQuickRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !rfqTitle.trim()) return;

    try {
      const created = await createRFQ({
        business_id: currentBusiness.id,
        buyer_name: currentBusiness.owner_name || currentBusiness.name,
        buyer_company: currentBusiness.name,
        buyer_country: currentBusiness.country || 'Global',
        product_title: rfqTitle.trim(),
        category: rfqCategory,
        quantity: Number(rfqQty) || 1,
        unit: rfqUnit,
        delivery_location: currentBusiness.city ? `${currentBusiness.city}, ${currentBusiness.country}` : (currentBusiness.country || 'Global Delivery Port'),
        specifications: rfqSpecs.trim(),
        currency: currentBusiness.currency || 'USD',
        status: 'OPEN',
      });

      setRfqs([created, ...rfqs]);
      setIsPostingRfq(false);
      setRfqTitle('');
      setRfqSpecs('');
      setRfqNotice(`Tender published successfully! Reference ID: ${created.id.slice(0, 8)}`);
      setTimeout(() => setRfqNotice(null), 5000);
    } catch (err: any) {
      setRfqNotice(`Failed to post RFQ: ${err.message}`);
    }
  };

  const comparedQuotes = quotations.filter((q) => selectedQuoteIds.includes(q.id));

  return (
    <div className="space-y-6">
      {/* Buyer Hub Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-mono font-bold uppercase">
            <Compass className="w-3.5 h-3.5" /> BUYER SOURCING & PROCUREMENT HUB
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Institutional Procurement Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Issue purchasing tenders, evaluate vendor quotations side-by-side with Incoterms and lead times,
            and monitor overseas factory production batches without broker intermediaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsPostingRfq(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" /> Post New RFQ / Tender
          </button>
          <button
            type="button"
            onClick={() => onSelectView('marketplace')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
          >
            <Compass className="w-4 h-4" /> Browse Suppliers
          </button>
        </div>
      </div>

      {rfqNotice && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center justify-between">
          <span className="font-semibold">{rfqNotice}</span>
          <button onClick={() => setRfqNotice(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Procurement Overview
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'comparison'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Quotation Comparison Matrix ({quotations.length})
        </button>
        <button
          onClick={() => setActiveTab('rfqs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'rfqs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Issued Tenders ({rfqs.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase">Issued Tenders</span>
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{rfqs.length}</div>
              <div className="text-[11px] text-slate-500">Live purchasing bids</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase">Vendor Quotes</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{quotations.length}</div>
              <div className="text-[11px] text-slate-500">Proformas received</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase">Active Orders</span>
                <ShoppingBag className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{orders.length}</div>
              <div className="text-[11px] text-slate-500">Commercial contracts</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase">Shortlisted Mills</span>
                <Building2 className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{suppliers.length}</div>
              <div className="text-[11px] text-slate-500">Pre-qualified factories</div>
            </div>
          </div>

          {/* Quick RFQ Modal */}
          {isPostingRfq && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Publish New Purchasing Tender / RFQ</h3>
                </div>
                <button onClick={() => setIsPostingRfq(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleCreateQuickRFQ} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Product Title / Requirement *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Polished Calacatta Gold Marble Slabs (20mm)"
                      value={rfqTitle}
                      onChange={(e) => setRfqTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={rfqCategory}
                      onChange={(e) => setRfqCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Industrial Goods">Industrial Goods</option>
                      <option value="Natural Stones & Minerals">Natural Stones & Minerals</option>
                      <option value="Textiles & Apparel">Textiles & Apparel</option>
                      <option value="Chemicals & Polymers">Chemicals & Polymers</option>
                      <option value="Electronics & Hardware">Electronics & Hardware</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={rfqQty}
                      onChange={(e) => setRfqQty(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit of Measure</label>
                    <input
                      type="text"
                      placeholder="e.g. SQFT, Containers, Metric Tons"
                      value={rfqUnit}
                      onChange={(e) => setRfqUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Technical Specifications & Packaging</label>
                  <textarea
                    rows={3}
                    placeholder="Thickness tolerance ±1mm, seaworthy wooden crate packaging, FOB Nhava Sheva or CIF New York..."
                    value={rfqSpecs}
                    onChange={(e) => setRfqSpecs(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsPostingRfq(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    Publish to Global Network
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUOTATION COMPARISON MATRIX (Section 18) */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Multi-Vendor Quotation Comparison</h3>
              <p className="text-xs text-slate-500">
                Evaluate competing factory bids across pricing, Incoterms, transit times, and warranty terms.
                You retain complete decision control—VYRA presents verifiable data without artificial vendor biasing.
              </p>
            </div>

            {quotations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                No quotations received yet. Issue an RFQ to invite standardized proforma proposals.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="py-3 px-4">Supplier / Factory</th>
                      <th className="py-3 px-4">Quote Serial #</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Incoterms</th>
                      <th className="py-3 px-4">Freight & Tax</th>
                      <th className="py-3 px-4">Validity</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {quotations.map((quote) => (
                      <tr key={quote.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{quote.seller_details?.name || 'Verified Supplier'}</div>
                          <div className="text-[11px] text-slate-400">{quote.seller_details?.address || 'Export Facility'}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {quote.quote_number}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {quote.currency} {quote.total_amount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-semibold">
                            {quote.delivery_terms || quote.incoterms || 'FOB Port'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <div>Shipping: {quote.currency} {quote.shipping_fee || 0}</div>
                          <div>Tax/Duty: {quote.currency} {quote.tax_amount || 0}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {quote.validity_date || '30 Days'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            quote.status === 'Accepted'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                          }`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectView('quotations')}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg text-xs font-bold transition"
                          >
                            View Proforma
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ISSUED RFQS */}
      {activeTab === 'rfqs' && (
        <div className="space-y-4">
          {rfqs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-400">
              No active buying tenders. Click "Post New RFQ" above to solicit factory bids.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rfqs.map((rfq) => (
                <div key={rfq.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 uppercase">
                        {rfq.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{rfq.category}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{rfq.product_title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{rfq.specifications || 'Standard export packaging and test certificate required.'}</p>
                    <div className="text-xs text-slate-500 flex items-center gap-4 pt-1 font-mono">
                      <span>Volume: {rfq.quantity} {rfq.unit}</span>
                      <span>Delivery Port: {rfq.delivery_location}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectView('quotations')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold rounded-xl transition"
                  >
                    View Vendor Bids
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
