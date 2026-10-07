import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Order, Quotation, Lead } from '../../types';

interface CommerceAnalyticsProps {
  orders: Order[];
  quotations: Quotation[];
  leads: Lead[];
  currencySymbol?: string;
}

type MetricType = 'revenue' | 'orders' | 'quotes' | 'conversion';
type TimeWindow = '7d' | '30d' | '90d' | '12m';

export const CommerceAnalytics: React.FC<CommerceAnalyticsProps> = ({
  orders,
  quotations,
  leads,
  currencySymbol = 'USD',
}) => {
  const [metric, setMetric] = useState<MetricType>('revenue');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d');
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; value: number } | null>(null);

  // Time window days calculation
  const getDaysForWindow = (w: TimeWindow) => {
    switch (w) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case '12m':
        return 365;
    }
  };

  const days = getDaysForWindow(timeWindow);
  const now = new Date();
  const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Determine if there is real data within this time frame
  const relevantOrders = orders.filter((o) => new Date(o.created_at || 0) >= startTime);
  const relevantQuotes = quotations.filter((q) => new Date(q.created_at || 0) >= startTime);
  const relevantLeads = leads.filter((l) => new Date(l.created_at || 0) >= startTime);

  const hasAnyData =
    metric === 'revenue'
      ? relevantOrders.length > 0 || relevantQuotes.some((q) => q.status === 'Accepted')
      : metric === 'orders'
      ? relevantOrders.length > 0
      : metric === 'quotes'
      ? relevantQuotes.length > 0
      : relevantLeads.length > 0;

  // Build real date buckets (e.g. 7 buckets)
  const bucketCount = timeWindow === '7d' ? 7 : timeWindow === '30d' ? 6 : timeWindow === '90d' ? 6 : 12;
  const bucketDurationMs = (days * 24 * 60 * 60 * 1000) / bucketCount;

  const dataPoints: { label: string; value: number }[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = new Date(startTime.getTime() + i * bucketDurationMs);
    const bucketEnd = new Date(startTime.getTime() + (i + 1) * bucketDurationMs);

    const label =
      timeWindow === '12m'
        ? bucketStart.toLocaleString('default', { month: 'short' })
        : `${bucketStart.getMonth() + 1}/${bucketStart.getDate()}`;

    let val = 0;
    if (metric === 'revenue') {
      const ordRev = orders
        .filter((o) => {
          const d = new Date(o.created_at || 0);
          return d >= bucketStart && d < bucketEnd;
        })
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      const quoteRev = quotations
        .filter((q) => {
          const d = new Date(q.created_at || 0);
          return q.status === 'Accepted' && d >= bucketStart && d < bucketEnd;
        })
        .reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0);

      val = ordRev + quoteRev;
    } else if (metric === 'orders') {
      val = orders.filter((o) => {
        const d = new Date(o.created_at || 0);
        return d >= bucketStart && d < bucketEnd;
      }).length;
    } else if (metric === 'quotes') {
      val = quotations.filter((q) => {
        const d = new Date(q.created_at || 0);
        return d >= bucketStart && d < bucketEnd;
      }).length;
    } else if (metric === 'conversion') {
      const bucketLeads = leads.filter((l) => {
        const d = new Date(l.created_at || 0);
        return d >= bucketStart && d < bucketEnd;
      });
      const won = bucketLeads.filter((l) => l.status === 'Won').length;
      val = bucketLeads.length > 0 ? Math.round((won / bucketLeads.length) * 100) : 0;
    }

    dataPoints.push({ label, value: val });
  }

  const maxValue = Math.max(...dataPoints.map((d) => d.value), 1);

  const formatVal = (v: number) => {
    if (metric === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencySymbol,
        maximumFractionDigits: 0,
      }).format(v);
    }
    if (metric === 'conversion') return `${v}%`;
    return v.toString();
  };

  return (
    <div
      id="vyra-commerce-analytics"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs"
    >
      {/* Header with Metric & Time Range Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
            Performance Ledger
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            COMMERCE ANALYTICS
          </h2>
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-xs">
          {(['7d', '30d', '90d', '12m'] as TimeWindow[]).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setTimeWindow(w)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                timeWindow === w
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {w === '7d' ? '7 Days' : w === '30d' ? '30 Days' : w === '90d' ? '90 Days' : '12 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setMetric('revenue')}
          className={`text-xs font-semibold pb-1 border-b-2 transition ${
            metric === 'revenue'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Revenue
        </button>
        <button
          type="button"
          onClick={() => setMetric('orders')}
          className={`text-xs font-semibold pb-1 border-b-2 transition ${
            metric === 'orders'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Orders
        </button>
        <button
          type="button"
          onClick={() => setMetric('quotes')}
          className={`text-xs font-semibold pb-1 border-b-2 transition ${
            metric === 'quotes'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Quotes
        </button>
        <button
          type="button"
          onClick={() => setMetric('conversion')}
          className={`text-xs font-semibold pb-1 border-b-2 transition ${
            metric === 'conversion'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Lead Conversion
        </button>
      </div>

      {/* Chart Canvas */}
      {!hasAnyData ? (
        <div className="py-14 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded">
          <AlertCircle className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No transaction data available yet.
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
            Real business charts generate strictly as transactions, quotes, and deals log in the database.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Active tooltip indicator */}
          <div className="h-6 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              {hoveredPoint ? `Period: ${hoveredPoint.label}` : 'Hover bar to view slice details'}
            </span>
            {hoveredPoint && (
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {formatVal(hoveredPoint.value)}
              </span>
            )}
          </div>

          {/* SVG Bar Chart */}
          <div className="h-44 w-full flex items-end gap-2 pt-4 px-2 border-b border-slate-200 dark:border-slate-800">
            {dataPoints.map((dp, i) => {
              const heightPct = Math.max(8, (dp.value / maxValue) * 100);
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredPoint(dp)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all duration-200 ${
                      hoveredPoint?.label === dp.label
                        ? 'bg-blue-600 dark:bg-blue-400'
                        : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-600'
                    }`}
                  />
                  <span className="text-[10px] font-mono text-slate-400 mt-2 truncate w-full text-center">
                    {dp.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
