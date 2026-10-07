import React from 'react';
import { Compass, AlertCircle, BarChart2, Globe, TrendingUp, Layers } from 'lucide-react';
import { Product, Lead, Order, RFQ } from '../../types';

interface MarketIntelligenceProps {
  products: Product[];
  leads: Lead[];
  orders: Order[];
  rfqs: RFQ[];
  currencySymbol?: string;
  onSelectView?: (view: string) => void;
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({
  products,
  leads,
  orders,
  rfqs,
  currencySymbol = 'USD',
  onSelectView,
}) => {
  // Aggregate real product demand based on quotations & order line items
  const productDemandMap = new Map<string, { name: string; inquiries: number; orders: number }>();

  leads.forEach((l) => {
    if (l.product_interest) {
      const cur = productDemandMap.get(l.product_interest) || {
        name: l.product_interest,
        inquiries: 0,
        orders: 0,
      };
      cur.inquiries += 1;
      productDemandMap.set(l.product_interest, cur);
    }
  });

  // Calculate country activity
  const countryMap = new Map<string, number>();
  leads.forEach((l) => {
    if (l.country) countryMap.set(l.country, (countryMap.get(l.country) || 0) + 1);
  });
  orders.forEach((o) => {
    const c = o.shipping_address?.country;
    if (c) countryMap.set(c, (countryMap.get(c) || 0) + 1);
  });

  // Real RFQ buyer requirements
  const rfqCategories = new Map<string, number>();
  rfqs.forEach((r) => {
    if (r.category) {
      rfqCategories.set(r.category, (rfqCategories.get(r.category) || 0) + 1);
    }
  });

  const topDemands = Array.from(productDemandMap.values())
    .sort((a, b) => b.inquiries - a.inquiries)
    .slice(0, 4);

  const topCountries = Array.from(countryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const topReqs = Array.from(rfqCategories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div
      id="vyra-market-intelligence"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
            Demand Aggregation
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            MARKET INTELLIGENCE
          </h2>
        </div>

        {/* Real external source status banner */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs font-mono">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Market intelligence source not connected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module 1: Top Product Demand */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800/80">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Top Product Demand
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          {topDemands.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              No demand recorded yet. Inquiries will log here.
            </div>
          ) : (
            <div className="space-y-2">
              {topDemands.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[150px] font-medium text-slate-700 dark:text-slate-300">
                    {d.name}
                  </span>
                  <span className="font-mono text-slate-500 font-semibold tabular-nums">
                    {d.inquiries} inquiries
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module 2: Buyer Requirements (RFQs) */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800/80">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Buyer Requirements
            </span>
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          {topReqs.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              No active RFQs available in buyer directory.
            </div>
          ) : (
            <div className="space-y-2">
              {topReqs.map(([cat, count], i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[150px] font-medium text-slate-700 dark:text-slate-300">
                    {cat}
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                    {count} tenders
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module 3: Country Activity */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800/80">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Country Distribution
            </span>
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          {topCountries.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              No country records available yet.
            </div>
          ) : (
            <div className="space-y-2">
              {topCountries.map(([country, count], i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[150px] font-medium text-slate-700 dark:text-slate-300">
                    {country}
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold tabular-nums">
                    {count} partners
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
