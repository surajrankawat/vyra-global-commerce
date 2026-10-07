import React from 'react';
import { ChevronRight, ArrowRight, Layers, FileText, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Lead, Quotation, Order, RFQ } from '../../types';

interface BusinessPipelineProps {
  leads: Lead[];
  quotations: Quotation[];
  orders: Order[];
  rfqs: RFQ[];
  currencySymbol?: string;
  onSelectStage: (stageKey: string) => void;
}

export const BusinessPipeline: React.FC<BusinessPipelineProps> = ({
  leads,
  quotations,
  orders,
  rfqs,
  currencySymbol = 'USD',
  onSelectStage,
}) => {
  // 1. BUYER REQUIREMENT: Inbound RFQs + New leads
  const buyerReqLeads = leads.filter((l) => l.status === 'New');
  const buyerReqCount = buyerReqLeads.length + rfqs.length;
  const buyerReqVal =
    buyerReqLeads.reduce((acc, l) => acc + (Number(l.estimated_deal_value) || 0), 0) +
    rfqs.reduce((acc, r) => acc + (Number(r.target_price) ? Number(r.target_price) * (Number(r.quantity) || 1) : 0), 0);

  // 2. MATCHED: Leads in 'Qualified' status
  const matchedLeads = leads.filter((l) => l.status === 'Qualified');
  const matchedCount = matchedLeads.length;
  const matchedVal = matchedLeads.reduce((acc, l) => acc + (Number(l.estimated_deal_value) || 0), 0);

  // 3. CONTACTED: Leads in 'Contacted' status
  const contactedLeads = leads.filter((l) => l.status === 'Contacted');
  const contactedCount = contactedLeads.length;
  const contactedVal = contactedLeads.reduce((acc, l) => acc + (Number(l.estimated_deal_value) || 0), 0);

  // 4. QUOTED: Quotations in Sent / Under Review / Draft
  const activeQuotes = quotations.filter((q) => ['Sent', 'Under Review', 'Draft'].includes(q.status));
  const quotedCount = activeQuotes.length;
  const quotedVal = activeQuotes.reduce((acc, q) => acc + (Number(q.total_amount) || 0), 0);

  // 5. NEGOTIATION: Leads in 'Negotiation' status
  const negotiationLeads = leads.filter((l) => l.status === 'Negotiation');
  const negotiationCount = negotiationLeads.length;
  const negotiationVal = negotiationLeads.reduce((acc, l) => acc + (Number(l.estimated_deal_value) || 0), 0);

  // 6. ORDER: Confirmed & Completed Orders
  const orderCount = orders.length;
  const orderVal = orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

  const formatMoney = (val: number) => {
    if (val === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencySymbol,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const stages = [
    {
      id: 'buyer-req',
      label: 'BUYER REQUIREMENT',
      sub: 'Inbound tenders & RFQs',
      count: buyerReqCount,
      val: buyerReqVal,
      targetView: 'leads',
    },
    {
      id: 'matched',
      label: 'MATCHED',
      sub: 'Catalog spec qualified',
      count: matchedCount,
      val: matchedVal,
      targetView: 'leads',
    },
    {
      id: 'contacted',
      label: 'CONTACTED',
      sub: 'Commercial outreach sent',
      count: contactedCount,
      val: contactedVal,
      targetView: 'leads',
    },
    {
      id: 'quoted',
      label: 'QUOTED',
      sub: 'Formal quotation review',
      count: quotedCount,
      val: quotedVal,
      targetView: 'quotations',
    },
    {
      id: 'negotiation',
      label: 'NEGOTIATION',
      sub: 'Pricing & terms closing',
      count: negotiationCount,
      val: negotiationVal,
      targetView: 'leads',
    },
    {
      id: 'order',
      label: 'ORDER',
      sub: 'Commercial fulfillment',
      count: orderCount,
      val: orderVal,
      targetView: 'orders',
    },
  ];

  // Total active pipeline value
  const totalPipelineVal = buyerReqVal + matchedVal + contactedVal + quotedVal + negotiationVal + orderVal;

  return (
    <div
      id="vyra-business-pipeline"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
            Conversion Velocity
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            BUSINESS PIPELINE
          </h2>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            TOTAL PIPELINE VALUE
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {formatMoney(totalPipelineVal)}
          </div>
        </div>
      </div>

      {/* Horizontal Pipeline Sequence */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {stages.map((st, idx) => {
          const isFinal = idx === stages.length - 1;
          return (
            <button
              key={st.id}
              id={`pipeline-stage-${st.id}`}
              type="button"
              onClick={() => onSelectStage(st.targetView)}
              className="text-left p-3 rounded border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-700 transition relative group"
            >
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                  0{idx + 1}
                </span>
                {!isFinal && (
                  <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition" />
                )}
              </div>

              {/* Title */}
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                {st.label}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {st.sub}
              </div>

              {/* Metric count & deal volume */}
              <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
                <div className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {st.count}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                  {formatMoney(st.val)}
                </div>
              </div>

              {/* Subtle bottom indicator */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 transition ${
                  st.count > 0 ? 'bg-blue-600 dark:bg-blue-500' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
