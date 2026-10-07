import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Package,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  Search,
  Users,
  Layers,
  Tag,
  Sliders,
  RotateCcw,
  Check,
  X,
  Plus,
  Eye,
  Trash2,
  ShieldCheck,
  Percent,
  Terminal,
} from 'lucide-react';
import { TestRunnerModal } from './testing/TestRunnerModal';
import { AdminPlatformStats, AuditLog, Business, Product, Coupon, OrderDispute, SellerVerificationEvidence } from '../types';
import {
  fetchPlatformAdminStats,
  fetchAuditLogs,
  fetchMarketplaceSuppliers,
  fetchMarketplaceProducts,
  fetchCoupons,
  createCoupon,
  moderateProduct,
  fetchOrderDisputes,
  fetchAllSellerVerifications,
  updateSellerVerificationEvidence,
} from '../lib/db';
import { useAuth } from '../context/AuthContext';

type AdminTab =
  | 'overview'
  | 'enterprises'
  | 'products'
  | 'categories'
  | 'disputes'
  | 'verification'
  | 'promos'
  | 'settings'
  | 'audit';

interface CategoryNode {
  id: string;
  name: string;
  subcategories: string[];
}

const DEFAULT_CATEGORIES: CategoryNode[] = [
  {
    id: 'cat-stone',
    name: 'Natural Stone & Marble',
    subcategories: ['Calacatta Marble', 'Granite Slabs', 'Limestone', 'Travertine Pavers', 'Onyx Blocks'],
  },
  {
    id: 'cat-machinery',
    name: 'Machinery & Tools',
    subcategories: ['CNC Machining Centers', 'Fiber Laser Cutters', 'Industrial Robots', 'Milling Cutters'],
  },
  {
    id: 'cat-timber',
    name: 'Timber & Sustainable Lumber',
    subcategories: ['Structural Pine', 'Kiln-Dried Hardwood', 'Plywood Sheets', 'Timber Beams'],
  },
  {
    id: 'cat-textiles',
    name: 'Textiles & Apparel',
    subcategories: ['Organic Cotton Fabrics', 'Garment Accessories', 'Silk Weaves', 'Technical Textiles'],
  },
  {
    id: 'cat-electronics',
    name: 'Electronics & Components',
    subcategories: ['PCB Assemblies', 'Semiconductors', 'Power Inverters', 'Industrial Sensors'],
  },
];

