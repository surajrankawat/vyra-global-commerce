import React from 'react';
import { Business } from '../../types';
import {
  TrendingUp,
  ShoppingBag,
  Target,
  FileCheck,
  AlertTriangle,
  Building,
  Globe2,
  Factory,
  Boxes,
  Store,
  Layers,
} from 'lucide-react';

interface BusinessOverviewHeroProps {
  business: Business;
  revenue: number;
  ordersCount: number;
  openOpportunitiesCount: number;
  pendingQuotesCount: number;
  inventoryAlertsCount: number;
  buyerCountriesCount?: number;
  currencySymbol?: string;
  onNavigateMetric?: (metricKey: string) => void;
}

export const BusinessOverviewHero: React.FC<BusinessOverviewHeroProps> = ({
  business,
  revenue,
  ordersCount,
  openOpportunitiesCount,
  pendingQuotesCount,
  inventoryAlertsCount,
  buyerCountriesCount = 0,
  currencySymbol = 'USD',
  onNavigateMetric,
}) => {
  // Format monetary values cleanly
  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencySymbol,
    maximumFractionDigits: 0,
  }).format(revenue);

  // Business Type profile tag & role icon
  const getBusinessTypeBadge = (type: string = '') => {
    const norm = type.toLowerCase();
    if (norm.includes('export')) {
      return {
        label: 'GLOBAL EXPORTER',
        icon: Globe2,
        desc: 'Cross-border trade corridors, export licensing & foreign buyers',
      };
    }
    if (norm.includes('manuf') || norm.includes('producer')) {
      return {
        label: 'MANUFACTURING ENTERPRISE',
        icon: Factory,
        desc: 'Batch production, OEM supply lines & wholesale distribution',
      };
    }
    if (norm.includes('wholesale') || norm.includes('distrib')) {
      return {
        label: 'WHOLESALE DISTRIBUTOR',
        icon: Boxes,
        desc: 'Bulk order staging, inventory turnover & tier contracts',
      };
    }
    if (norm.includes('retail') || norm.includes('d2c') || norm.includes('brand')) {
      return {
        label: 'COMMERCE & RETAIL',
        icon: Store,
        desc: 'Direct-to-consumer storefront, sales orders & omnichannel growth',
      };
    }
    return {
      label: 'COMMERCIAL ENTERPRISE',
      icon: Building,
      desc: 'Corporate sales, deal negotiation & pipeline execution',
    };
  };

  const bizTypeInfo = getBusinessTypeBadge(business.business_type);
  const BizIcon = bizTypeInfo.icon;

  return (
    <div
      id="vyra-business-overview-hero"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs"
    >
      {/* Header section with crisp typography */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
              Command Center
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <BizIcon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              <span>{bizTypeInfo.label}</span>
            </div>
            {business.is_demo && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                SANDBOX DATA
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            BUSINESS OVERVIEW
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your business at a glance · {business.name} ({business.country || 'Global'})
          </p>
        </div>

        {/* Business archetype context note */}
        <div className="text-right hidden sm:block max-w-xs">
          <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
            {bizTypeInfo.desc}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
            OPERATING CURRENCY: {currencySymbol}
          </div>
        </div>
      </div>

      {/* 5 Real KPI Metrics in a Data-First Horizontal Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4">
        {/* Metric 1: Revenue */}
        <div
          onClick={() => onNavigateMetric && onNavigateMetric('revenue')}
          className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded cursor-pointer hover:border-slate-400 dark:hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Revenue
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {formattedRevenue}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Confirmed orders & accepted quotes
          </div>
        </div>

        {/* Metric 2: Orders */}
        <div
          onClick={() => onNavigateMetric && onNavigateMetric('orders')}
          className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded cursor-pointer hover:border-slate-400 dark:hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Orders
            </span>
            <ShoppingBag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {ordersCount}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Total commercial sales orders
          </div>
        </div>

        {/* Metric 3: Open Opportunities */}
        <div
          onClick={() => onNavigateMetric && onNavigateMetric('opportunities')}
          className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded cursor-pointer hover:border-slate-400 dark:hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Open Opportunities
            </span>
            <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {openOpportunitiesCount}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Active pipeline buyer inquiries
          </div>
        </div>

        {/* Metric 4: Pending Quotes */}
        <div
          onClick={() => onNavigateMetric && onNavigateMetric('quotes')}
          className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded cursor-pointer hover:border-slate-400 dark:hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Quotes
            </span>
            <FileCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {pendingQuotesCount}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Awaiting buyer review or signoff
          </div>
        </div>

        {/* Metric 5: Inventory Alerts */}
        <div
          onClick={() => onNavigateMetric && onNavigateMetric('inventory')}
          className="col-span-2 sm:col-span-1 p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded cursor-pointer hover:border-slate-400 dark:hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Inventory Alerts
            </span>
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                inventoryAlertsCount > 0 ? 'text-amber-500' : 'text-slate-400'
              }`}
            />
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
              inventoryAlertsCount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {inventoryAlertsCount}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            {inventoryAlertsCount > 0 ? 'SKUs at or below threshold' : 'All stock levels nominal'}
          </div>
        </div>
      </div>
    </div>
  );
};
