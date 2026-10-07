import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchBusinessLeads,
  fetchBusinessQuotations,
  fetchBusinessOrders,
  fetchBusinessFollowUps,
  fetchBusinessProducts,
  fetchRFQs,
  fetchBusinessStore,
} from '../lib/db';
import { Lead, Quotation, Order, FollowUp, Product, RFQ, BusinessStore, DocumentRecord } from '../types';
import { BusinessOverviewHero } from './dashboard/BusinessOverviewHero';
import { GlobalMarketMap } from './dashboard/GlobalMarketMap';
import { BusinessPipeline } from './dashboard/BusinessPipeline';
import { ActionQueue, ActionItem } from './dashboard/ActionQueue';
import { MarketIntelligence } from './dashboard/MarketIntelligence';
import { ProductPerformanceTable } from './dashboard/ProductPerformanceTable';
import { CommerceAnalytics } from './dashboard/CommerceAnalytics';
import { VyraIntelligence, IntelligenceOpportunity } from './dashboard/VyraIntelligence';
import { QuickActionDock } from './dashboard/QuickActionDock';
import { DashboardEmptyState } from './dashboard/DashboardEmptyState';
import {
  QuickProductModal,
  QuickLeadModal,
  QuickRFQModal,
  QuickUploadModal,
  ReviewActionModal,
} from './dashboard/QuickModals';
import { Building2, AlertCircle } from 'lucide-react';

