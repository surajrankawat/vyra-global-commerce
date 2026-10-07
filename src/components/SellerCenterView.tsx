import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Boxes,
  FileText,
  Users,
  ShoppingBag,
  Store,
  FolderLock,
  BarChart3,
  Megaphone,
  CreditCard,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Plus,
  ArrowUpRight,
  Building2,
  Globe,
  Compass,
  FileCheck,
} from 'lucide-react';
import {
  fetchBusinessProducts,
  fetchBusinessOrders,
  fetchBusinessQuotations,
  fetchBusinessLeads,
  fetchBankAccounts,
  fetchBusinessLocations,
} from '../lib/db';
import { Product, Order, Quotation, Lead, BankAccount, BusinessLocation } from '../types';

interface SellerCenterViewProps {
  onSelectView: (view: string) => void;
}

export const SellerCenterView: React.FC<SellerCenterViewProps> = ({ onSelectView }) => {
  const { currentBusiness } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      fetchBusinessProducts(currentBusiness.id),
      fetchBusinessOrders(currentBusiness.id),
      fetchBusinessQuotations(currentBusiness.id),
      fetchBusinessLeads(currentBusiness.id),
      fetchBusinessLocations(currentBusiness.id),
      fetchBankAccounts(currentBusiness.id),
    ])
      .then(([p, o, q, l, locs, b]) => {
        setProducts(p);
        setOrders(o);
        setQuotations(q);
        setLeads(l);
        setLocations(locs);
        setBankAccounts(b);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentBusiness]);

  const verificationStatus = currentBusiness?.verification_status || 'unverified';

  return (
    <div className="space-y-6">
      {/* Seller Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              SELLER HUB & FACTORY OPERATIONS
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 ${
              verificationStatus === 'verified'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400'
                : verificationStatus === 'pending'
                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400'
                : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {verificationStatus === 'verified' && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
              {verificationStatus === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
              {verificationStatus === 'unverified' && <AlertCircle className="w-3 h-3 text-slate-500" />}
              <span>{verificationStatus.toUpperCase()} SELLER</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {currentBusiness?.name || 'Seller Enterprise Operations'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Manage your global catalog, process buyer RFQ bids, generate sequential commercial proformas,
            and monitor export container fulfillments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSelectView('products')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <button
            type="button"
            onClick={() => onSelectView('website-builder')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
          >
            <Store className="w-4 h-4" /> View Storefront
          </button>
        </div>
      </div>

      {/* Seller Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => onSelectView('products')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-blue-500 transition space-y-1 shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Live Products</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{products.length}</div>
          <div className="text-[11px] text-slate-500">In global catalog</div>
        </div>

        <div
          onClick={() => onSelectView('leads')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-emerald-500 transition space-y-1 shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Buyer Inquiries</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{leads.length}</div>
          <div className="text-[11px] text-slate-500">Active CRM leads</div>
        </div>

        <div
          onClick={() => onSelectView('quotations')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-purple-500 transition space-y-1 shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Issued Quotes</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{quotations.length}</div>
          <div className="text-[11px] text-slate-500">Proformas sent</div>
        </div>

        <div
          onClick={() => onSelectView('orders')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-indigo-500 transition space-y-1 shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Confirmed Orders</span>
            <ShoppingBag className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{orders.length}</div>
          <div className="text-[11px] text-slate-500">Commercial batches</div>
        </div>
      </div>

      {/* Seller Functional Center Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Products & Inventory Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Catalog & PDF Engine</h3>
            </div>
            <button
              onClick={() => onSelectView('products')}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Open Catalog
            </button>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload multi-angle product photography, technical specifications, and generate instant export datasheets or A4/A5 multi-page PDF catalogs.
          </p>
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
              <span>Catalog items</span>
              <span className="font-mono font-bold">{products.length}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
              <span>Low stock warnings</span>
              <span className="font-mono font-bold text-amber-600">
                {products.filter((p) => (p.stock_quantity || 0) <= (p.low_stock_threshold || 5)).length}
              </span>
            </div>
          </div>
        </div>

        {/* Commercial Invoicing & Quotes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Quotation 2.0 & Orders</h3>
            </div>
            <button
              onClick={() => onSelectView('quotations')}
              className="text-xs text-emerald-600 font-bold hover:underline"
            >
              Manage Quotes
            </button>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate compliant commercial proposals with Incoterms, freight rates, transit insurance, and sequential numbering. Convert accepted quotes to orders in 1-click.
          </p>
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
              <span>Accepted Quotations</span>
              <span className="font-mono font-bold text-emerald-600">
                {quotations.filter((q) => q.status === 'Accepted').length}
              </span>
            </div>
            <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
              <span>Active Shipments</span>
              <span className="font-mono font-bold">{orders.filter((o) => o.status === 'In Transit').length}</span>
            </div>
          </div>
        </div>

        {/* Global Locations & Facilities */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Plant & Facilities Mapping</h3>
            </div>
            <button
              onClick={() => onSelectView('settings')}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Manage Locations
            </button>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Declare your factories, warehouses, showrooms, and dispatch ports with working hours and contact officers to build buyer procurement confidence.
          </p>
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
              <span>Registered Locations</span>
              <span className="font-mono font-bold">{locations.length}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
              <span>Linked Corporate Bank Accounts</span>
              <span className="font-mono font-bold">{bankAccounts.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
