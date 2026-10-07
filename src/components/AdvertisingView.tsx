import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Sparkles,
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Play,
  Pause,
  X,
  Target,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { AdCampaign, Product } from '../types';
import {
  fetchAdCampaigns,
  createAdCampaign,
  updateAdCampaignStatus,
  fetchBusinessProducts,
} from '../lib/db';
import { useAuth } from '../context/AuthContext';

export const AdvertisingView: React.FC = () => {
  const { currentBusiness } = useAuth();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New Campaign Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignType, setCampaignType] = useState<AdCampaign['campaign_type']>('Sponsored Product');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [targetCategory, setTargetCategory] = useState('Natural Stone & Marble');
  const [targetCountries, setTargetCountries] = useState('United States, Germany, UAE');
  const [dailyBudget, setDailyBudget] = useState(25);
  const [bidCpc, setBidCpc] = useState(0.75);
  const [submitting, setSubmitting] = useState(false);

  // AI Ad copy generator
  const [aiHeadline, setAiHeadline] = useState('');
  const [aiBody, setAiBody] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const [camps, prods] = await Promise.all([
        fetchAdCampaigns(currentBusiness.id),
        fetchBusinessProducts(currentBusiness.id),
      ]);
      setCampaigns(camps);
      setProducts(prods);
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id);
      }
    } catch (err) {
      console.error('Error loading ads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness]);

  const handleToggleStatus = async (id: string, currentStatus: AdCampaign['status']) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await updateAdCampaignStatus(id, nextStatus);
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
    );
  };

  const handleGenerateAiAd = async () => {
    const selectedProd = products.find((p) => p.id === selectedProductId);
    setAiGenerating(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/ad-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignType,
          productName: selectedProd?.name || 'High Grade Industrial Export Product',
          targetMarket: targetCountries,
          targetAudience: 'Global Wholesale Importers & Procurement Engineers',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setAiHeadline(data.data.headlines?.[0] || 'Direct Factory Wholesale');
        setAiBody(data.data.ad_copy || '');
      } else {
        const raw = typeof data.error === 'string' ? data.error : data.error?.message || '';
        setAiError(res.status === 503 || raw.toLowerCase().includes('not configured') ? 'AI NOT CONFIGURED' : (raw || 'Failed to generate ad copy'));
      }
    } catch (err: any) {
      console.error('Failed to generate ad copy:', err);
      const raw = err.message || '';
      setAiError(raw.toLowerCase().includes('not configured') ? 'AI NOT CONFIGURED' : (raw || 'Failed to generate ad copy'));
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !campaignTitle.trim()) return;

    setSubmitting(true);
    try {
      const selectedProd = products.find((p) => p.id === selectedProductId);
      await createAdCampaign({
        business_id: currentBusiness.id,
        title: campaignTitle,
        campaign_type: campaignType,
        product_id: selectedProductId || undefined,
        product_name: selectedProd?.name,
        target_countries: targetCountries.split(',').map((c) => c.trim()),
        target_categories: [targetCategory],
        daily_budget: Number(dailyBudget),
        total_budget: Number(dailyBudget) * 30,
        currency: currentBusiness.currency || 'USD',
        status: 'ACTIVE',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        headline: aiHeadline || campaignTitle,
        ad_copy: aiBody,
      });

      setCampaignTitle('');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics totals
  const totalSpend = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              VYRA Ads & Marketplace Promotion
            </h1>
            <p className="text-xs text-slate-500">
              Feature your products at the top of category searches and buyer trade directories
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold">Total Ad Spend</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900">
            ${totalSpend.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500">Across {campaigns.length} campaigns</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold">Buyer Impressions</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {totalImpressions.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">Live on Global Directory</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold">Verified Clicks</span>
            <MousePointer className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {totalClicks.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Target buyer visits</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold">Average CTR</span>
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {avgCtr}%
          </div>
          <span className="text-[10px] text-slate-500">Click-through conversion</span>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800">
            Your Advertising Campaigns ({campaigns.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading campaign records...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No active ad campaigns</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Boost your catalog to verified buyers in your target export countries by launching an ad campaign.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              Launch First Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3 pl-4">Campaign & Target</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Daily Budget</th>
                  <th className="p-3">Impressions</th>
                  <th className="p-3">Clicks</th>
                  <th className="p-3">Spend</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 pl-4">
                      <div className="font-bold text-slate-900">{camp.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {camp.target_countries?.join(', ')}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {camp.campaign_type}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          camp.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">
                      ${camp.daily_budget}/day
                    </td>
                    <td className="p-3">{camp.impressions.toLocaleString()}</td>
                    <td className="p-3">{camp.clicks.toLocaleString()}</td>
                    <td className="p-3 font-bold text-slate-900">
                      ${camp.spend.toFixed(2)}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(camp.id, camp.status)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold ${
                          camp.status === 'ACTIVE'
                            ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {camp.status === 'ACTIVE' ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LAUNCH CAMPAIGN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150 text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900">Launch Advertising Campaign</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 US Importer Sourcing Campaign"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Placement Type</label>
                  <select
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  >
                    <option value="SPONSORED_PRODUCT">Sponsored Product (Top Search)</option>
                    <option value="FEATURED_STOREFRONT">Featured Storefront Banner</option>
                    <option value="BANNER_AD">Category Banner Ad</option>
                    <option value="TOP_SEARCH">Keyword Priority Placement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Promoted Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Export Countries</label>
                  <input
                    type="text"
                    value={targetCountries}
                    onChange={(e) => setTargetCountries(e.target.value)}
                    placeholder="United States, Germany, UAE"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Daily Budget (USD)</label>
                  <input
                    type="number"
                    min={5}
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* AI Ad Copy Assist */}
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>AI Copy Assistant</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAiAd}
                    disabled={aiGenerating}
                    className="text-purple-700 font-bold hover:underline"
                  >
                    {aiGenerating ? 'Generating...' : 'Generate Copy'}
                  </button>
                </div>

                {aiError && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded font-semibold flex items-center justify-between">
                    <span>{aiError}</span>
                    <button type="button" onClick={() => setAiError(null)} className="text-red-500 hover:text-red-700">✕</button>
                  </div>
                )}

                {aiHeadline && (
                  <div className="text-slate-800 space-y-1">
                    <div className="font-bold text-[11px]">{aiHeadline}</div>
                    <div className="text-[10px] text-slate-600">{aiBody}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                >
                  <span>{submitting ? 'Launching...' : 'Activate Campaign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
