import React from 'react';
import {
  Store,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  FileCheck2,
  FileSpreadsheet,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  UserPlus,
  Send,
  Building2,
  ArrowUpRight,
} from 'lucide-react';
import { SellerDashboardMetrics, SellerProfile } from '../../types';

interface SellersDashboardProps {
  metrics: SellerDashboardMetrics;
  recentSellers: SellerProfile[];
  pendingSellers: SellerProfile[];
  onOpenDirectory: () => void;
  onOpenAddModal: () => void;
  onOpenInviteModal: () => void;
  onStartOnboarding: () => void;
  onSelectSeller: (seller: SellerProfile) => void;
}

export const SellersDashboard: React.FC<SellersDashboardProps> = ({
  metrics,
  recentSellers,
  pendingSellers,
  onOpenDirectory,
  onOpenAddModal,
  onOpenInviteModal,
  onStartOnboarding,
  onSelectSeller,
}) => {
  const statCards = [
    { label: 'Total Sellers', value: metrics.total_sellers, icon: Store, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Verified Sellers', value: metrics.verified_sellers, icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Pending Verification', value: metrics.pending_verification, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Active Sellers', value: metrics.active_sellers, icon: CheckCircle2, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40' },
    { label: 'Inactive / Suspended', value: metrics.inactive_sellers, icon: XCircle, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/60' },
    { label: 'Products Listed', value: metrics.total_products_listed, icon: Package, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'RFQ Responses', value: metrics.seller_rfq_responses, icon: FileCheck2, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
    { label: 'Seller Quotes', value: metrics.seller_quotations, icon: FileSpreadsheet, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
    { label: 'Seller Orders', value: metrics.seller_orders, icon: ShoppingBag, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
    {
      label: 'Seller Revenue',
      value: `$${metrics.seller_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      isText: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Sellers & Factory Operations Command
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-semibold">
              LIVE NETWORK
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global supplier management, verified manufacturer directory, and commercial production compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onStartOnboarding}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Seller Onboarding</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl text-xs font-semibold transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Seller</span>
          </button>
          <button
            type="button"
            onClick={onOpenInviteModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-xs font-semibold transition"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            <span>Invite Supplier</span>
          </button>
        </div>
      </div>

      {/* 10 Real Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg ${card.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Verification & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Queue */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Pending Verification Queue
              </h2>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
              {pendingSellers.length} Awaiting Review
            </span>
          </div>

          {pendingSellers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-xs text-slate-400">
              <ShieldCheck className="w-8 h-8 text-emerald-500/60 mb-2" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">All seller verifications up to date</p>
              <p className="text-[11px] text-slate-400 mt-0.5">0 pending verification submissions currently in queue.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {pendingSellers.map((seller) => (
                <div
                  key={seller.id}
                  onClick={() => onSelectSeller(seller)}
                  className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between hover:border-blue-500/50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {seller.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {seller.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                        <span>{seller.country}</span>
                        <span>•</span>
                        <span>{seller.business_type}</span>
                        <span>•</span>
                        <span>{seller.category || seller.industry}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0">
                    Review <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Registered Sellers */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Recently Registered Sellers
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenDirectory}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Full Directory
            </button>
          </div>

          {recentSellers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-xs text-slate-400">
              <Store className="w-8 h-8 text-slate-400 mb-2" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No sellers registered yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Use "Add Seller" or "Invite Supplier" to register your first seller.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {recentSellers.slice(0, 5).map((seller) => (
                <div
                  key={seller.id}
                  onClick={() => onSelectSeller(seller)}
                  className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between hover:border-blue-500/50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {seller.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {seller.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                        <span>{seller.city ? `${seller.city}, ${seller.country}` : seller.country}</span>
                        <span>•</span>
                        <span>{seller.products_count || 0} products</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        seller.verification_status_normalized === 'Verified'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : seller.verification_status_normalized === 'Pending'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : seller.verification_status_normalized === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {seller.verification_status_normalized}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