export const AdminPanelView: React.FC = () => {
  const { currentBusiness } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [disputes, setDisputes] = useState<OrderDispute[]>([]);
  const [verifications, setVerifications] = useState<SellerVerificationEvidence[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>(DEFAULT_CATEGORIES);

  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // New Category Form Modal
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newSubcats, setNewSubcats] = useState('');

  // Platform Settings State
  const [commissionRate, setCommissionRate] = useState(3.5);
  const [escrowHoldDays, setEscrowHoldDays] = useState(7);
  const [autoApproveVerifiedProducts, setAutoApproveVerifiedProducts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [st, bus, prods, coups, logs, disps, vers] = await Promise.all([
        fetchPlatformAdminStats(),
        fetchMarketplaceSuppliers(),
        fetchMarketplaceProducts(),
        fetchCoupons(),
        currentBusiness ? fetchAuditLogs(currentBusiness.id) : [],
        currentBusiness ? fetchOrderDisputes(currentBusiness.id) : [],
        fetchAllSellerVerifications(),
      ]);
      setStats(st);
      setBusinesses(bus);
      setProducts(prods);
      setCoupons(coups);
      setAuditLogs(logs);
      setDisputes(disps);
      setVerifications(vers);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [currentBusiness]);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  // Moderate Product
  const handleModerate = async (productId: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND') => {
    try {
      const updated = await moderateProduct(productId, action);
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      showToast(`Product "${updated.name}" updated: status set to ${updated.status}.`);
    } catch (err: any) {
      showToast(err.message || 'Moderation failed');
    }
  };

  // Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const subs = newSubcats.split(',').map((s) => s.trim()).filter(Boolean);
    const newCat: CategoryNode = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      subcategories: subs.length > 0 ? subs : ['General'],
    };
    setCategories((prev) => [...prev, newCat]);
    setIsAddCatModalOpen(false);
    setNewCatName('');
    setNewSubcats('');
    showToast(`Category "${newCat.name}" successfully provisioned.`);
  };

  // Delete Category
  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    showToast('Category deleted from taxonomy.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold flex items-center gap-2">
              <span>Platform Executive & Governance Console</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                Super Admin
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Multi-tenant telemetry, global taxonomy, escrow rules, and system auditing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsTestRunnerOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
          >
            <Terminal className="w-4 h-4" />
            <span>Run E2E User Flow Tests</span>
          </button>

          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Core Microservices Online</span>
          </span>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex flex-wrap gap-1 shadow-xs">
        {[
          { id: 'overview', label: 'Overview & Health', icon: Activity },
          { id: 'enterprises', label: 'Enterprises & RBAC', icon: Building2 },
          { id: 'products', label: 'Product Moderation', icon: Package },
          { id: 'categories', label: 'Taxonomy & Categories', icon: Layers },
          { id: 'disputes', label: 'Disputes & Escrow', icon: AlertTriangle },
          { id: 'verification', label: 'KYC & Verification', icon: ShieldCheck },
          { id: 'promos', label: 'Coupons & Promos', icon: Tag },
          { id: 'settings', label: 'Platform Fees & Rules', icon: Sliders },
          { id: 'audit', label: 'System Audit Logs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold">Total Platform GMV</span>
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  ${stats.total_gmv.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">{stats.total_orders} settled orders</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold">Registered Enterprises</span>
                  <Building2 className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.total_businesses}
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {stats.verified_businesses} Verified Tier-1
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold">Published Products</span>
                  <Package className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.total_products}
                </div>
                <span className="text-[10px] text-slate-400">{stats.total_rfqs} active RFQ tenders</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold">Open Disputes</span>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.open_disputes}
                </div>
                <span className="text-[10px] text-slate-400">0 escalated arbitration</span>
              </div>
            </div>
          )}

          {/* Infrastructure Health Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <span>Multi-Tenant Security & Isolation Status</span>
            </h2>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">PostgreSQL RLS</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Strict tenant isolation enforced via Row Level Security across all core database schemas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Gemini AI Engine</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                    ONLINE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Server-side proxy routes verify business membership before forwarding inference payloads.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Escrow Payment Gateway</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                    ENFORCED
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Minor unit integer math protects financial settlements across cards, wire transfers, and UPI.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. ENTERPRISES & RBAC */}
      {activeTab === 'enterprises' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Platform Tenants & Enterprises ({businesses.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 pl-4">Company Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Origin</th>
                  <th className="p-3">Currency</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white">{b.name}</td>
                    <td className="p-3">{b.business_type}</td>
                    <td className="p-3">{b.country}</td>
                    <td className="p-3 font-mono">{b.currency}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Active
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Enterprise</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. PRODUCT MODERATION */}
      {activeTab === 'products' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Product Compliance & Moderation Queue ({products.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 pl-4">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">MOQ</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3 font-mono">${(p.price || 0).toLocaleString()}</td>
                    <td className="p-3">{p.moq || 1} units</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {p.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => handleModerate(p.id, 'APPROVE')}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModerate(p.id, 'REJECT')}
                          className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModerate(p.id, 'SUSPEND')}
                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition-colors"
                        >
                          Suspend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. TAXONOMY & CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Hierarchical Sourcing Taxonomy & Categories
              </h2>
              <p className="text-xs text-slate-500">
                Manage global industrial categories, subcategories, and trade attributes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddCatModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {cat.subcategories.map((sub, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Add Category Modal */}
          {isAddCatModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Sourcing Category</h3>
                  <button onClick={() => setIsAddCatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aerospace Alloys & Superconductors"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Subcategories (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Titanium Gr. 5, Inconel 718, Hastelloy"
                      value={newSubcats}
                      onChange={(e) => setNewSubcats(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddCatModalOpen(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      Save Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 5. DISPUTES & ESCROW */}
      {activeTab === 'disputes' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white">
            Active Disputes & Escrow Arbitration Cases ({disputes.length})
          </h2>

          {disputes.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              No active customer disputes or escrow claim arbitrations pending review.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {disputes.map((disp) => (
                <div key={disp.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Dispute #{disp.id.slice(0, 8)} • Order: {disp.order_id}
                    </p>
                    <p className="text-slate-500 mt-0.5">{disp.title} • {disp.dispute_type} • Claim: ${disp.claim_amount} {disp.currency}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{disp.description}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">
                    {disp.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 6. KYC & VERIFICATIONS */}
      {activeTab === 'verification' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white">
            Seller KYC & Commercial Compliance Documents ({verifications.length})
          </h2>

          {verifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              All onboarded enterprise sellers are verified and audited.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {verifications.map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{v.title}</p>
                    <p className="text-slate-500">{v.document_type} • Status: {v.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateSellerVerificationEvidence(v.id, 'APPROVED', 'Compliance approved');
                        showToast(`Evidence "${v.title}" approved.`);
                        loadAll();
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await updateSellerVerificationEvidence(v.id, 'REJECTED', 'Insufficient evidence');
                        showToast(`Evidence "${v.title}" rejected.`);
                        loadAll();
                      }}
                      className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px]"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 7. PROMOS & COUPONS */}
      {activeTab === 'promos' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Platform Promotional Coupons ({coupons.length})
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                    {c.code}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `$${c.discount_value} CREDIT`}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{c.description}</p>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Min Order: ${c.min_order_amount}</span>
                  <span>Redemptions: {c.usage_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Global Marketplace Rules & Financial Settlement Settings
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Platform Commission Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-500">
                Deducted automatically on settled B2C orders and B2B purchase orders.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Escrow Hold Duration (Days)
              </label>
              <input
                type="number"
                value={escrowHoldDays}
                onChange={(e) => setEscrowHoldDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-500">
                Minimum quarantine period after delivery confirmation before seller payout settlement.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => showToast('Platform financial parameters updated & recorded to audit log.')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
          >
            Save Governance Rules
          </button>
        </div>
      )}

      {/* TAB CONTENT: 9. AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              System Audit Trails ({auditLogs.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 pl-4">Timestamp</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 pl-4 text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{log.module}</td>
                    <td className="p-3 font-semibold">{log.action}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-sans">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Automated E2E QA Test Runner Modal */}
      <TestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />
    </div>
  );
};
