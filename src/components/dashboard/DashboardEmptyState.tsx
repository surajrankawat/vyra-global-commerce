import React from 'react';
import {
  CheckCircle2,
  Circle,
  Building2,
  PackagePlus,
  Users,
  FileSpreadsheet,
  Store,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Business, Product, Lead, Quotation } from '../../types';

interface DashboardEmptyStateProps {
  business: Business;
  products: Product[];
  leads: Lead[];
  quotations: Quotation[];
  isStorePublished?: boolean;
  onStepClick: (stepId: string) => void;
  onDismissToDashboard: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  business,
  products,
  leads,
  quotations,
  isStorePublished = false,
  onStepClick,
  onDismissToDashboard,
}) => {
  // Real verification of each business milestone
  const steps = [
    {
      id: 'step-business',
      number: '01',
      title: 'Create Business',
      desc: 'Corporate entity setup, regional tax compliance, and currency',
      completed: Boolean(business?.id && business?.name),
      actionLabel: 'Edit Profile',
      view: 'settings',
      icon: Building2,
    },
    {
      id: 'step-products',
      number: '02',
      title: 'Add Products',
      desc: 'Populate your commercial catalog with SKUs, pricing & inventory',
      completed: products.length > 0,
      actionLabel: '+ Add Product',
      view: 'products',
      icon: PackagePlus,
    },
    {
      id: 'step-buyers',
      number: '03',
      title: 'Add Buyers',
      desc: 'Import commercial trade contacts, prospective clients & distributor partners',
      completed: leads.length > 0,
      actionLabel: '+ Add Buyer',
      view: 'buyers',
      icon: Users,
    },
    {
      id: 'step-opportunity',
      number: '04',
      title: 'Create First Opportunity',
      desc: 'Issue a formal commercial quotation or RFQ deal proposal',
      completed: quotations.length > 0,
      actionLabel: '+ Create Quote',
      view: 'quotations',
      icon: FileSpreadsheet,
    },
    {
      id: 'step-store',
      number: '05',
      title: 'Launch Your Store',
      desc: 'Deploy your B2B digital storefront and share your catalog link',
      completed: isStorePublished,
      actionLabel: 'Launch Store',
      view: 'website-builder',
      icon: Store,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <div
      id="vyra-onboarding-container"
      className="max-w-4xl mx-auto py-8 px-4"
    >
      {/* Header Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
                Setup Sequence
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
                {completedCount} / 5 completed
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              WELCOME TO VYRA
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Your business command center is ready. Complete the onboarding sequence to activate global trade operations.
            </p>
          </div>

          <button
            type="button"
            onClick={onDismissToDashboard}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition shrink-0"
          >
            Enter Command Center →
          </button>
        </div>

        {/* Progress Tracker Bar */}
        <div className="pt-6">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
            <span>OPERATIONAL READINESS</span>
            <span className="font-bold text-slate-900 dark:text-white">{Math.round((completedCount / 5) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${(completedCount / 5) * 100}%` }}
              className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Onboarding Sequence Steps */}
      <div className="space-y-3">
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.id}
              onClick={() => onStepClick(st.view)}
              className={`p-4 sm:p-5 bg-white dark:bg-slate-900 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition ${
                st.completed
                  ? 'border-slate-200 dark:border-slate-800 opacity-90'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-500 dark:hover:border-slate-500 shadow-xs'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                {/* Step check icon */}
                <div className="mt-0.5 sm:mt-0 shrink-0">
                  {st.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                      {st.number}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {st.title}
                    </span>
                    {st.completed && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-mono">
                        COMPLETED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {st.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
                    st.completed
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <span>{st.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
