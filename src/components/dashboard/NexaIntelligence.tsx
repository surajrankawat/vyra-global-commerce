import React, { useState } from 'react';
import { Cpu, Check, X, Eye, ShieldCheck, ArrowRight } from 'lucide-react';
import { Lead, Quotation, Product } from '../../types';

export interface IntelligenceOpportunity {
  id: string;
  type: 'followup' | 'quote' | 'inventory';
  text: string;
  rationale: string;
  targetView: string;
  targetId?: string;
}

export interface VyraIntelligenceProps {
  leads: Lead[];
  quotations: Quotation[];
  products: Product[];
  onReview: (opp: IntelligenceOpportunity) => void;
  onApprove: (opp: IntelligenceOpportunity) => void;
}

export type NexaIntelligenceProps = VyraIntelligenceProps;

export const VyraIntelligence: React.FC<VyraIntelligenceProps> = ({
  leads,
  quotations,
  products,
  onReview,
  onApprove,
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Generate grounded insights from real database records
  const opportunities: IntelligenceOpportunity[] = [];

  // 1. Follow up with pending inquiry
  const pendingLeads = leads.filter((l) => l.status === 'New' || l.status === 'Contacted');
  if (pendingLeads.length > 0) {
    const targetLead = pendingLeads[0];
    opportunities.push({
      id: `opp-lead-${targetLead.id}`,
      type: 'followup',
      text: `Follow up with pending buyer inquiry (${targetLead.buyer_name || targetLead.company_name})`,
      rationale: `Lead expressed interest in ${targetLead.product_interest || 'catalog specs'}. Early response boosts deal velocity.`,
      targetView: 'leads',
      targetId: targetLead.id,
    });
  }

  // 2. Quote expiring soon
  const pendingQuotes = quotations.filter((q) => ['Sent', 'Under Review'].includes(q.status));
  if (pendingQuotes.length > 0) {
    const targetQuote = pendingQuotes[0];
    opportunities.push({
      id: `opp-quote-${targetQuote.id}`,
      type: 'quote',
      text: `Quote #${targetQuote.quotation_number || targetQuote.id.slice(0, 8)} awaiting buyer sign-off`,
      rationale: `Deal value $${targetQuote.total_amount?.toLocaleString() || 0}. Dispatch nudge to close deal.`,
      targetView: 'quotations',
      targetId: targetQuote.id,
    });
  }

  // 3. Inventory low
  const lowProd = products.find(
    (p) => (p.stock_quantity ?? 100) <= (p.low_stock_threshold ?? 10)
  );
  if (lowProd) {
    opportunities.push({
      id: `opp-prod-${lowProd.id}`,
      type: 'inventory',
      text: `Inventory requires attention: ${lowProd.name}`,
      rationale: `Stock level (${lowProd.stock_quantity ?? 0} units) is at or below threshold. Reorder batch recommended.`,
      targetView: 'products',
      targetId: lowProd.id,
    });
  }

  const activeOpps = opportunities.filter((o) => !dismissedIds.has(o.id));

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div
      id="vyra-intelligence-layer"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            VYRA INTELLIGENCE
          </h2>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-500">
          {activeOpps.length} opportunities detected
        </span>
      </div>

      {activeOpps.length === 0 ? (
        <div className="py-4 text-xs text-slate-400 font-mono text-center">
          All commercial parameters nominal. 0 pending alerts.
        </div>
      ) : (
        <div className="space-y-3">
          {activeOpps.map((opp) => (
            <div
              key={opp.id}
              className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded text-xs"
            >
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {opp.text}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {opp.rationale}
                  </div>
                </div>
              </div>

              {/* 3 Action Buttons: Review, Approve, Dismiss */}
              <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onReview(opp)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 transition"
                >
                  Review
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(opp)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded hover:bg-slate-800 transition"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleDismiss(opp.id)}
                  className="ml-auto text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const NexaIntelligence = VyraIntelligence;
export default VyraIntelligence;
