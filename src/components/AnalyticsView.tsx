import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchBusinessLeads, fetchBusinessQuotations, fetchBusinessOrders } from '../lib/db';
import { Lead, Quotation, Order } from '../types';
import {
  TrendingUp,
  Globe,
  PieChart,
  DollarSign,
  Users,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { currentBusiness } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchBusinessLeads(currentBusiness.id),
      fetchBusinessQuotations(currentBusiness.id),
      fetchBusinessOrders(currentBusiness.id),
    ])
      .then(([l, q, o]) => {
        setLeads(l);
        setQuotations(q);
        setOrders(o);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentBusiness]);

  const currency = currentBusiness?.currency || 'USD';

  // Metrics (Real Data Calculation)
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === 'Won');
  const lostLeads = leads.filter((l) => l.status === 'Lost');
  const openLeads = leads.filter((l) => !['Won', 'Lost'].includes(l.status));

  const totalWonRevenue =
    orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0) +
    quotations.filter((q) => q.status === 'Accepted').reduce((acc, q) => acc + (Number(q.total_amount) || 0), 0);

  const pipelineValue = openLeads.reduce((acc, l) => acc + (Number(l.estimated_deal_value) || 0), 0);
  const lostValue = lostLeads.reduce((acc, l) => acc + (Number(l.estimated_deal_value) || 0), 0);

  const winRate = totalLeads > 0 ? ((wonLeads.length / totalLeads) * 100).toFixed(1) : '0.0';
  const quoteConversionRate =
    quotations.length > 0
      ? ((quotations.filter((q) => q.status === 'Accepted').length / quotations.length) * 100).toFixed(1)
      : '0.0';

  const avgDealSize =
    wonLeads.length > 0
      ? Math.round(totalWonRevenue / wonLeads.length)
      : leads.length > 0
      ? Math.round(pipelineValue / Math.max(1, openLeads.length))
      : 0;

  // Country Breakdown
  const countryCounts: { [key: string]: { count: number; value: number } } = {};
  leads.forEach((l) => {
    const c = l.country || 'Unknown';
    if (!countryCounts[c]) countryCounts[c] = { count: 0, value: 0 };
    countryCounts[c].count += 1;
    countryCounts[c].value += Number(l.estimated_deal_value) || 0;
  });

  // Source Breakdown
  const sourceCounts: { [key: string]: number } = {};
  leads.forEach((l) => {
    const s = l.source || 'Direct';
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  });

  // Stage Breakdown
  const stageCounts: { [key: string]: number } = {};
  leads.forEach((l) => {
    stageCounts[l.status] = (stageCounts[l.status] || 0) + 1;
  });

  return (
    <div id="analytics-view" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Revenue Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical win/loss ratios, country demand distributions, lead acquisition performance, and forecasting.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Won Revenue</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {totalWonRevenue > 0 ? `${totalWonRevenue.toLocaleString()} ${currency}` : 'No data yet'}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">{wonLeads.length} closed deals</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Win Rate</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {totalLeads > 0 ? `${winRate}%` : 'No data yet'}
          </div>
          <span className="text-[11px] text-slate-400">Of total qualified pipeline</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Average Deal Size</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {avgDealSize > 0 ? `${avgDealSize.toLocaleString()} ${currency}` : 'No data yet'}
          </div>
          <span className="text-[11px] text-slate-400">Mean contract value</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Quote Conversion</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {quotations.length > 0 ? `${quoteConversionRate}%` : 'No data yet'}
          </div>
          <span className="text-[11px] text-slate-400">{quotations.length} quotes issued</span>
        </div>
      </div>

      {/* Two Column Visual Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Country Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Globe className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Demand by Destination Country</h3>
          </div>
          {Object.keys(countryCounts).length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No country data recorded yet.</div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(countryCounts).map(([country, data]) => {
                const pct = totalLeads > 0 ? Math.round((data.count / totalLeads) * 100) : 0;
                return (
                  <div key={country} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{country}</span>
                      <span className="text-slate-500">
                        {data.count} leads ({data.value.toLocaleString()} {currency})
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lead Source Performance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Lead Acquisition Source Performance</h3>
          </div>
          {Object.keys(sourceCounts).length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No lead sources recorded yet.</div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(sourceCounts).map(([src, count]) => {
                const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <div key={src} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{src}</span>
                      <span className="text-slate-500">{count} inquiries ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
