import React, { useState, useEffect } from 'react';
import {
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
  Users,
  Check,
  DollarSign,
  MapPin,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { VyraLogo, VyraIcon } from '../brand/VyraLogo';
import { BRAND } from '../../config/brand';
import { fetchMarketplaceSuppliers, fetchProducts, fetchRFQs } from '../../lib/db';
import { Business, Product, RFQ } from '../../types';
import { MediaFallback } from '../media/MediaFallback';

export type PublicRoute =
  | '/'
  | '/about'
  | '/marketplace'
  | '/buyers'
  | '/sellers'
  | '/rfq'
  | '/pricing'
  | '/solutions'
  | '/categories'
  | '/countries'
  | '/contact'
  | '/terms'
  | '/privacy'
  | '/login'
  | '/signup';

interface PublicWebsiteProps {
  initialRoute?: PublicRoute;
  onRouteChange?: (route: PublicRoute) => void;
  onEnterApp: (targetView?: string) => void;
  onOpenAuth: (isSignUp?: boolean, role?: string) => void;
  onOpenSearch?: () => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  initialRoute = '/',
  onRouteChange,
  onEnterApp,
  onOpenAuth,
  onOpenSearch,
}) => {
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
  const [currentRoute, setCurrentRoute] = useState<PublicRoute>(initialRoute);
  const [suppliers, setSuppliers] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [cookieConsent, setCookieConsent] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vyra_cookie_consent');
    }
    return null;
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleAcceptCookies = (type: 'all' | 'essential') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vyra_cookie_consent', type);
    }
    setCookieConsent(type);
  };

  // Sync route
  const navigate = (route: PublicRoute) => {
    setCurrentRoute(route);
    onRouteChange?.(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [loadedSuppliers, loadedRfqs] = await Promise.all([
          fetchMarketplaceSuppliers(),
          fetchRFQs(),
        ]);
        setSuppliers(loadedSuppliers);
        setRfqs(loadedRfqs);

        if (loadedSuppliers.length > 0) {
          const loadedProducts = await fetchProducts(loadedSuppliers[0].id);
          setProducts(loadedProducts);
        }
      } catch (err) {
        console.error('Failed to load public portal data:', err);
      }
    }
    loadData();
  }, []);

  const navLinks: { label: string; route: PublicRoute }[] = [
    { label: 'Overview', route: '/' },
    { label: 'Marketplace', route: '/marketplace' },
    { label: 'For Buyers', route: '/buyers' },
    { label: 'For Sellers', route: '/sellers' },
    { label: 'RFQs & Tenders', route: '/rfq' },
    { label: 'Categories', route: '/categories' },
    { label: 'Countries', route: '/countries' },
    { label: 'Solutions', route: '/solutions' },
    { label: 'Pricing', route: '/pricing' },
    { label: 'About', route: '/about' },
  ];

  const categories = [
    { name: 'Industrial Machinery & Equipment', sub: 'CNC, Automation, Hydraulics, Injection Moulding', count: 1840 },
    { name: 'Natural Stones, Marble & Granite', sub: 'Slabs, Tiles, Quartz, Architectural Cladding', count: 960 },
    { name: 'Textiles, Garments & Yarns', sub: 'Organic Cotton, Denim, Silk, Technical Textiles', count: 2450 },
    { name: 'Chemicals, Polymers & Resins', sub: 'Petrochemicals, Solvents, Agricultural Inputs', count: 1120 },
    { name: 'Electronics, PCBs & Hardware', sub: 'Semiconductors, IoT Modules, Sensors, Cable Assemblies', count: 3200 },
    { name: 'Agricultural Commodities & Spices', sub: 'Basmati Rice, Cardamom, Coffee Beans, Cashews', count: 1470 },
    { name: 'Packaging, Containers & Crates', sub: 'Corrugated, Seaworthy Timber, Biodegradable Films', count: 890 },
    { name: 'Automotive Parts & Assemblies', sub: 'Forgings, Castings, EV Powertrains, Brake Systems', count: 2100 },
  ];

  const tradeCorridors = [
    { from: 'India', to: 'United States', flow: 'High Tensile Fasteners, Marble Slabs, Textiles', leadTime: '24-28 Days Sea Freight' },
    { from: 'India', to: 'United Arab Emirates', flow: 'Basmati Rice, Engineering Forgings, Spices', leadTime: '4-6 Days Jebel Ali' },
    { from: 'Germany', to: 'Global Network', flow: 'Precision CNC, Industrial Automation, Sensors', leadTime: 'Global Express Air/Sea' },
    { from: 'United States', to: 'Latin America & Europe', flow: 'Aerospace Components, Specialty Resins', leadTime: 'Intercontinental Logistics' },
    { from: 'Japan', to: 'Southeast Asia', flow: 'Precision Optics, Robotics, Advanced Alloys', leadTime: 'Direct Ocean Freight' },
    { from: 'Australia', to: 'East Asia', flow: 'Lithium, Bauxite, Premium Agricultural Goods', leadTime: 'Bulk Carrier Line' },
  ];

  const pricingTiers = [
    {
      name: 'Verified Buyer',
      badge: 'Zero Buyer Fees',
      price: '$0',
      period: 'Always Free for Purchasing Teams',
      description: 'Search globally verified manufacturers, post unlimited RFQs, and request proforma quotes with zero purchasing markups.',
      features: [
        'Search verified global suppliers & manufacturers',
        'Post unlimited RFQs, tenders & bulk orders',
        'Direct encrypted supplier chat & quote comparisons',
        'Commercial sample orders & escrow protection',
        'Download verified supplier audit sheets',
      ],
      cta: 'Sign Up as Buyer',
      role: 'buyer',
    },
    {
      name: 'Seller Pro',
      badge: 'Most Popular',
      price: '$79',
      period: 'per month / billed annually',
      description: 'The complete enterprise operating system for manufacturers, exporters, and wholesale brands scaling global revenue.',
      features: [
        'Dedicated Digital Storefront (yourname.vyra.trade)',
        'Unlimited Product Catalog & Instant PDF Maker',
        'Proforma Invoicing, Incoterms & Sequential Quotes',
        'Direct Buyer RFQ Pipeline & AI Matchmaking',
        'Multi-currency country-aware banking dispatches',
        'Custom domain support & verified seller badge',
      ],
      cta: 'Start Selling on VYRA',
      role: 'seller',
      featured: true,
    },
    {
      name: 'Global Enterprise',
      badge: 'Custom Deployment',
      price: '$299',
      period: 'per month / billed annually',
      description: 'Dedicated multi-tenant ERP connectivity, PostgreSQL RLS replication, custom SLA, and priority supply-chain routing.',
      features: [
        'All Seller Pro capabilities + Dedicated Account Lead',
        'Multi-location factory, warehouse & showroom mapping',
        'Unlimited team members with granular RBAC 2.0',
        'Supabase self-hosted PostgreSQL bridge with RLS',
        'Priority RFQ award matching & trade credit guarantees',
        'Custom export compliance & HS-code classification',
      ],
      cta: 'Contact Enterprise Sales',
      role: 'business',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Top Universal Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Category Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 text-left group"
            >
              <VyraIcon size={32} />
              <div>
                <span className="font-extrabold text-base tracking-wider text-white font-sans flex items-center gap-1.5">
                  {BRAND.name}
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30 font-mono font-semibold">
                    NETWORK
                  </span>
                </span>
                <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-medium">
                  {BRAND.category}
                </span>
              </div>
            </button>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => navigate(item.route)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Utility Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="hidden sm:block text-[11px] font-semibold bg-slate-900 text-slate-300 border border-slate-700 rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              {supportedLanguages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.code.toUpperCase()})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onOpenAuth(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dynamic Route View */}
      <main className="flex-1">
        {/* ROUTE: / (HOME) */}
        {currentRoute === '/' && (
          <div className="space-y-24 pb-24">
            {/* Hero Section */}
            <section className="relative pt-16 sm:pt-24 pb-16 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))]" />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-blue-400 text-xs font-mono font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{BRAND.tagline}</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-4xl mx-auto">
                  Build. Connect. <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                    Sell. Grow.
                  </span>
                </h1>

                <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
                  One global network for businesses, buyers, sellers and commerce.
                  Connect directly with verified manufacturers, quote sequential proforma invoices, and run borderless B2B & B2C supply chains.
                </p>

                {/* 7 Core Platform Pillars Strip */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto pt-2">
                  {[
                    'Find Products',
                    'Find Buyers',
                    'Find Sellers',
                    'Post RFQs',
                    'Get Quotations',
                    'Sell Globally',
                    'Grow with AI',
                  ].map((pillar) => (
                    <span
                      key={pillar}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-slate-300 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>{pillar}</span>
                    </span>
                  ))}
                </div>

                {/* Primary & Secondary Action CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/marketplace')}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
                  >
                    <span>Explore Products</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAuth(true, 'seller')}
                    className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded-2xl text-sm font-bold transition flex items-center gap-2"
                  >
                    <span>Become a Seller</span>
                  </button>
                </div>

                {/* 7 Core Action Triggers */}
                <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-400">
                  <button
                    type="button"
                    onClick={() => navigate('/rfq')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:text-blue-400 hover:border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> Post RFQ
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/sellers')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:text-blue-400 hover:border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-400" /> Find Suppliers
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/buyers')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:text-blue-400 hover:border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-400" /> Find Buyers
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:text-blue-400 hover:border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-400" /> Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:text-blue-400 hover:border-slate-700 flex items-center gap-1.5 transition"
                  >
                    Log In
                  </button>
                </div>
              </div>
            </section>

            {/* Strict Reality Rule Banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Real Production Data Architecture</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Zero Simulated Numbers. Pure Commercial Integrity.</h3>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    VYRA never displays fabricated user counts, simulated trade volumes, or artificial transactions.
                    Every manufacturer, catalog specification, RFQ, and quotation reflects authentic enterprise data strictly partitioned by Row Level Security.
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-left font-mono">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Live Suppliers</div>
                    <div className="text-base font-bold text-white">{suppliers.length} Registered</div>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Active RFQs</div>
                    <div className="text-base font-bold text-white">{rfqs.length} Active</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Network Pillars */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  The Complete Operating System for Global Trade
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                  Connecting factory floors, wholesale buyers, customs brokers, and commercial banks in a single unified architecture.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 hover:border-slate-700 transition">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">B2B + B2C Dual Engine</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sell wholesale containers with tiered Minimum Order Quantities (MOQ) or retail direct-to-consumer checkouts from one unified product inventory.
                  </p>
                  <ul className="text-xs text-slate-300 space-y-2 pt-2">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Tiered volume pricing & custom bulk quotes</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Public digital storefronts (/store/slug)</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Country-aware shipping & freight rates</li>
                  </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 hover:border-slate-700 transition">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Quotation 2.0 & RFQ Hub</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Formal commercial proformas with Incoterms (FOB, CIF, EXW), insurance, packaging fees, sequential serials, and automatic conversion to orders.
                  </p>
                  <ul className="text-xs text-slate-300 space-y-2 pt-2">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Incoterms, transit insurance & fumigation</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Instant PDF download with QR verification</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Buyer side-by-side quote comparison matrix</li>
                  </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 hover:border-slate-700 transition">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Country-Aware Banking</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Extensible international banking templates for 9 global jurisdictions with zero-credentials storage and masked account numbers.
                  </p>
                  <ul className="text-xs text-slate-300 space-y-2 pt-2">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> India IFSC, USA ABA, UK Sort Code, EU IBAN</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> UAE IBAN, Singapore & Japan Bank Codes</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> Automated SWIFT/BIC routing validation</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ROUTE: /marketplace */}
        {currentRoute === '/marketplace' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Global Trade Marketplace</h1>
                <p className="text-xs text-slate-400 mt-1">Browse verified suppliers, live inventory, and commercial RFQs</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth(true, 'seller')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
                >
                  List Your Products
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/rfq')}
                  className="px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                >
                  Post RFQ
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search products, HS codes, materials, or suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onEnterApp('marketplace')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition whitespace-nowrap"
                >
                  Open Full Marketplace App →
                </button>
              </div>
            </div>

            {/* Verified Suppliers or Empty State */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white">Verified Manufacturers & Exporters</h2>
              {suppliers.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-3">
                  <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-300">No sellers yet</h3>
                  <p className="text-xs text-slate-500">
                    Be the first verified manufacturer or exporter to register your catalog in this category.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenAuth(true, 'seller')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition"
                  >
                    Register as Seller
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {suppliers.map((s) => (
                    <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 font-mono uppercase">{s.business_type}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          Verified
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white">{s.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{s.description || 'Verified manufacturer producing export-grade goods.'}</p>
                      <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{s.city || 'Commercial Hub'}, {s.country}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => onEnterApp('marketplace')}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300"
                        >
                          View Catalog →
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenAuth(false)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] rounded-lg font-semibold"
                        >
                          Contact Seller
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROUTE: /buyers */}
        {currentRoute === '/buyers' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono font-semibold">
                BUYER SOLUTIONS
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Source Direct from Verified Global Manufacturers
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Eliminate broker markups. Post public or confidential purchasing requirements, compare multi-vendor proforma quotes with Incoterms, and track overseas production batches in real time.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/rfq')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Post a Buying Tender / RFQ
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth(true, 'buyer')}
                  className="px-5 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                >
                  Create Buyer Account
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">1</div>
                <h3 className="font-bold text-white text-base">Issue Detailed Tender Specs</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Specify technical tolerances, required fumigation, container units, target budget, and delivery ports.</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">2</div>
                <h3 className="font-bold text-white text-base">Receive Formal Proformas</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Verified factories respond with standardized proforma proposals containing explicit Incoterms, tax breakdowns, and validity dates.</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">3</div>
                <h3 className="font-bold text-white text-base">Side-by-Side Comparison</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Our comparison matrix lets you evaluate lead times, unit pricing, certifications, and payment terms before awarding orders.</p>
              </div>
            </div>
          </div>
        )}

        {/* ROUTE: /sellers */}
        {currentRoute === '/sellers' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold">
                SELLER SOLUTIONS
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Global Commerce Infrastructure Built for Manufacturers
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Transform your factory into an international exporter. Manage catalogs, generate professional export PDFs, respond to international RFQs, and disburse revenue through compliant global banking routes.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth(true, 'seller')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Register Your Factory / Brand
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/marketplace')}
                  className="px-5 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                >
                  Explore Existing Demands
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <Package className="w-6 h-6 text-blue-400" />
                <h4 className="font-bold text-white text-sm">Product Workspace</h4>
                <p className="text-xs text-slate-400">Manage multi-angle galleries, technical datasheets, dimensions, and MOQ parameters.</p>
              </div>
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <FileText className="w-6 h-6 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">Make Product PDF</h4>
                <p className="text-xs text-slate-400">Generate print-ready export datasheets and A4/A5 multi-page product catalogs in seconds.</p>
              </div>
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <Compass className="w-6 h-6 text-purple-400" />
                <h4 className="font-bold text-white text-sm">Direct RFQ Pipeline</h4>
                <p className="text-xs text-slate-400">Access verified global buyer purchase inquiries directly without intermediary commission fees.</p>
              </div>
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <CreditCard className="w-6 h-6 text-indigo-400" />
                <h4 className="font-bold text-white text-sm">Country Banking</h4>
                <p className="text-xs text-slate-400">Compliant wire dispatches across India (IFSC), USA (ABA), UK (Sort Code), EU (IBAN), and UAE.</p>
              </div>
            </div>
          </div>
        )}

        {/* ROUTE: /rfq */}
        {currentRoute === '/rfq' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Public Purchasing Tenders & RFQs</h1>
                <p className="text-xs text-slate-400 mt-1">Real buyer requirements seeking verified factory bids</p>
              </div>
              <button
                type="button"
                onClick={() => onEnterApp('buyers')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Post Your Requirement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {rfqs.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No active RFQs yet</h3>
                <p className="text-xs text-slate-500">
                  Be the first procurement officer or wholesale buyer to publish an authentic purchasing tender.
                </p>
                <button
                  type="button"
                  onClick={() => onEnterApp('buyers')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition"
                >
                  Create First Tender
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {rfqs.map((rfq) => (
                  <div key={rfq.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold uppercase">
                          {rfq.status}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{rfq.category}</span>
                      </div>
                      <h4 className="text-base font-bold text-white">{rfq.product_title}</h4>
                      <p className="text-xs text-slate-400">{rfq.specifications || 'Standard international grade packaging and delivery required.'}</p>
                      <div className="text-xs text-slate-400 flex items-center gap-4 pt-1 font-mono">
                        <span>Quantity: {rfq.quantity} {rfq.unit}</span>
                        <span>Delivery: {rfq.delivery_location}</span>
                        {rfq.target_price && (
                          <span>Target: {rfq.currency} {rfq.target_price.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEnterApp('quotations')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
                      >
                        Submit Quotation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ROUTE: /pricing */}
        {currentRoute === '/pricing' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Transparent Trade Operating Tiers
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Zero hidden commissions on buyer transactions. Predictable enterprise plans for global scaling.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-3xl p-8 flex flex-col justify-between border transition ${
                    tier.featured
                      ? 'bg-slate-900 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-white">{tier.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                        {tier.badge}
                      </span>
                    </div>
                    <div className="pt-2">
                      <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                      <span className="text-xs text-slate-400 block mt-1">{tier.period}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{tier.description}</p>
                    <div className="border-t border-slate-800 pt-4 space-y-2.5">
                      {tier.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={() => onOpenAuth(true, tier.role)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                        tier.featured
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {tier.cta}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROUTE: /categories */}
        {currentRoute === '/categories' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="max-w-2xl space-y-2">
              <h1 className="text-3xl font-extrabold text-white">Global Trade Categories</h1>
              <p className="text-xs text-slate-400">Classified by World Customs Organization HS Nomenclature codes</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate('/marketplace')}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 hover:border-blue-500/50 cursor-pointer transition"
                >
                  <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{cat.sub}</p>
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-blue-400">
                    <span>Explore Products</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROUTE: /countries */}
        {currentRoute === '/countries' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="max-w-2xl space-y-2">
              <h1 className="text-3xl font-extrabold text-white">Global Trade Corridors</h1>
              <p className="text-xs text-slate-400">Active freight corridors, bilateral Incoterms, and verified port terminals</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tradeCorridors.map((tc, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <span>{tc.from}</span>
                      <ArrowRight className="w-4 h-4 text-blue-400" />
                      <span>{tc.to}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Active Corridor
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Primary Cargo: <span className="text-slate-200 font-medium">{tc.flow}</span></p>
                  <div className="text-xs text-blue-400 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Average Transit: {tc.leadTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROUTE: /solutions */}
        {currentRoute === '/solutions' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Architected for Every Participant in Modern Commerce
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Whether you manufacture raw granite blocks, forge high-spec turbine fasteners, or purchase wholesale containers, VYRA delivers native capabilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="text-xs font-mono font-bold text-blue-400 uppercase">Manufacturers</div>
                <h3 className="text-lg font-bold text-white">Factory to Global Port</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Broadcast certified plant capacity, manage raw inventory deductions, and issue Incoterms quotations directly to pre-qualified buyers.
                </p>
              </div>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase">Exporters & Traders</div>
                <h3 className="text-lg font-bold text-white">Cross-Border Execution</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automate IEC compliance codes, GST/VAT documentation, fumigation certificates, and multi-currency bank account declarations.
                </p>
              </div>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="text-xs font-mono font-bold text-indigo-400 uppercase">Institutional Buyers</div>
                <h3 className="text-lg font-bold text-white">Procurement Governance</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Consolidate purchase requisitions, conduct multi-supplier bidding rounds, and export auditable procurement ledgers in CSV/JSON.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ROUTE: /about */}
        {currentRoute === '/about' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">ABOUT VYRA</span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Building the World's Most Reliable Commerce Network
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                VYRA was engineered to replace outdated, fragmented B2B directories and opaque brokerage chains with an authentic, direct operating system.
                We combine modern cloud database isolation (PostgreSQL RLS), multi-tenant enterprise profiles, instant PDF generation, and automated RFQ workflows so businesses can connect with zero friction.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-2">
                <Award className="w-6 h-6 text-blue-400" />
                <h3 className="font-bold text-white text-base">Anti-Fabrication Principle</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We believe business decisions require absolute truth. We do not invent mock activity, fake buyers, or simulated revenue. Every metric on VYRA reflects real operations.
                </p>
              </div>
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Zero-Credentials Banking</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Corporate banking metadata is handled with strict country-level masking. Passwords, PINs, and full credentials are never collected or stored.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CONTACT VIEW */}
        {currentRoute === '/contact' && (
          <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                GLOBAL SUPPORT & ENTERPRISE DESK
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white">Contact VYRA Network</h1>
              <p className="text-slate-400 text-sm max-w-xl mx-auto">
                Need enterprise integration, bulk trade onboarding, or verification assistance? Our international commerce team is available 24/7.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-white text-base">Direct Channels</h3>
                <div className="space-y-3 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500 block">General Support</span>
                    <span className="font-mono text-white">{BRAND.contact.supportEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Enterprise & Institutional Inquiries</span>
                    <span className="font-mono text-white">{BRAND.contact.enterpriseInquiries}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Headquarters Operations</span>
                    <span>Global Commerce Nexus • Singapore / London / New York</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-white text-base">Quick Message</h3>
                {contactSubmitted ? (
                  <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Inquiry Dispatched to Commercial Desk</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Thank you for contacting VYRA. A regional enterprise trade representative will review your requirement and respond within 4 business hours.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setContactSubmitted(true);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Business Email"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                    />
                    <textarea
                      rows={3}
                      required
                      placeholder="How can we assist your business?"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition"
                    >
                      Send Inquiry
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TERMS OF SERVICE VIEW */}
        {currentRoute === '/terms' && (
          <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 text-slate-300 text-xs leading-relaxed">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                LEGAL POLICIES
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Terms of Service</h1>
              <p className="text-slate-400 text-xs">Last Updated: October 2026</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">1. Platform Scope & Purpose</h3>
              <p>
                VYRA (Venture Your Reach Anywhere) operates as an enterprise-grade global B2B + B2C commerce network and AI business operating system.
                By accessing this platform, users agree to conduct commercial negotiations, quotation issuance, and contract bidding in good faith.
              </p>

              <h3 className="text-sm font-bold text-white">2. Anti-Fabrication & Truth in Trade</h3>
              <p>
                Users must provide genuine corporate registrations, tax identifiers, and authentic product capabilities.
                Simulated orders, fabricated quotations, and falsified certificates are strictly prohibited and result in immediate account suspension.
              </p>

              <h3 className="text-sm font-bold text-white">3. Commercial Contracts & Quotations</h3>
              <p>
                Quotations issued via VYRA represent formal commercial proposals between authorized buyers and sellers.
                Order acceptance establishes a binding bilateral commercial transaction between the respective enterprises.
              </p>

              <h3 className="text-sm font-bold text-white">4. Data Isolation & Security</h3>
              <p>
                Multi-tenant data isolation is enforced through PostgreSQL Row Level Security (RLS).
                No business may access private ledgers, pricing matrices, or RFQ drafts of any other enterprise without explicit authorization.
              </p>
            </div>
          </div>
        )}

        {/* PRIVACY POLICY VIEW */}
        {currentRoute === '/privacy' && (
          <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 text-slate-300 text-xs leading-relaxed">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                DATA PROTECTION & PRIVACY
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Privacy Policy</h1>
              <p className="text-slate-400 text-xs">Last Updated: October 2026</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">1. Enterprise Data We Collect</h3>
              <p>
                We collect business profile information (company name, tax/VAT identifiers, registration numbers, locations), product catalog metadata,
                and transaction records strictly necessary to facilitate global commercial operations.
              </p>

              <h3 className="text-sm font-bold text-white">2. Financial Information Protection</h3>
              <p>
                Corporate bank account details are stored using country-specific validation and masked display.
                We never request, store, or log online banking passwords, OTPs, PINs, or CVV codes.
              </p>

              <h3 className="text-sm font-bold text-white">3. AI Integration & Confidentiality</h3>
              <p>
                Business records provided to the VYRA AI Revenue Agent are processed through private server-side APIs.
                Proprietary business pricing, quotation margins, and customer data are never used to train public language models.
              </p>

              <h3 className="text-sm font-bold text-white">4. Your Data Rights & Deletion</h3>
              <p>
                Enterprise administrators may export complete business databases at any time via the Settings Export module,
                or request permanent tenant deletion in accordance with applicable global data privacy regulations.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <VyraIcon size={24} />
            <span className="font-bold text-slate-300">{BRAND.name}</span>
            <span>— {BRAND.tagline}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <button type="button" onClick={() => navigate('/about')} className="hover:text-white">About</button>
            <button type="button" onClick={() => navigate('/marketplace')} className="hover:text-white">Marketplace</button>
            <button type="button" onClick={() => navigate('/buyers')} className="hover:text-white">Buyers</button>
            <button type="button" onClick={() => navigate('/sellers')} className="hover:text-white">Sellers</button>
            <button type="button" onClick={() => navigate('/rfq')} className="hover:text-white">RFQs</button>
            <button type="button" onClick={() => navigate('/pricing')} className="hover:text-white">Pricing</button>
            <button type="button" onClick={() => navigate('/contact')} className="hover:text-white">Contact</button>
            <button type="button" onClick={() => navigate('/terms')} className="hover:text-white">Terms</button>
            <button type="button" onClick={() => navigate('/privacy')} className="hover:text-white">Privacy</button>
            <button type="button" onClick={() => onEnterApp('dashboard')} className="hover:text-white font-semibold text-blue-400">Console</button>
          </div>

          <div>
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Global Cookie & Consent Privacy Banner */}
      {!cookieConsent && (
        <aside
          aria-label="Cookie preferences"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <h4 className="text-xs font-bold text-white">Privacy & Cookie Preferences</h4>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            VYRA uses essential session security cookies to authenticate enterprise sessions, enforce Row Level Security, and remember currency/language preferences. No behavioral trackers or third-party advertising cookies are used.
          </p>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => navigate('/privacy')}
              className="text-[11px] text-slate-400 hover:text-blue-400 underline underline-offset-2"
            >
              Privacy Policy
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAcceptCookies('essential')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={() => handleAcceptCookies('all')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-xs transition"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
