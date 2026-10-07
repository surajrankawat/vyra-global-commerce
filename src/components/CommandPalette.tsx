import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Package,
  Building2,
  Users,
  FileText,
  ShoppingBag,
  Zap,
  Layers,
  Megaphone,
  Settings,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Rocket,
  MessageSquare,
  Compass,
  Store,
  Truck,
} from 'lucide-react';
import { Product, Business, Lead, RFQ, Order } from '../types';
import {
  fetchProducts,
  fetchMarketplaceSuppliers,
  fetchLeads,
  fetchRFQs,
  fetchOrders,
} from '../lib/db';
import { useAuth } from '../context/AuthContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectView,
}) => {
  const { currentBusiness } = useAuth();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Business[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      loadIndex();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const loadIndex = async () => {
    try {
      const [prods, sups, rfqList] = await Promise.all([
        fetchProducts(currentBusiness?.id || 'demo'),
        fetchMarketplaceSuppliers(),
        fetchRFQs(),
      ]);
      setProducts(prods || []);
      setSuppliers(sups || []);
      setRfqs(rfqList || []);

      if (currentBusiness) {
        const [leadList, orderList] = await Promise.all([
          fetchLeads(currentBusiness.id),
          fetchOrders(currentBusiness.id),
        ]);
        setLeads(leadList || []);
        setOrders(orderList || []);
      }
    } catch (err) {
      console.error('Failed to load command palette index:', err);
    }
  };

  if (!isOpen) return null;

  const quickActions = [
    { id: 'dashboard', label: 'Dashboard & Executive Overview', icon: Sparkles, view: 'dashboard' },
    { id: 'revenue-agent', label: 'AI Revenue Agent', icon: Sparkles, view: 'revenue-agent' },
    { id: 'marketplace', label: 'Global B2B/B2C Marketplace', icon: Compass, view: 'marketplace' },
    { id: 'sellers', label: 'Sellers & Factory Operations Command', icon: Store, view: 'sellers' },
    { id: 'buyers', label: 'Buyers & Trade Requirements Directory', icon: Compass, view: 'buyers' },
    { id: 'rfq', label: 'RFQ & Sourcing Board', icon: Zap, view: 'rfq' },
    { id: 'products', label: 'Product Catalog & Inventory', icon: Package, view: 'products' },
    { id: 'leads', label: 'CRM & Pipeline Leads', icon: Users, view: 'leads' },
    { id: 'quotations', label: 'Commercial Quotations', icon: FileText, view: 'quotations' },
    { id: 'orders', label: 'Order Processing & Tracking', icon: ShoppingBag, view: 'orders' },
    { id: 'logistics', label: 'Logistics, Shipping & Freight Hub', icon: Truck, view: 'logistics' },
    { id: 'chat', label: 'Commercial Messages & Chat', icon: MessageSquare, view: 'chat' },
    { id: 'website-builder', label: 'Storefront & Website Builder', icon: Layers, view: 'website-builder' },
    { id: 'advertising', label: 'Internal Advertising Platform', icon: Megaphone, view: 'advertising' },
    { id: 'launch-center', label: 'VYRA Launch & Diagnostics Center', icon: Rocket, view: 'launch-center' },
    { id: 'admin', label: 'Platform Admin Console', icon: ShieldAlert, view: 'admin' },
    { id: 'settings', label: 'Settings & Security', icon: Settings, view: 'settings' },
  ];

  const filteredActions = quickActions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.industry?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredRfqs = rfqs.filter((r) =>
    r.product_title.toLowerCase().includes(query.toLowerCase()) ||
    r.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredLeads = leads.filter((l) =>
    l.name.toLowerCase().includes(query.toLowerCase()) ||
    l.company?.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (view: string) => {
    onSelectView(view);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, search products, suppliers, RFQs, leads, or jump to views..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Quick Views */}
          {filteredActions.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Navigation & Systems
              </div>
              <div className="space-y-1">
                {filteredActions.slice(0, 6).map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleSelect(action.view)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {action.label}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Products ({filteredProducts.length})
              </div>
              <div className="space-y-1">
                {filteredProducts.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect('products')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Package className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white shrink-0 ml-2">
                      ${p.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers */}
          {filteredSuppliers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Verified Suppliers ({filteredSuppliers.length})
              </div>
              <div className="space-y-1">
                {filteredSuppliers.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelect('marketplace')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block truncate">
                          {s.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {s.city ? `${s.city}, ` : ''}{s.country} • {s.business_type}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold">
                      VERIFIED
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* RFQs */}
          {filteredRfqs.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                RFQs & Requirements ({filteredRfqs.length})
              </div>
              <div className="space-y-1">
                {filteredRfqs.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelect('rfq')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block truncate">
                          {r.product_title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Qty: {r.quantity} {r.unit} • {r.delivery_location}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {r.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {filteredActions.length === 0 &&
            filteredProducts.length === 0 &&
            filteredSuppliers.length === 0 &&
            filteredRfqs.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching results found for "{query}". Try a different keyword or command.
              </div>
            )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Search VYRA network index</span>
          <div className="flex items-center gap-2">
            <span>Navigate: ↑ ↓</span>
            <span>Select: ↵</span>
          </div>
        </div>
      </div>
    </div>
  );
};