interface DashboardViewProps {
  onSelectView: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectView }) => {
  const { currentBusiness } = useAuth();

  // Primary business state loaded from real database
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [store, setStore] = useState<BusinessStore | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state for Command Actions
  const [showProductModal, setShowProductModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeReviewAction, setActiveReviewAction] = useState<ActionItem | null>(null);
  const [forceShowDashboard, setForceShowDashboard] = useState(false);

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
      fetchBusinessFollowUps(currentBusiness.id),
      fetchBusinessProducts(currentBusiness.id),
      fetchRFQs(),
      fetchBusinessStore(currentBusiness.id),
    ])
      .then(([l, q, o, f, p, r, s]) => {
        setLeads(l);
        setQuotations(q);
        setOrders(o);
        setFollowUps(f);
        setProducts(p);
        setRfqs(r);
        setStore(s);
      })
      .catch((err) => console.error('Dashboard data load error:', err))
      .finally(() => setLoading(false));
  }, [currentBusiness]);

  if (!currentBusiness) {
    return (
      <div id="dashboard-no-business" className="p-8 text-center max-w-xl mx-auto mt-16 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Business Profile</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Set up your commercial enterprise profile to activate the VYRA Global Business Command Center.
        </p>
        <button
          id="btn-dash-create-biz"
          type="button"
          onClick={() => onSelectView('settings')}
          className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded text-xs font-semibold hover:bg-slate-800 transition"
        >
          Create Business Profile
        </button>
      </div>
    );
  }

  // Real Database Calculations (NO FABRICATED VALUES)
  const wonRevenue =
    orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0) +
    quotations
      .filter((q) => q.status === 'Accepted')
      .reduce((acc, q) => acc + (Number(q.total_amount) || 0), 0);

  const ordersCount = orders.length;
  const openOpportunitiesCount = leads.filter((l) => !['Won', 'Lost'].includes(l.status)).length;
  const pendingQuotesCount = quotations.filter((q) => ['Sent', 'Under Review', 'Draft'].includes(q.status)).length;

  const inventoryAlertsCount = products.filter(
    (p) => p.stock_quantity !== undefined && p.stock_quantity <= (p.low_stock_threshold ?? 10)
  ).length;

  // New Account / Zero Data detection
  const isBrandNewAccount =
    !forceShowDashboard &&
    leads.length === 0 &&
    products.length === 0 &&
    quotations.length === 0 &&
    orders.length === 0;

  // Handlers for Quick Actions
  const handleProductCreated = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleLeadCreated = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleRFQCreated = (newRfq: RFQ) => {
    setRfqs((prev) => [newRfq, ...prev]);
  };

  const handleDocumentUploaded = (doc: DocumentRecord) => {
    // Document successfully saved in database
  };

  const handleReviewOpportunity = (opp: IntelligenceOpportunity) => {
    onSelectView(opp.targetView);
  };

  const handleApproveOpportunity = (opp: IntelligenceOpportunity) => {
    onSelectView(opp.targetView);
  };

  const handleMetricClick = (metricKey: string) => {
    switch (metricKey) {
      case 'revenue':
      case 'orders':
        onSelectView('orders');
        break;
      case 'opportunities':
        onSelectView('leads');
        break;
      case 'quotes':
        onSelectView('quotations');
        break;
      case 'inventory':
        onSelectView('products');
        break;
    }
  };

  return (
    <div id="vyra-command-center" className="space-y-5 pb-16">
      {/* If brand new account with 0 entities, show Section 20 Onboarding Sequence */}
      {isBrandNewAccount ? (
        <DashboardEmptyState
          business={currentBusiness}
          products={products}
          leads={leads}
          quotations={quotations}
          isStorePublished={Boolean(store?.is_published)}
          onStepClick={(view) => onSelectView(view)}
          onDismissToDashboard={() => setForceShowDashboard(true)}
        />
      ) : (
        <>
          {/* 1. Quick Actions Command Dock */}
          <QuickActionDock
            onAddProduct={() => setShowProductModal(true)}
            onAddBuyer={() => setShowLeadModal(true)}
            onCreateQuote={() => onSelectView('quotations')}
            onCreateRFQ={() => setShowRFQModal(true)}
            onAddLead={() => setShowLeadModal(true)}
            onCreateOrder={() => onSelectView('orders')}
            onUploadDocument={() => setShowUploadModal(true)}
          />

          {/* 2. Hero Area: Business Overview */}
          <BusinessOverviewHero
            business={currentBusiness}
            revenue={wonRevenue}
            ordersCount={ordersCount}
            openOpportunitiesCount={openOpportunitiesCount}
            pendingQuotesCount={pendingQuotesCount}
            inventoryAlertsCount={inventoryAlertsCount}
            currencySymbol={currentBusiness.currency || 'USD'}
            onNavigateMetric={handleMetricClick}
          />

          {/* 3. Asymmetric Enterprise Layout: Center (65%) + Right (35%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Center Main Content Area (8 cols on lg) */}
            <div className="lg:col-span-8 space-y-5">
              {/* Business Pipeline */}
              <BusinessPipeline
                leads={leads}
                quotations={quotations}
                orders={orders}
                rfqs={rfqs}
                currencySymbol={currentBusiness.currency || 'USD'}
                onSelectStage={(stageKey) => onSelectView(stageKey)}
              />

              {/* Global Market Map */}
              <GlobalMarketMap
                business={currentBusiness}
                leads={leads}
                orders={orders}
                rfqs={rfqs}
                onAddBuyer={() => setShowLeadModal(true)}
                onCreateProduct={() => setShowProductModal(true)}
                onFindOpportunities={() => onSelectView('marketplace')}
              />

              {/* Commerce Analytics Chart */}
              <CommerceAnalytics
                orders={orders}
                quotations={quotations}
                leads={leads}
                currencySymbol={currentBusiness.currency || 'USD'}
              />

              {/* Product Performance Data Table */}
              <ProductPerformanceTable
                products={products}
                leads={leads}
                quotations={quotations}
                orders={orders}
                onAddProduct={() => setShowProductModal(true)}
                onNavigateToProducts={() => onSelectView('products')}
              />

              {/* Market Intelligence */}
              <MarketIntelligence
                products={products}
                leads={leads}
                orders={orders}
                rfqs={rfqs}
                currencySymbol={currentBusiness.currency || 'USD'}
                onSelectView={onSelectView}
              />
            </div>

            {/* Right Operational Panel: Action Queue & Intelligence (4 cols on lg) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Today's Actions (Operational Action Queue) */}
              <ActionQueue
                leads={leads}
                quotations={quotations}
                orders={orders}
                products={products}
                followUps={followUps}
                onOpenAction={(action) => onSelectView(action.targetView)}
                onReviewAction={(action) => setActiveReviewAction(action)}
              />

              {/* VYRA Intelligence Layer */}
              <VyraIntelligence
                leads={leads}
                quotations={quotations}
                products={products}
                onReview={handleReviewOpportunity}
                onApprove={handleApproveOpportunity}
              />

              {/* Enterprise Trade Compliance & Profile Module */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs text-xs">
                <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-1">
                  Operating Specifications
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  TRADE COMPLIANCE
                </h3>
                <div className="space-y-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span>DOMICILE:</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {currentBusiness.country || 'Global HQ'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span>CURRENCY BASE:</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {currentBusiness.currency || 'USD'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span>PROFILE STATUS:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      VERIFIED ENTERPRISE
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>ACTIVE SKUS:</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {products.length} Items
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Action Modals */}
      <QuickProductModal
        business={currentBusiness}
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onProductCreated={handleProductCreated}
      />

      <QuickLeadModal
        business={currentBusiness}
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onLeadCreated={handleLeadCreated}
      />

      <QuickRFQModal
        business={currentBusiness}
        isOpen={showRFQModal}
        onClose={() => setShowRFQModal(false)}
        onRFQCreated={handleRFQCreated}
      />

      <QuickUploadModal
        business={currentBusiness}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onDocumentUploaded={handleDocumentUploaded}
      />

      <ReviewActionModal
        action={activeReviewAction}
        isOpen={Boolean(activeReviewAction)}
        onClose={() => setActiveReviewAction(null)}
        onProceed={() => {
          if (activeReviewAction) {
            onSelectView(activeReviewAction.targetView);
            setActiveReviewAction(null);
          }
        }}
      />
    </div>
  );
};
