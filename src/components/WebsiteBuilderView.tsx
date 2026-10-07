import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Eye,
  Save,
  Palette,
  Globe,
  ExternalLink,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  Building2,
  FileText,
  Mail,
  HelpCircle,
} from 'lucide-react';
import { BusinessStore, StoreSection, Product } from '../types';
import { fetchBusinessStore, saveBusinessStore, fetchBusinessProducts } from '../lib/db';
import { useAuth } from '../context/AuthContext';

export const WebsiteBuilderView: React.FC = () => {
  const { currentBusiness } = useAuth();
  const [store, setStore] = useState<BusinessStore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editor states
  const [activeTab, setActiveTab] = useState<'sections' | 'theme' | 'seo' | 'preview'>('sections');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // AI Builder modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiIndustry, setAiIndustry] = useState('');
  const [aiTarget, setAiTarget] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentBusiness) return;

    const load = async () => {
      setLoading(true);
      try {
        const [loadedStore, loadedProducts] = await Promise.all([
          fetchBusinessStore(currentBusiness.id),
          fetchBusinessProducts(currentBusiness.id),
        ]);

        setProducts(loadedProducts);

        if (loadedStore) {
          setStore(loadedStore);
        } else {
          // Default baseline store
          const defaultSections: StoreSection[] = [
            {
              id: 'sec_hero',
              type: 'hero',
              title: `${currentBusiness.name} — Precision Manufacturing & Global Export`,
              subtitle: 'Supplying certified high-grade materials and custom manufactured components to international enterprises.',
              button_text: 'Request Factory Quotation',
              button_link: '#rfq',
              is_visible: true,
              order_index: 0,
            },
            {
              id: 'sec_about',
              type: 'about',
              title: 'Institutional Grade Production & Quality Assurance',
              content: `${currentBusiness.name} is an established ${currentBusiness.business_type} based in ${currentBusiness.country}. We specialize in high-tolerance fabrication, international standard compliance, and containerized dispatch worldwide.`,
              is_visible: true,
              order_index: 1,
            },
            {
              id: 'sec_products',
              type: 'products',
              title: 'Featured Export Product Catalog',
              subtitle: 'Factory-direct wholesale pricing with guaranteed MOQ and lead times',
              is_visible: true,
              order_index: 2,
            },
            {
              id: 'sec_rfq',
              type: 'rfq_banner',
              title: 'Have Custom Sourcing Requirements?',
              subtitle: 'Our technical sales team provides full engineering quotes within 24 hours.',
              button_text: 'Submit Technical Drawing / RFQ',
              button_link: '#contact',
              is_visible: true,
              order_index: 3,
            },
            {
              id: 'sec_faq',
              type: 'faq',
              title: 'Trade & Logistics FAQs',
              items: [
                {
                  title: 'What international Incoterms do you support?',
                  description: 'We routinely deliver under FOB, CIF, CFR, and EXW terms with full Bill of Lading and inspection documentation.',
                },
                {
                  title: 'Can you provide physical samples before container dispatch?',
                  description: 'Yes. Commercial buyers can request verified pre-production sample batches for lab testing.',
                },
              ],
              is_visible: true,
              order_index: 4,
            },
          ];

          const initialStore: BusinessStore = {
            id: crypto.randomUUID ? crypto.randomUUID() : 'store_initial',
            business_id: currentBusiness.id,
            slug: currentBusiness.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            site_title: `${currentBusiness.name} | Official Storefront`,
            tagline: 'Leading Exporter & Manufacturer',
            meta_description: `Direct factory sourcing and export catalog for ${currentBusiness.name}.`,
            theme: {
              primary_color: '#2563eb',
              accent_color: '#4f46e5',
              font_family: 'Inter',
              layout_style: 'modern',
              dark_mode: false,
            },
            sections: defaultSections,
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          setStore(initialStore);
        }
      } catch (err) {
        console.error('Error loading storefront:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentBusiness]);

  const handleSave = async () => {
    if (!store || !currentBusiness) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const saved = await saveBusinessStore(store);
      setStore(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save store:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!currentBusiness) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/website-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: currentBusiness.name,
          industry: aiIndustry || currentBusiness.industry,
          products: products.map((p) => p.name).join(', ') || 'Custom commercial products',
          targetAudience: aiTarget || 'Global importers, distributors, and procurement managers',
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setStore((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            site_title: json.data.site_title || prev.site_title,
            tagline: json.data.tagline || prev.tagline,
            meta_description: json.data.meta_description || prev.meta_description,
            sections: [
              ...(json.data.sections || []),
              {
                id: 'sec_products',
                type: 'products',
                title: 'Featured Export Product Catalog',
                subtitle: 'Factory-direct wholesale pricing with guaranteed MOQ and lead times',
                is_visible: true,
                order_index: 1,
              },
            ],
          };
        });
        setIsAiModalOpen(false);
      } else {
        const raw = typeof json.error === 'string' ? json.error : json.error?.message || '';
        setAiError(res.status === 503 || raw.toLowerCase().includes('not configured') ? 'AI NOT CONFIGURED' : (raw || 'Storefront generation failed'));
      }
    } catch (err: any) {
      console.error('AI Storefront generation error:', err);
      const raw = err.message || '';
      setAiError(raw.toLowerCase().includes('not configured') ? 'AI NOT CONFIGURED' : (raw || 'Storefront generation failed'));
    } finally {
      setAiLoading(false);
    }
  };

  const updateSection = (id: string, updates: Partial<StoreSection>) => {
    if (!store) return;
    const updated = store.sections.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setStore({ ...store, sections: updated });
  };

  const toggleSectionVisibility = (id: string) => {
    if (!store) return;
    const updated = store.sections.map((s) =>
      s.id === id ? { ...s, is_visible: !s.is_visible } : s
    );
    setStore({ ...store, sections: updated });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!store) return;
    const newSections = [...store.sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    newSections.forEach((s, idx) => {
      s.order_index = idx;
    });

    setStore({ ...store, sections: newSections });
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading website builder...</p>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Storefront & Website Builder</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200">
                {store.is_published ? 'Published Live' : 'Draft'}
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Public URL: <span className="font-mono text-blue-600">/store/{store.slug}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Generate Store</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm shadow-blue-600/30 transition-all flex items-center gap-1.5 ml-auto sm:ml-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Storefront'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Preview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Editor Panels */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sub Navigation */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'sections' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Sections ({store.sections.length})
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'theme' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Theme & Style
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'seo' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Domain & SEO
            </button>
          </div>

          {/* Tab 1: Sections Editor */}
          {activeTab === 'sections' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700">Storefront Layout Modules</span>
                <span className="text-[10px] text-slate-400">Reorder & Toggle</span>
              </div>

              <div className="space-y-3">
                {store.sections.map((section, idx) => (
                  <div
                    key={section.id}
                    className={`border rounded-xl p-3 transition-all ${
                      section.is_visible ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                          {section.type}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">
                          {section.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === store.sections.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleSectionVisibility(section.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            section.is_visible
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {section.is_visible ? 'Visible' : 'Hidden'}
                        </button>
                      </div>
                    </div>

                    {/* Quick Section Text Editor */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Title</label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {section.subtitle !== undefined && (
                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Subtitle</label>
                          <input
                            type="text"
                            value={section.subtitle}
                            onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {section.content !== undefined && (
                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Content</label>
                          <textarea
                            rows={2}
                            value={section.content}
                            onChange={(e) => updateSection(section.id, { content: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Theme Settings */}
          {activeTab === 'theme' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
              <h3 className="font-bold text-slate-800">Visual Styling & Branding</h3>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Primary Brand Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={store.theme.primary_color}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        theme: { ...store.theme, primary_color: e.target.value },
                      })
                    }
                    className="w-10 h-10 rounded-lg border border-slate-300 p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={store.theme.primary_color}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        theme: { ...store.theme, primary_color: e.target.value },
                      })
                    }
                    className="font-mono text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Storefront Layout Aesthetic</label>
                <select
                  value={store.theme.layout_style}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      theme: { ...store.theme, layout_style: e.target.value as any },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="modern">Modern Clean (High contrast light, balanced spacing)</option>
                  <option value="minimal">Minimalist (Pure whitespace, stark typography)</option>
                  <option value="industrial">Heavy Industrial (Technical data badges, steel gray)</option>
                  <option value="luxury">Luxury Export (Deep blue navy, gold accents)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Dark Mode Canvas</span>
                  <span className="text-[10px] text-slate-400">Render storefront with sleek dark theme</span>
                </div>
                <input
                  type="checkbox"
                  checked={store.theme.dark_mode}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      theme: { ...store.theme, dark_mode: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Tab 3: SEO Settings */}
          {activeTab === 'seo' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
              <h3 className="font-bold text-slate-800">SEO & Global Web Identity</h3>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Storefront Title</label>
                <input
                  type="text"
                  value={store.site_title}
                  onChange={(e) => setStore({ ...store, site_title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">URL Slug</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-slate-500 font-mono text-[11px]">
                    /store/
                  </span>
                  <input
                    type="text"
                    value={store.slug}
                    onChange={(e) => setStore({ ...store, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-r-lg font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Meta Description (Google SEO)</label>
                <textarea
                  rows={3}
                  value={store.meta_description}
                  onChange={(e) => setStore({ ...store, meta_description: e.target.value })}
                  placeholder="Target keywords, export products, and manufacturing location..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Responsive Storefront Preview */}
        <div className="lg:col-span-7 space-y-3">
          {/* Device Switcher */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2 px-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Live Buyer Storefront Simulation</span>
            </span>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded ${
                  previewDevice === 'desktop' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded ${
                  previewDevice === 'tablet' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded ${
                  previewDevice === 'mobile' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Storefront Canvas Frame */}
          <div
            className={`mx-auto transition-all duration-200 border border-slate-300 rounded-2xl overflow-hidden shadow-lg ${
              previewDevice === 'mobile'
                ? 'max-w-sm'
                : previewDevice === 'tablet'
                ? 'max-w-xl'
                : 'w-full'
            }`}
          >
            {/* Browser top-bar chrome */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 text-center font-mono text-[10px] text-slate-500 bg-white border border-slate-200 rounded px-2 py-0.5 truncate">
                https://vyra.network/store/{store.slug}
              </div>
            </div>

            {/* Actual Storefront Content */}
            <div
              className={`p-6 space-y-8 overflow-y-auto max-h-[620px] font-sans ${
                store.theme.dark_mode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
              }`}
            >
              {/* Store Header */}
              <header className="flex items-center justify-between pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: store.theme.primary_color }}
                  >
                    {currentBusiness?.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xs font-bold leading-tight">{currentBusiness?.name}</h2>
                    <span className="text-[10px] opacity-70">
                      {currentBusiness?.business_type} • {currentBusiness?.country}
                    </span>
                  </div>
                </div>

                <button
                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-white"
                  style={{ backgroundColor: store.theme.primary_color }}
                >
                  Contact Factory
                </button>
              </header>

              {/* Render Sections in Order */}
              {store.sections
                .filter((s) => s.is_visible)
                .map((sec) => (
                  <div key={sec.id} className="space-y-4">
                    {/* Hero */}
                    {sec.type === 'hero' && (
                      <div className="text-center py-6 px-4 rounded-xl bg-slate-50/50 border border-slate-200/60 space-y-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          Official Export Portal
                        </span>
                        <h1 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                          {sec.title}
                        </h1>
                        <p className="text-xs opacity-75 max-w-lg mx-auto">
                          {sec.subtitle}
                        </p>
                        {sec.button_text && (
                          <div className="pt-2">
                            <button
                              className="text-xs font-bold text-white px-5 py-2 rounded-xl shadow-sm"
                              style={{ backgroundColor: store.theme.primary_color }}
                            >
                              {sec.button_text}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* About */}
                    {sec.type === 'about' && (
                      <div className="p-5 rounded-xl border border-slate-200/80 space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">
                          About Our Facilities
                        </h3>
                        <h2 className="text-sm font-bold">{sec.title}</h2>
                        <p className="text-xs opacity-80 leading-relaxed">{sec.content}</p>
                      </div>
                    )}

                    {/* Products Catalog */}
                    {sec.type === 'products' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold">{sec.title}</h3>
                            <p className="text-[11px] opacity-70">{sec.subtitle}</p>
                          </div>
                        </div>

                        {products.length === 0 ? (
                          <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center text-xs opacity-60">
                            No products loaded yet. Add items in the Products module.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {products.slice(0, 4).map((p) => (
                              <div
                                key={p.id}
                                className="p-3 border border-slate-200 rounded-xl space-y-2 bg-slate-50/50"
                              >
                                <div className="h-24 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                                  {p.images && p.images[0] ? (
                                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-bold opacity-40">{p.name}</span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold truncate">{p.name}</h4>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold">
                                    {p.price > 0 ? `${p.price} ${p.currency}` : 'Quote on request'}
                                  </span>
                                  <span className="text-[10px] opacity-70">MOQ: {p.moq}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* RFQ Banner */}
                    {sec.type === 'rfq_banner' && (
                      <div
                        className="p-5 rounded-xl text-white space-y-2 text-center"
                        style={{ backgroundColor: store.theme.primary_color }}
                      >
                        <h3 className="text-sm font-bold">{sec.title}</h3>
                        <p className="text-xs opacity-90">{sec.subtitle}</p>
                        <button className="bg-white text-slate-900 font-bold text-xs px-4 py-2 rounded-xl mt-2">
                          {sec.button_text || 'Submit Requirement'}
                        </button>
                      </div>
                    )}

                    {/* FAQ */}
                    {sec.type === 'faq' && sec.items && (
                      <div className="p-5 rounded-xl border border-slate-200/80 space-y-3">
                        <h3 className="text-sm font-bold">{sec.title}</h3>
                        <div className="space-y-2">
                          {sec.items.map((item, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-800">
                              <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                              <p className="text-[11px] text-slate-600 mt-1">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {/* Storefront Footer */}
              <footer className="pt-6 border-t border-slate-200 text-center text-[10px] opacity-60">
                <p>© {new Date().getFullYear()} {currentBusiness?.name}. All rights reserved.</p>
                <p className="mt-1">Powered by VYRA Global Commerce</p>
              </footer>
            </div>
          </div>
        </div>
      </div>

      {/* AI GENERATION MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">AI Storefront Generator</h3>
            </div>
            <p className="text-slate-500">
              Gemini will generate professional B2B marketing copy, export value propositions, and FAQ sections tailored to your factory.
            </p>

            {aiError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
                <span className="font-semibold">{aiError}</span>
                <button type="button" onClick={() => setAiError(null)} className="text-red-500 hover:text-red-700">✕</button>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-bold mb-1">Specific Industry / Niche</label>
              <input
                type="text"
                value={aiIndustry}
                onChange={(e) => setAiIndustry(e.target.value)}
                placeholder="e.g. Italian Statuario & Carrara Marble Slabs"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Target Buyers</label>
              <input
                type="text"
                value={aiTarget}
                onChange={(e) => setAiTarget(e.target.value)}
                placeholder="e.g. Architectural contractors in USA & Europe"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-3 py-2 text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiLoading}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? 'Generating...' : 'Generate Storefront'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
