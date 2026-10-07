import React, { useState } from 'react';
import {
  AlertCircle,
  Clock,
  Package,
  ShoppingBag,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
} from 'lucide-react';
import { Lead, Quotation, Order, Product, FollowUp } from '../../types';

export interface ActionItem {
  id: string;
  type: 'inquiry' | 'quote' | 'inventory' | 'order' | 'followup';
  title: string;
  description: string;
  priority: 'URGENT' | 'HIGH' | 'STANDARD';
  targetView: string;
  recordId?: string;
  meta?: any;
}

interface ActionQueueProps {
  leads: Lead[];
  quotations: Quotation[];
  orders: Order[];
  products: Product[];
  followUps: FollowUp[];
  onOpenAction: (action: ActionItem) => void;
  onReviewAction: (action: ActionItem) => void;
  onCompleteAction?: (actionId: string) => void;
}

export const ActionQueue: React.FC<ActionQueueProps> = ({
  leads,
  quotations,
  orders,
  products,
  followUps,
  onOpenAction,
  onReviewAction,
  onCompleteAction,
}) => {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  // Derive real operational action items from active database entities
  const rawActions: ActionItem[] = [];

  // 1. Leads requiring first contact or response
  const newLeads = leads.filter((l) => l.status === 'New');
  if (newLeads.length > 0) {
    newLeads.slice(0, 3).forEach((lead) => {
      rawActions.push({
        id: `act-lead-${lead.id}`,
        type: 'inquiry',
        title: `Buyer inquiry from ${lead.buyer_name || lead.company_name || 'Buyer'} needs response`,
        description: `Inquiry for ${lead.product_interest || 'catalog specs'} (${lead.country || 'Global'})`,
        priority: 'URGENT',
        targetView: 'leads',
        recordId: lead.id,
        meta: lead,
      });
    });
  }

  // 2. Quotations expiring soon or awaiting response
  const pendingQuotes = quotations.filter((q) => ['Sent', 'Under Review'].includes(q.status));
  if (pendingQuotes.length > 0) {
    pendingQuotes.slice(0, 2).forEach((quote) => {
      rawActions.push({
        id: `act-quote-${quote.id}`,
        type: 'quote',
        title: `Quotation #${quote.quotation_number || quote.id.slice(0, 8)} awaiting signoff`,
        description: `Value: $${quote.total_amount?.toLocaleString() || 0} ${quote.currency || 'USD'}`,
        priority: 'HIGH',
        targetView: 'quotations',
        recordId: quote.id,
        meta: quote,
      });
    });
  }

  // 3. Products with low inventory
  const lowStock = products.filter(
    (p) => (p.stock_quantity ?? 100) <= (p.low_stock_threshold ?? 10)
  );
  if (lowStock.length > 0) {
    lowStock.slice(0, 2).forEach((prod) => {
      rawActions.push({
        id: `act-prod-${prod.id}`,
        type: 'inventory',
        title: `Low stock on ${prod.name}`,
        description: `Current inventory: ${prod.stock_quantity ?? 0} units remaining (SKU: ${prod.sku || 'N/A'})`,
        priority: 'HIGH',
        targetView: 'products',
        recordId: prod.id,
        meta: prod,
      });
    });
  }

  // 4. Orders requiring attention / fulfillment
  const pendingOrders = orders.filter(
    (o) => o.payment_status === 'Pending' || o.order_status === 'Processing'
  );
  if (pendingOrders.length > 0) {
    pendingOrders.slice(0, 2).forEach((ord) => {
      rawActions.push({
        id: `act-order-${ord.id}`,
        type: 'order',
        title: `Order #${ord.order_number || ord.id.slice(0, 8)} requires fulfillment`,
        description: `Payment: ${ord.payment_status} · Total: $${ord.total_amount?.toLocaleString() || 0}`,
        priority: 'URGENT',
        targetView: 'orders',
        recordId: ord.id,
        meta: ord,
      });
    });
  }

  // 5. Follow-ups pending
  const pendingFollowups = followUps.filter((f) => f.status === 'Pending');
  if (pendingFollowups.length > 0) {
    pendingFollowups.slice(0, 2).forEach((fol) => {
      rawActions.push({
        id: `act-followup-${fol.id}`,
        type: 'followup',
        title: `Commercial follow-up scheduled`,
        description: `Channel: ${fol.channel || 'Direct'} · Scheduled: ${new Date(fol.scheduled_date || fol.scheduled_at || 0).toLocaleDateString()}`,
        priority: 'STANDARD',
        targetView: 'follow-ups',
        recordId: fol.id,
        meta: fol,
      });
    });
  }

  // Filter out locally completed actions
  const activeActions = rawActions.filter((a) => !completedIds.has(a.id));

  const handleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedIds((prev) => new Set(prev).add(id));
    if (onCompleteAction) onCompleteAction(id);
  };

  const getPriorityStyle = (p: ActionItem['priority']) => {
    switch (p) {
      case 'URGENT':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900';
      case 'HIGH':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div
      id="vyra-action-queue-panel"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
            Operations Priority
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            TODAY'S ACTIONS
          </h2>
        </div>
        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
          {activeActions.length} Pending
        </span>
      </div>

      {/* Action List */}
      <div className="space-y-2.5">
        {activeActions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/80 mb-2" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              All operational tasks resolved
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Queue clear. New items will appear as buyers inquire and orders process.
            </p>
          </div>
        ) : (
          activeActions.map((action) => (
            <div
              key={action.id}
              className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getPriorityStyle(
                    action.priority
                  )}`}
                >
                  {action.priority}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Real record</span>
              </div>

              {/* Title & Desc */}
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                {action.title}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {action.description}
              </div>

              {/* Functional 3-Action Button Bar: [Open] [Review] [Complete] */}
              <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                <button
                  type="button"
                  id={`btn-open-${action.id}`}
                  onClick={() => onOpenAction(action)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Open
                </button>
                <button
                  type="button"
                  id={`btn-review-${action.id}`}
                  onClick={() => onReviewAction(action)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
                >
                  Review
                </button>
                <button
                  type="button"
                  id={`btn-complete-${action.id}`}
                  onClick={(e) => handleComplete(action.id, e)}
                  className="ml-auto px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Complete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
