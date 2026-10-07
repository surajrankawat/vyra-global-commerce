import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Globe,
  Building2,
  Package,
  ShieldCheck,
  TrendingUp,
  FileText,
  MessageSquare,
  Compass,
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
  Layers,
  Zap,
  BarChart3,
  Search,
  ChevronDown,
  ChevronUp,
  Cpu,
  Truck,
  Shield,
  CreditCard,
  Rocket,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { VyraLogo, VyraIcon } from './brand/VyraLogo';
import { BRAND } from '../config/brand';
import { fetchMarketplaceSuppliers, fetchProducts } from '../lib/db';
import { Business, Product } from '../types';
import { MediaFallback } from './media/MediaFallback';

interface LandingPageViewProps {
  onEnterApp: (targetView?: string) => void;
  onOpenAuth: () => void;
  onOpenSearch?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onEnterApp,
  onOpenAuth,
  onOpenSearch,
}) => {
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
  const [activeTab, setActiveTab] = useState<'b2b' | 'b2c' | 'ai' | 'marketplace' | 'builder'>('b2b');
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadShowcaseData() {
      try {
        const suppliers = await fetchMarketplaceSuppliers();
        setFeaturedBusinesses(suppliers.slice(0, 3));
        const prods = await fetchProducts(suppliers[0]?.id || 'demo');
        setFeaturedProducts(prods.slice(0, 4));
      } catch (e) {
        console.error('Failed to load showcase data:', e);
      }
    }
    loadShowcaseData();
  }, []);

  const faqs = [
    {
      q: 'What is VYRA?',
      a: 'VYRA is an AI-native B2B and B2C marketplace and global business network. It connects manufacturers, exporters, wholesale buyers, retailers, and consumers through sequential RFQs, storefront builders, internal ad networks, and autonomous AI revenue agents.',
    },
    {
      q: 'How does VYRA protect enterprise trade data?',
      a: 'Every record is strictly partitioned by business_id using PostgreSQL Row Level Security (RLS). Quotations, margins, and leads are never exposed across organizations. Server credentials for payment gateways and AI models remain strictly on backend proxy routes.',
    },
    {
      q: 'Can I sell both wholesale (B2B) and retail (B2C)?',
      a: 'Yes. Products support wholesale MOQs (Minimum Order Quantities) with bulk tier pricing, as well as direct retail checkout via Stripe or Razorpay. You can publish multi-page digital storefronts in seconds.',
    },
    {
      q: 'How does the AI Revenue Agent work?',
      a: 'The AI Revenue Agent scans RFQs, suggests high-margin product opportunities, drafts professional commercial proposals in 26+ languages, and monitors customer health indicators in real-time.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white font-sans">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/85 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VyraLogo size="md" theme="dark" showTagline={false} />
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Search Trigger */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-400 hover:text-white hover:border-slate-600 transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search network...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.code.toUpperCase()})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onEnterApp('marketplace')}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition hidden md:block"
            >
              {t.nav.marketplace}
            </button>

            <button
              type="button"
              onClick={() => onEnterApp('dashboard')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-xl hover:bg-blue-950/50 transition border border-blue-800/60"
            >
              Enter Dashboard
            </button>

            <button
              type="button"
              onClick={onOpenAuth}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <span>{t.actions.startFree}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-blue-600/10 blur-[150px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs text-blue-400 mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">{BRAND.tagline}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
            The AI-Native Operating System for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400">
              Global Commerce
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            {BRAND.longDescription}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onEnterApp('dashboard')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-xl shadow-blue-600/30 transition flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch Operating System</span>
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('marketplace')}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm px-6 py-3 rounded-2xl transition flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Explore Global Marketplace</span>
            </button>
          </div>

          {/* Metric Highlights Strip */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div>
              <div className="text-2xl font-black text-white">140+</div>
              <div className="text-xs text-slate-400 font-medium">Export Destinations</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">100%</div>
              <div className="text-xs text-slate-400 font-medium">Multi-Tenant Isolation</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">26+</div>
              <div className="text-xs text-slate-400 font-medium">Native Languages</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">AI-Native</div>
              <div className="text-xs text-slate-400 font-medium">Commercial Revenue Brain</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Workflow Tabs */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Engineered for Every Modern Commerce Flow
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Select an operational layer to explore how VYRA powers enterprise performance
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex justify-center flex-wrap gap-2 mb-8">
            {[
              { id: 'b2b', label: 'B2B & Manufacturing', icon: Building2 },
              { id: 'b2c', label: 'B2C Retail & Checkout', icon: ShoppingBag },
              { id: 'ai', label: 'AI Revenue Agent', icon: Sparkles },
              { id: 'marketplace', label: 'Global Trade Network', icon: Globe },
              { id: 'builder', label: 'Storefront Builder', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Showcase */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 md:p-8 max-w-4xl mx-auto">
            {activeTab === 'b2b' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Full-Cycle B2B Sourcing & Production</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage product specifications, MOQs, sequential quotations, Incoterms, and dispatch logistics.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEnterApp('quotations')}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
                  >
                    <span>Try Quotations</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <h4 className="text-xs font-bold text-slate-200">Sequential Quotations</h4>
                    <p className="text-[11px] text-slate-400">
                      Standard sequential quote numbering (QT-2026-XXXX) with auto-computed taxes and discounts.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <Package className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-200">Inventory & Lot Tracking</h4>
                    <p className="text-[11px] text-slate-400">
                      Track physical inventory, reserved quantities, reorder points, and supplier logistics.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <Truck className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-200">Global Incoterms</h4>
                    <p className="text-[11px] text-slate-400">
                      Full support for FOB, CIF, EXW, and DDP terms with multi-currency cross-border trade.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'b2c' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Direct-to-Consumer & Retail Commerce</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Sell directly to individual consumers with instant cart checkout, payment intents, and automated invoices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEnterApp('marketplace')}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
                  >
                    <span>Browse Retail Catalog</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-200">Audited Gateways</h4>
                    <p className="text-[11px] text-slate-400">
                      Integrated Stripe & Razorpay workflows strictly calculating in integer minor units.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <ShoppingBag className="w-5 h-5 text-blue-400" />
                    <h4 className="text-xs font-bold text-slate-200">Real-Time Cart & Checkout</h4>
                    <p className="text-[11px] text-slate-400">
                      Smooth consumer checkout drawer with shipping address validation and tax breakdown.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-200">Disputes & Returns</h4>
                    <p className="text-[11px] text-slate-400">
                      Standard return window policy, return shipping label tracking, and audited mediation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Autonomous AI Revenue Brain</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Gemini-powered executive copilot that automates proposal drafting, leads, and cross-border marketing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEnterApp('revenue-agent')}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
                  >
                    <span>Launch Agent</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h4 className="text-xs font-bold text-slate-200">RFQ Response Engine</h4>
                    <p className="text-[11px] text-slate-400">
                      Drafts competitive, technically sound supplier bids grounded in real inventory and margins.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <h4 className="text-xs font-bold text-slate-200">Multilingual Sales</h4>
                    <p className="text-[11px] text-slate-400">
                      Communicate fluently across 26 global languages with region-accurate commercial etiquette.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <Cpu className="w-5 h-5 text-purple-400" />
                    <h4 className="text-xs font-bold text-slate-200">Creative Studio</h4>
                    <p className="text-[11px] text-slate-400">
                      Generate ad copy, headline variations, and commercial media directives in seconds.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Global Trade & Sourcing Directory</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Direct factory verification, verified badges, RFQ submission board, and real-time chat.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEnterApp('marketplace')}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
                  >
                    <span>Open Directory</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-200">Verified Manufacturers</h4>
                    <p className="text-[11px] text-slate-400">
                      Direct factory verification, export credentials (IEC, GST, ISO), and verified badges.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h4 className="text-xs font-bold text-slate-200">Public RFQ Board</h4>
                    <p className="text-[11px] text-slate-400">
                      Submit requirements publicly to receive factory-direct wholesale bids from verified sellers.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    <h4 className="text-xs font-bold text-slate-200">Live Supplier Chat</h4>
                    <p className="text-[11px] text-slate-400">
                      Negotiate specs, share technical documents, and confirm production timelines in real-time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'builder' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">AI Website & Storefront Builder</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Generate high-converting company websites with product showcases, customer inquiries, and custom branding.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEnterApp('website-builder')}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
                  >
                    <span>Build Storefront</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <Layers className="w-5 h-5 text-blue-400" />
                    <h4 className="text-xs font-bold text-slate-200">Multi-Section Pages</h4>
                    <p className="text-[11px] text-slate-400">
                      Custom hero headers, features, gallery, about story, and contact forms built in.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-200">AI Copy & Theme</h4>
                    <p className="text-[11px] text-slate-400">
                      One-click AI generation tailored to your exact industry and target buyer demographics.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-200">Instant Public URL</h4>
                    <p className="text-[11px] text-slate-400">
                      Sharable live URL accessible by global clients on desktop, tablet, and mobile devices.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Real Featured Showcase Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Verified Marketplace Showcase
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real commercial catalog listings from active manufacturing suppliers
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEnterApp('marketplace')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition"
          >
            <span>View Full Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onEnterApp('marketplace')}
                className="group bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-2xl p-3 flex flex-col transition cursor-pointer"
              >
                <div className="h-40 w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center mb-3">
                  {p.images && p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition"
                    />
                  ) : (
                    <MediaFallback category={p.category} title={p.name} size="md" />
                  )}
                </div>
                <div className="space-y-1 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      {p.category}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition line-clamp-1">
                      {p.name}
                    </h4>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                    <div>
                      <span className="text-xs font-black text-white">
                        {p.currency || '$'}{p.price}
                      </span>
                      <span className="text-[10px] text-slate-400"> / unit</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      MOQ: {p.moq || 1}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
              <Package className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <span>Catalog index synchronizing with verified global suppliers.</span>
            </div>
          )}
        </div>
      </section>

      {/* Security Architecture */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 lg:p-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographic Multi-Tenant Protection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Absolute Tenant Isolation & Zero Secret Leakage
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every database query strictly enforces PostgreSQL Row Level Security (RLS) linked to{' '}
              <code className="text-blue-300 font-mono">business_id</code>. Payment secrets and AI
              keys operate exclusively on audited server routes and are never bundled into client
              code.
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-3 gap-6 pt-6 border-t border-slate-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">PostgreSQL RLS Policies</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tenant records cannot be queried or updated across businesses.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Audited Server Gateways</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Stripe & Razorpay intents strictly resolved server-side with integer minor units.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Zero Simulated Data</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  All metrics, inquiries, and orders represent real authenticated system
                  transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Everything you need to know about operating on the VYRA network
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-white"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-blue-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-300 border-t border-slate-800/60 pt-3 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Launch CTA */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to Accelerate Your Global Trade?
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Join verified manufacturers, exporters, and procurement leaders on VYRA.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-6 py-3 rounded-2xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition shadow-lg shadow-black/10"
              >
                Create Enterprise Profile
              </button>
              <button
                type="button"
                onClick={() => onEnterApp('marketplace')}
                className="px-6 py-3 rounded-2xl bg-blue-800/60 hover:bg-blue-800 text-white font-bold text-sm border border-blue-400/30 transition"
              >
                Explore Marketplace
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VyraLogo size="sm" theme="dark" showTagline={false} />
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="text-[11px] text-slate-400 font-medium">
              {BRAND.tagline}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onEnterApp('marketplace')}
              className="hover:text-slate-300 transition"
            >
              Marketplace
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('rfq')}
              className="hover:text-slate-300 transition"
            >
              RFQs
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('website-builder')}
              className="hover:text-slate-300 transition"
            >
              Storefronts
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('launch-center')}
              className="hover:text-slate-300 transition"
            >
              Launch Center
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('settings')}
              className="hover:text-slate-300 transition"
            >
              Settings & API
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
