import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchBusinessProducts, fetchBusinessLeads, fetchBusinessQuotations, fetchBusinessFollowUps } from '../lib/db';
import { Product, Lead, Quotation, FollowUp } from '../types';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const BusinessHealthView: React.FC = () => {
  const { currentBusiness } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchBusinessProducts(currentBusiness.id),
      fetchBusinessLeads(currentBusiness.id),
      fetchBusinessQuotations(currentBusiness.id),
      fetchBusinessFollowUps(currentBusiness.id),
    ])
      .then(([p, l, q, f]) => {
        setProducts(p);
        setLeads(l);
        setQuotations(q);
        setFollowUps(f);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentBusiness]);

  // Real Diagnostics Calculations
  const hasProducts = products.length > 0;
  const productsWithHsCode = products.filter((p) => p.hs_code && p.hs_code.length > 4).length;
  const productClarityScore = hasProducts
    ? Math.min(100, Math.round((productsWithHsCode / products.length) * 50 + (products.filter((p) => p.description && p.description.length > 20).length / products.length) * 50))
    : 20;

  const hasPricing = products.some((p) => p.price > 0 && p.currency);
  const pricingScore = hasPricing ? 85 : 30;

  const leadCount = leads.length;
  const pipelineHealthScore = leadCount >= 5 ? 90 : leadCount >= 2 ? 75 : leadCount === 1 ? 55 : 25;

  const pendingFollowups = followUps.filter((f) => f.status === 'Pending').length;
  const completedFollowups = followUps.filter((f) => f.status === 'Completed').length;
  const followUpDisciplineScore =
    followUps.length > 0 ? Math.min(100, Math.round((completedFollowups / followUps.length) * 50 + 40)) : 40;

  const overallHealth = Math.round(
    (productClarityScore + pricingScore + pipelineHealthScore + followUpDisciplineScore) / 4
  );

  return (
    <div id="business-health-view" className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Commercial Health Check</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Algorithmic operational audit analyzing catalog specification clarity, quotation velocity, and follow-up discipline.
        </p>
      </div>

      {/* Overall Score Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            Diagnostic Composite Index
          </span>
          <h2 className="text-3xl font-black tracking-tight mt-1 text-white">
            {overallHealth} <span className="text-lg text-slate-400 font-normal">/ 100</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            {overallHealth >= 75
              ? 'Your enterprise exhibits robust catalog readiness, active buyer qualification, and rigorous follow-up engagement.'
              : 'Action required: Complete product specifications (HS Codes, dimensions) and schedule systematic lead touches.'}
          </p>
        </div>
        <div className="p-4 bg-white/10 rounded-xl border border-white/10 shrink-0 text-center">
          <span className="text-[10px] font-bold text-slate-300 uppercase block">Status Tier</span>
          <span className="text-base font-black text-emerald-300">
            {overallHealth >= 80 ? 'Grade A: Export Ready' : overallHealth >= 60 ? 'Grade B: In Progress' : 'Grade C: Incomplete Setup'}
          </span>
        </div>
      </div>

      {/* Four Health Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Product Clarity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Product Clarity</span>
            <span className="text-blue-600">{productClarityScore}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${productClarityScore}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            {productsWithHsCode} / {products.length} products contain verified HS Codes & detailed crating notes.
          </p>
        </div>

        {/* Pricing Strategy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Pricing Strategy</span>
            <span className="text-indigo-600">{pricingScore}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pricingScore}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            Standard unit pricing configured in {currentBusiness?.currency || 'USD'} with MOQ thresholds.
          </p>
        </div>

        {/* Lead Pipeline Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Lead Pipeline</span>
            <span className="text-purple-600">{pipelineHealthScore}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pipelineHealthScore}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            {leadCount} commercial buyer accounts actively tracked in CRM.
          </p>
        </div>

        {/* Follow-up Discipline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Follow-up Cadence</span>
            <span className="text-emerald-600">{followUpDisciplineScore}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${followUpDisciplineScore}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            {completedFollowups} completed client touchpoints logged.
          </p>
        </div>
      </div>

      {/* Strategic Improvement Checklist */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Recommended Strategic Operational Improvements
        </h3>
        <div className="space-y-2.5">
          <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-3 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Standardize HS Codes across your catalog</span>
              <p className="text-slate-500 mt-0.5">
                Having accurate HS codes (e.g. 68022190 for worked marble) prevents port customs delays and expedites CIF import clearance.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-3 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Enforce Day-3 Sample Verification Touchpoint</span>
              <p className="text-slate-500 mt-0.5">
                Always schedule Touch #2 within 72 hours of quote dispatch to verify if physical material cuts or CAD stone models are required.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-3 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Specify Precise Incoterms on All Proformas</span>
              <p className="text-slate-500 mt-0.5">
                Explicitly stating "CIF Port of Miami (Incoterms 2020)" reduces foreign trade disputes and speeds up letter of credit (L/C) approvals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
