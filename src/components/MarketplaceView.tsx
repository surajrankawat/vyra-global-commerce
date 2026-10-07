import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Package,
  Building2,
  Globe,
  FileText,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Send,
  X,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Scale,
  Star,
  Layers,
  Award,
  Cpu,
  Truck,
  RotateCcw,
  Check,
  Tag,
} from 'lucide-react';
import { Product, Business, RFQ, ManufacturerProfile } from '../types';
import {
  fetchMarketplaceProducts,
  fetchMarketplaceSuppliers,
  fetchRFQs,
  createRFQ,
  fetchManufacturerProfiles,
} from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useCart } from '../context/CartContext';
import { ComparisonModal } from './marketplace/ComparisonModal';
import { ProductReviewsModal } from './marketplace/ProductReviewsModal';

interface MarketplaceViewProps {
  onRequestQuote?: (product: Product) => void;
  onOpenChatWithSeller?: (businessId: string, businessName: string) => void;
  initialTab?: 'all' | 'products' | 'wholesale' | 'manufacturers' | 'suppliers' | 'rfqs';
}

interface ParsedAiSearch {
  raw: string;
  keyword: string;
  quantity?: number;
  maxPrice?: number;
  country?: string;
  material?: string;
  category?: string;
  isAiParsed: boolean;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  onRequestQuote,
  onOpenChatWithSeller,
  initialTab = 'all',
}) => {
  const { currentBusiness, user } = useAuth();
  const { t } = useLanguage();
  const { addToCart, openCart } = useCart();

  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'wholesale' | 'manufacturers' | 'suppliers' | 'rfqs'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'moq-asc'>('relevance');

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Business[]>([]);
  const [manufacturers, setManufacturers] = useState<ManufacturerProfile[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Side-by-Side states
  const [isPostRfqModalOpen, setIsPostRfqModalOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Comparison tray
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // Reviews modal
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // New RFQ Form
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqCategory, setRfqCategory] = useState('Industrial & Machinery');
  const [rfqQty, setRfqQty] = useState(500);
  const [rfqUnit, setRfqUnit] = useState('pieces');
  const [rfqTargetPrice, setRfqTargetPrice] = useState(25);
  const [rfqCurrency, setRfqCurrency] = useState('USD');
  const [rfqDeliveryLocation, setRfqDeliveryLocation] = useState('Hamburg Port, Germany');
  const [rfqSpecs, setRfqSpecs] = useState('');
  const [rfqSubmitting, setRfqSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, sups, allRfqs, mfgs] = await Promise.all([
        fetchMarketplaceProducts(),
        fetchMarketplaceSuppliers(),
        fetchRFQs(),
        fetchManufacturerProfiles(),
      ]);
      setProducts(prods);
      setSuppliers(sups);
      setRfqs(allRfqs);
      setManufacturers(mfgs);
    } catch (err) {
      console.error('Error loading marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Natural Language AI Entity Extractor
  const parsedAiSearch = useMemo<ParsedAiSearch>(() => {
    const raw = searchQuery.trim();
    if (!raw) {
      return { raw: '', keyword: '', isAiParsed: false };
    }

    // Heuristic natural language regexes
    const underBudgetMatch = raw.match(/under\s+\$?([0-9,]+)/i);
    const maxPrice = underBudgetMatch ? parseFloat(underBudgetMatch[1].replace(/,/g, '')) : undefined;

    const qtyMatch = raw.match(/([0-9,]+)\s*(units|pcs|pieces|statues|meters|sq\s*ft|tons|kg)?/i);
    const quantity = qtyMatch ? parseInt(qtyMatch[1].replace(/,/g, ''), 10) : undefined;

    const knownCountries = ['India', 'United States', 'Germany', 'Italy', 'Vietnam', 'United Arab Emirates', 'Japan', 'Sweden', 'China'];
    const matchedCountry = knownCountries.find((c) => new RegExp(`\\b${c}\\b`, 'i').test(raw));

    const knownMaterials = ['marble', 'granite', 'stone', 'aluminum', 'timber', 'cotton', 'steel', 'brass', 'ceramic', 'titanium'];
    const matchedMaterial = knownMaterials.find((m) => new RegExp(`\\b${m}\\b`, 'i').test(raw));

    const isComplexQuery = Boolean(maxPrice || (quantity && quantity > 1) || matchedCountry || matchedMaterial);

    return {
      raw,
      keyword: raw,
      quantity,
      maxPrice,
      country: matchedCountry,
      material: matchedMaterial,
      isAiParsed: isComplexQuery,
    };
  }, [searchQuery]);

  // Comparison toggle
  const toggleComparison = (prod: Product) => {
    setComparisonProducts((prev) => {
      const exists = prev.some((p) => p.id === prod.id);
      if (exists) {
        return prev.filter((p) => p.id !== prod.id);
      }
      if (prev.length >= 4) {
        setToastMessage('Comparison limit reached (maximum 4 products).');
        setTimeout(() => setToastMessage(null), 3000);
        return prev;
      }
      return [...prev, prod];
    });
  };

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqTitle.trim() || !rfqSpecs.trim()) return;

    setRfqSubmitting(true);
    try {
      await createRFQ({
        business_id: currentBusiness?.id,
        buyer_user_id: user?.id,
        buyer_name: currentBusiness?.owner_name || user?.full_name || 'Commercial Buyer',
        buyer_company: currentBusiness?.name || 'International Importer',
        buyer_country: currentBusiness?.country || 'United States',
        buyer_email: currentBusiness?.email || user?.email,
        buyer_phone: currentBusiness?.phone,
        product_title: rfqTitle,
        category: rfqCategory,
        quantity: Number(rfqQty),
        unit: rfqUnit,
        target_price: Number(rfqTargetPrice) || undefined,
        currency: rfqCurrency,
        delivery_location: rfqDeliveryLocation,
        specifications: rfqSpecs,
        status: 'OPEN',
      });

      setRfqTitle('');
      setRfqSpecs('');
      setIsPostRfqModalOpen(false);
      setToastMessage('Your RFQ requirement was published to all qualified international manufacturers!');
      setTimeout(() => setToastMessage(null), 6000);
      await loadData();
    } catch (err: any) {
      console.error('Failed to create RFQ:', err);
    } finally {
      setRfqSubmitting(false);
    }
  };

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Natural Language AI match
        if (parsedAiSearch.isAiParsed) {
          if (parsedAiSearch.maxPrice && (p.price || 0) > parsedAiSearch.maxPrice) {
            return false;
          }
          if (parsedAiSearch.country && p.country_of_origin && !p.country_of_origin.toLowerCase().includes(parsedAiSearch.country.toLowerCase())) {
            return false;
          }
          if (parsedAiSearch.material && p.material && !p.material.toLowerCase().includes(parsedAiSearch.material.toLowerCase()) && !p.name.toLowerCase().includes(parsedAiSearch.material.toLowerCase())) {
            return false;
          }
        }

        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.material && p.material.toLowerCase().includes(q));

        const matchesCategory = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesCountry = selectedCountry === 'all' || (p.country_of_origin && p.country_of_origin.toLowerCase() === selectedCountry.toLowerCase());
        const matchesStock = !inStockOnly || (typeof p.stock_quantity === 'number' && p.stock_quantity > 0);

        return matchesSearch && matchesCategory && matchesCountry && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'moq-asc') return (a.moq || 0) - (b.moq || 0);
        return 0;
      });
  }, [products, searchQuery, parsedAiSearch, selectedCategory, selectedCountry, inStockOnly, sortBy]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(q) ||
        s.industry.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q);

      const matchesCountry = selectedCountry === 'all' || s.country.toLowerCase() === selectedCountry.toLowerCase();
      const matchesVerified = !verifiedOnly || !s.is_demo;
      return matchesSearch && matchesCountry && matchesVerified;
    });
  }, [suppliers, searchQuery, selectedCountry, verifiedOnly]);

  // Filtered RFQs
  const filteredRfqs = useMemo(() => {
    return rfqs.filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        r.product_title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.buyer_country.toLowerCase().includes(q)
      );
    });
  }, [rfqs, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-500/30 text-blue-300 text-xs font-bold">
            <Globe className="w-3.5 h-3.5" />
            <span>VYRA Global Commerce Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Source from Verified Manufacturers & Global Wholesalers
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Direct factory capacity matrices, instant B2C retail checkout, RFQ contract bidding, and trade-escrow guarantees across 180+ countries.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setIsPostRfqModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Post Sourcing Demand (RFQ)</span>
            </button>
            <button
              onClick={openCart}
              className="bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-xs px-4 py-2 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4 text-sky-400" />
              <span>View Shopping Cart</span>
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-800 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-xs">
        {/* Tabs Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Sourcing', count: filteredProducts.length + filteredSuppliers.length },
              { id: 'products', label: 'B2C Retail & Cart', count: filteredProducts.length },
              { id: 'wholesale', label: 'Wholesale & MOQ', count: filteredProducts.filter((p) => (p.moq || 1) > 1).length },
              { id: 'manufacturers', label: 'Factory Specs', count: manufacturers.length },
              { id: 'suppliers', label: 'Exporters & Stores', count: filteredSuppliers.length },
              { id: 'rfqs', label: 'RFQ Tenders', count: filteredRfqs.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAiMode(!isAiMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isAiMode
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>AI Search Engine</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={
                isAiMode
                  ? 'Ask AI: e.g. "I need 500 white marble statues from India under $10,000"'
                  : 'Search by product title, material, HS code, manufacturer, or country...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* AI Entity Chips */}
          {parsedAiSearch.isAiParsed && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>Extracted Parameters:</span>
              </span>
              {parsedAiSearch.quantity && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  Qty Target: {parsedAiSearch.quantity} units
                </span>
              )}
              {parsedAiSearch.maxPrice && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Max Budget: ${parsedAiSearch.maxPrice.toLocaleString()}
                </span>
              )}
              {parsedAiSearch.country && (
                <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                  Origin: {parsedAiSearch.country}
                </span>
              )}
              {parsedAiSearch.material && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  Material: {parsedAiSearch.material}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Advanced Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Natural Stone & Marble">Natural Stone & Marble</option>
            <option value="Textiles & Apparel">Textiles & Apparel</option>
            <option value="Machinery & Tools">Machinery & Tools</option>
            <option value="Chemicals & Minerals">Chemicals & Minerals</option>
            <option value="Electronics & Components">Electronics & Components</option>
            <option value="Agriculture & Food">Agriculture & Food</option>
          </select>

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Origins</option>
            <option value="India">India</option>
            <option value="United States">United States</option>
            <option value="Germany">Germany</option>
            <option value="Italy">Italy</option>
            <option value="Vietnam">Vietnam</option>
            <option value="United Arab Emirates">UAE</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="moq-asc">Lowest MOQ First</option>
          </select>

          <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>In-Stock Only</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Verified Enterprises Only</span>
          </label>
        </div>
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Querying real marketplace records...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. PRODUCTS & WHOLESALE LISTINGS */}
          {(activeTab === 'all' || activeTab === 'products' || activeTab === 'wholesale') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Marketplace Products & Wholesale Catalogs ({filteredProducts.length})</span>
                </h2>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  No products matching your search criteria. Broaden your search or post an RFQ requirement.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => {
                    const isCompared = comparisonProducts.some((cp) => cp.id === product.id);

                    return (
                      <div
                        key={product.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
                      >
                        <div className="p-4 space-y-3">
                          {/* Image Thumbnail & Badges */}
                          <div className="h-44 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center relative">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-10 h-10 text-slate-300" />
                            )}
                            <span className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              MOQ: {product.moq || 1} {product.unit || 'units'}
                            </span>
                            {typeof product.stock_quantity === 'number' && (
                              <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Made-to-Order'}
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                                {product.category || 'General'}
                              </span>
                              {/* Reviews link */}
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewProduct(product);
                                  setIsReviewModalOpen(true);
                                }}
                                className="flex items-center gap-1 text-[11px] text-amber-500 font-bold hover:underline"
                                title="Read customer reviews"
                              >
                                <Star className="w-3 h-3 fill-current" />
                                <span>4.9 (18)</span>
                              </button>
                            </div>

                            <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                              {product.description || 'Verified manufacturer specification.'}
                            </p>
                          </div>

                          {/* Technical Specs */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                            {product.country_of_origin && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Origin:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{product.country_of_origin}</span>
                              </div>
                            )}
                            {product.material && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Material:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{product.material}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer: Price & Interactive Actions */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-black text-slate-900 dark:text-white">
                                {product.price && product.price > 0 ? `$${product.price.toLocaleString()} ${product.currency || 'USD'}` : 'Quote on request'}
                              </div>
                              <span className="text-[10px] text-slate-400">Ex-Factory Unit Price</span>
                            </div>

                            {/* Compare checkbox button */}
                            <button
                              type="button"
                              onClick={() => toggleComparison(product)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                                isCompared
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500'
                              }`}
                              title="Compare specs with other items"
                            >
                              <Scale className="w-3 h-3" />
                              <span>{isCompared ? 'Compared' : 'Compare'}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Instant B2C Add to Cart */}
                            <button
                              type="button"
                              onClick={() => {
                                addToCart(product, 1);
                                setToastMessage(`Added "${product.name}" to shopping cart.`);
                                setTimeout(() => setToastMessage(null), 3000);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </button>

                            {/* B2B Quote Request */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onRequestQuote) {
                                  onRequestQuote(product);
                                } else {
                                  setSelectedProductDetails(product);
                                }
                              }}
                              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors"
                              title="Request Wholesale Quotation"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. FACTORY CAPABILITIES & MANUFACTURERS SPECIFICATIONS */}
          {(activeTab === 'all' || activeTab === 'manufacturers') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>Verified Factory Facilities & OEM/ODM Specifications ({manufacturers.length})</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {manufacturers.map((mfg) => (
                  <div
                    key={mfg.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{mfg.factory_name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                              OEM / ODM
                            </span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Floor Area: {mfg.factory_size_sqm.toLocaleString()} m² • {mfg.production_lines} Automated Lines
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 shrink-0">
                          {mfg.daily_capacity}
                        </span>
                      </div>

                      {/* Capabilities pills */}
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {mfg.customization_services.map((svc) => (
                          <span key={svc} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            ✓ {svc}
                          </span>
                        ))}
                      </div>

                      {/* Machinery details */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Machinery & Inspection Rig
                        </p>
                        <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                          {mfg.machinery_equipment.slice(0, 3).map((item, idx) => (
                            <li key={idx} className="truncate">• {item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Certifications & Export Routes */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[11px] font-semibold text-slate-500">Audited Standards:</span>
                        {mfg.certifications.map((c) => (
                          <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Lead Time: <strong className="text-slate-800 dark:text-slate-200">{mfg.lead_time_days} days</strong> • MOQ: {mfg.moq}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenChatWithSeller) {
                            onOpenChatWithSeller(mfg.business_id, mfg.factory_name);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Factory Technical Consultation</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. SUPPLIERS & EXPORTERS */}
          {(activeTab === 'all' || activeTab === 'suppliers') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Verified Manufacturers & Exporters ({filteredSuppliers.length})</span>
                </h2>
              </div>

              {filteredSuppliers.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  No suppliers matching criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-white font-black text-sm">
                              {supplier.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{supplier.name}</span>
                                {!supplier.is_demo && (
                                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                )}
                              </h3>
                              <span className="text-[10px] text-slate-500">
                                {supplier.city ? `${supplier.city}, ` : ''}{supplier.country}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {supplier.business_type}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                          {supplier.description || `${supplier.industry} manufacturer with verified export capabilities.`}
                        </p>

                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          <span className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-medium">
                            {supplier.industry}
                          </span>
                          {supplier.export_countries && supplier.export_countries.length > 0 && (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                              Exports to: {supplier.export_countries.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified Store</span>
                        </span>

                        <button
                          onClick={() => {
                            if (onOpenChatWithSeller) {
                              onOpenChatWithSeller(supplier.id, supplier.name);
                            }
                          }}
                          className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Contact Store</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. RFQ DEMANDS HUB */}
          {(activeTab === 'all' || activeTab === 'rfqs') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Public RFQ Buying Demands ({filteredRfqs.length})</span>
                </h2>
                <button
                  onClick={() => setIsPostRfqModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post RFQ</span>
                </button>
              </div>

              {filteredRfqs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  No active RFQ demands posted yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRfqs.map((rfq) => (
                    <div
                      key={rfq.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                              {rfq.category}
                            </span>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                              {rfq.product_title}
                            </h3>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {rfq.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3">
                          {rfq.specifications}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Required Quantity</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{rfq.quantity} {rfq.unit}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Target Price</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {rfq.target_price ? `${rfq.target_price} ${rfq.currency}` : 'Negotiable'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-400 block text-[10px]">Destination</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">{rfq.delivery_location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          From: {rfq.buyer_country}
                        </span>

                        <button
                          onClick={() => {
                            setToastMessage(`Proposal initiated for ${rfq.buyer_name} (${rfq.buyer_company || 'Trade Buyer'}). You can generate and send a formal Quotation under Quotations.`);
                            setTimeout(() => setToastMessage(null), 5000);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Submit Proposal</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Comparison Tray */}
      {comparisonProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold">
              Comparing {comparisonProducts.length} {comparisonProducts.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsComparisonModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
            >
              Open Comparison Matrix
            </button>
            <button
              type="button"
              onClick={() => setComparisonProducts([])}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Clear comparison"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      <ComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        products={comparisonProducts}
        onRemoveProduct={(id) => setComparisonProducts((prev) => prev.filter((p) => p.id !== id))}
        onClearAll={() => {
          setComparisonProducts([]);
          setIsComparisonModalOpen(false);
        }}
        onRequestQuote={(prod) => {
          setIsComparisonModalOpen(false);
          if (onRequestQuote) onRequestQuote(prod);
        }}
        onOpenChatWithSeller={(id, name) => {
          setIsComparisonModalOpen(false);
          if (onOpenChatWithSeller) onOpenChatWithSeller(id, name);
        }}
      />

      {/* Customer Product Reviews Modal */}
      <ProductReviewsModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewProduct(null);
        }}
        product={reviewProduct}
      />

      {/* POST RFQ MODAL */}
      {isPostRfqModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Post Buying Requirement (RFQ)</h3>
              </div>
              <button
                onClick={() => setIsPostRfqModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRfq} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Product / Requirement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Polished Statuario White Marble Slabs 20mm"
                  value={rfqTitle}
                  onChange={(e) => setRfqTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Category</label>
                  <select
                    value={rfqCategory}
                    onChange={(e) => setRfqCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Natural Stone & Marble">Natural Stone & Marble</option>
                    <option value="Textiles & Apparel">Textiles & Apparel</option>
                    <option value="Machinery & Tools">Machinery & Tools</option>
                    <option value="Chemicals & Minerals">Chemicals & Minerals</option>
                    <option value="Electronics & Components">Electronics & Components</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Delivery Destination *</label>
                  <input
                    type="text"
                    required
                    value={rfqDeliveryLocation}
                    onChange={(e) => setRfqDeliveryLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={rfqQty}
                    onChange={(e) => setRfqQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Unit</label>
                  <input
                    type="text"
                    value={rfqUnit}
                    onChange={(e) => setRfqUnit(e.target.value)}
                    placeholder="sq ft, pcs, tons"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Target Price (Unit)</label>
                  <input
                    type="number"
                    value={rfqTargetPrice}
                    onChange={(e) => setRfqTargetPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Detailed Technical Specifications & Quality Mandates *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail thickness tolerance, packaging requirements, test reports needed, and shipping timeline..."
                  value={rfqSpecs}
                  onChange={(e) => setRfqSpecs(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPostRfqModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rfqSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                >
                  {rfqSubmitting ? 'Publishing...' : 'Publish to Global Suppliers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
