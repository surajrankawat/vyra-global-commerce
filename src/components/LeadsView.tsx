import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchBusinessLeads, createLead, updateLead, deleteLead, addLeadNote, fetchLeadNotes } from '../lib/db';
import { Lead, LeadStatus, LeadScoreTier, AILeadQualificationOutput } from '../types';
import {
  Users,
  Plus,
  Search,
  Sparkles,
  Edit2,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  X,
  Send,
} from 'lucide-react';

interface LeadsViewProps {
  onCreateQuoteForLead?: (lead: Lead) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ onCreateQuoteForLead }) => {
  const { currentBusiness } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Qualification State
  const [qualifyingLeadId, setQualifyingLeadId] = useState<string | null>(null);
  const [qualResult, setQualResult] = useState<{ leadId: string; data: AILeadQualificationOutput } | null>(null);

  // Lead Form
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState('United States');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [source, setSource] = useState('Trade Directory');
  const [productInterest, setProductInterest] = useState('');
  const [dealValue, setDealValue] = useState<number | ''>('');
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [leadScore, setLeadScore] = useState<number | ''>(60);
  const [scoreTier, setScoreTier] = useState<LeadScoreTier>('Medium');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [qualError, setQualError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setCurrency(currentBusiness.currency || 'USD');
    loadLeads();
  }, [currentBusiness]);

  const loadLeads = async () => {
    if (!currentBusiness) return;
    try {
      const data = await fetchBusinessLeads(currentBusiness.id);
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingLead(null);
    setName('');
    setCompany('');
    setCountry('United States');
    setEmail('');
    setPhone('');
    setWebsite('');
    setSource('Direct RFQ');
    setProductInterest('');
    setDealValue('');
    setCurrency(currentBusiness?.currency || 'USD');
    setStatus('New');
    setLeadScore(60);
    setScoreTier('Medium');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (l: Lead) => {
    setEditingLead(l);
    setName(l.name);
    setCompany(l.company || '');
    setCountry(l.country || '');
    setEmail(l.email || '');
    setPhone(l.phone || '');
    setWebsite(l.website || '');
    setSource(l.source || '');
    setProductInterest(l.product_interest || '');
    setDealValue(l.estimated_deal_value || '');
    setCurrency(l.currency || 'USD');
    setStatus(l.status);
    setLeadScore(l.lead_score || '');
    setScoreTier(l.score_tier || 'Medium');
    setNotes(l.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    if (!name.trim()) {
      setFormError('Contact name is required.');
      return;
    }

    setFormError(null);
    setLoading(true);

    try {
      if (editingLead) {
        await updateLead(editingLead.id, {
          name: name.trim(),
          company: company.trim() || undefined,
          country: country.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          source: source.trim() || undefined,
          product_interest: productInterest.trim() || undefined,
          estimated_deal_value: dealValue !== '' ? Number(dealValue) : 0,
          currency,
          status,
          lead_score: leadScore !== '' ? Number(leadScore) : undefined,
          score_tier: scoreTier,
          notes: notes.trim() || undefined,
        });
      } else {
        await createLead({
          business_id: currentBusiness.id,
          name: name.trim(),
          company: company.trim() || 'Direct Buyer',
          country: country.trim() || 'International',
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          source: source.trim() || 'Direct Inquiry',
          product_interest: productInterest.trim() || undefined,
          estimated_deal_value: dealValue !== '' ? Number(dealValue) : 0,
          currency,
          status,
          lead_score: leadScore !== '' ? Number(leadScore) : 50,
          score_tier: scoreTier,
          notes: notes.trim() || undefined,
        });
      }

      await loadLeads();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save lead.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (id: string, leadName: string) => {
    if (!confirm(`Delete lead "${leadName}"?`)) return;
    try {
      await deleteLead(id);
      await loadLeads();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleAIQualify = async (lead: Lead) => {
    setQualifyingLeadId(lead.id);
    setQualError(null);
    try {
      const response = await fetch('/api/ai/qualify-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          businessProfile: currentBusiness,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        const raw = typeof resData.error === 'string' ? resData.error : resData.error?.message || '';
        throw new Error(response.status === 503 || raw.toLowerCase().includes('not configured') ? 'AI NOT CONFIGURED' : (raw || 'Qualification failed'));
      }

      const qual: AILeadQualificationOutput = resData.data;
      setQualResult({ leadId: lead.id, data: qual });

      const scoreVal = qual.score ?? qual.buying_intent_score ?? 50;
      // Automatically update lead with score and tier
      await updateLead(lead.id, {
        lead_score: scoreVal,
        score_tier: scoreVal >= 75 ? 'High' : scoreVal >= 50 ? 'Medium' : 'Low',
        status: qual.qualification_status === 'Qualified' ? 'Qualified' : lead.status,
      });

      await loadLeads();
    } catch (err: any) {
      setQualError(err.message || 'AI Qualification failed');
    } finally {
      setQualifyingLeadId(null);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      l.name.toLowerCase().includes(query) ||
      (l.company && l.company.toLowerCase().includes(query)) ||
      (l.country && l.country.toLowerCase().includes(query)) ||
      (l.product_interest && l.product_interest.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    const matchesTier = tierFilter === 'All' || l.score_tier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  return (
    <div id="leads-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leads & CRM Pipeline</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track prospective importers, contractor accounts, automated lead qualification, and convert deals to quotations.
          </p>
        </div>
        <button
          id="btn-add-lead"
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {qualError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span className="font-semibold">{qualError}</span>
          <button type="button" onClick={() => setQualError(null)} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="leads-search-input"
            type="text"
            placeholder="Search leads by contact, company, country, or interest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            id="leads-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
          >
            <option value="All">All Pipeline Stages</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Quotation Sent">Quotation Sent</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
          <select
            id="leads-tier-filter"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
          >
            <option value="All">All Score Tiers</option>
            <option value="High">High Score</option>
            <option value="Medium">Medium Score</option>
            <option value="Low">Low Score</option>
          </select>
        </div>
      </div>

      {/* Lead Qualification Result Drawer/Modal */}
      {qualResult && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl border border-blue-700 shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-blue-700/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm">AI Lead Qualification Result</h3>
            </div>
            <button
              type="button"
              onClick={() => setQualResult(null)}
              className="text-blue-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 text-xs">
            <div>
              <span className="text-blue-300 uppercase text-[10px] font-bold">Qualification Status</span>
              <div className="text-base font-bold mt-0.5 text-white">
                {qualResult.data.qualification_status}
              </div>
            </div>
            <div>
              <span className="text-blue-300 uppercase text-[10px] font-bold">Opportunity Score</span>
              <div className="text-base font-bold mt-0.5 text-amber-300">
                {qualResult.data.score} / 100
              </div>
            </div>
            <div>
              <span className="text-blue-300 uppercase text-[10px] font-bold">Buying Intent</span>
              <div className="text-base font-bold mt-0.5 text-white">
                {qualResult.data.intent_level}
              </div>
            </div>
            <div>
              <span className="text-blue-300 uppercase text-[10px] font-bold">Recommended Action</span>
              <div className="text-xs font-semibold mt-0.5 text-white">
                {qualResult.data.recommended_action}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-700/60 text-xs">
            <span className="text-blue-300 uppercase text-[10px] font-bold">Fit Assessment</span>
            <p className="text-slate-100 mt-1">{qualResult.data.fit_explanation}</p>
          </div>

          {qualResult.data.outreach_message && (
            <div className="mt-3 pt-2 text-xs">
              <span className="text-blue-300 uppercase text-[10px] font-bold">Suggested AI Response Draft</span>
              <div className="mt-1 p-2.5 bg-blue-950/70 border border-blue-800 rounded-lg text-slate-200 font-mono text-[11px] whitespace-pre-wrap">
                {qualResult.data.outreach_message}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No leads found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {leads.length === 0
              ? 'Add your first prospective client or run Buyer Discovery to populate potential customers.'
              : 'No leads match your current search or status filter.'}
          </p>
          {leads.length === 0 && (
            <button
              id="btn-add-first-lead"
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
            >
              Add First Lead
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Lead / Company</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Product Interest</th>
                  <th className="px-4 py-3">Deal Value</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((l) => (
                  <tr key={l.id} id={`lead-row-${l.id}`} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{l.name}</div>
                      <div className="text-[11px] text-slate-500">{l.company || 'Individual Buyer'}</div>
                      {l.email && <div className="text-[10px] text-slate-400">{l.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {l.country || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">
                      {l.product_interest || 'General Inquiry'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {l.estimated_deal_value
                        ? `${l.estimated_deal_value.toLocaleString()} ${l.currency}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          l.status === 'Won'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'Lost'
                            ? 'bg-red-100 text-red-800'
                            : l.status === 'Qualified'
                            ? 'bg-indigo-100 text-indigo-800'
                            : l.status === 'Quotation Sent'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {l.lead_score !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            l.score_tier === 'High' ? 'bg-emerald-500' : l.score_tier === 'Medium' ? 'bg-amber-500' : 'bg-slate-400'
                          }`} />
                          <span className="font-bold text-slate-800">{l.lead_score}</span>
                          <span className="text-[10px] text-slate-400">({l.score_tier})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unscored</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Qualify Button */}
                        <button
                          id={`btn-qualify-lead-${l.id}`}
                          type="button"
                          onClick={() => handleAIQualify(l)}
                          disabled={qualifyingLeadId === l.id}
                          title="Run AI Qualification"
                          className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold transition"
                        >
                          <Sparkles className={`w-3 h-3 ${qualifyingLeadId === l.id ? 'animate-spin' : ''}`} />
                          <span>{qualifyingLeadId === l.id ? 'Scoring...' : 'Qualify'}</span>
                        </button>

                        {/* Create Quote Button */}
                        <button
                          id={`btn-create-quote-for-${l.id}`}
                          type="button"
                          onClick={() => onCreateQuoteForLead && onCreateQuoteForLead(l)}
                          title="Generate Formal Quotation"
                          className="flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold transition"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Quote</span>
                        </button>

                        <button
                          id={`btn-edit-lead-${l.id}`}
                          type="button"
                          onClick={() => openEditModal(l)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          id={`btn-delete-lead-${l.id}`}
                          type="button"
                          onClick={() => handleDeleteLead(l.id, l.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Lead */}
      {isModalOpen && (
        <div id="lead-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">
                  {editingLead ? 'Edit Lead Profile' : 'Add New Commercial Lead'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Name *</label>
                  <input
                    id="modal-lead-name"
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    id="modal-lead-company"
                    type="text"
                    placeholder="e.g. Vance Luxury Surfaces LLC"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                  <input
                    id="modal-lead-country"
                    type="text"
                    placeholder="e.g. United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    id="modal-lead-email"
                    type="email"
                    placeholder="procurement@vance.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    id="modal-lead-phone"
                    type="text"
                    placeholder="+1 312 555 0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lead Source</label>
                  <input
                    id="modal-lead-source"
                    type="text"
                    placeholder="e.g. Trade Fair, Directory, Direct RFQ"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Interest</label>
                  <input
                    id="modal-lead-interest"
                    type="text"
                    placeholder="e.g. Bookmatched Marble Slabs (350 sqm)"
                    value={productInterest}
                    onChange={(e) => setProductInterest(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Est. Deal Value</label>
                  <input
                    id="modal-lead-value"
                    type="number"
                    placeholder="58000"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pipeline Stage</label>
                  <select
                    id="modal-lead-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Quotation Sent">Quotation Sent</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Score Tier</label>
                  <select
                    id="modal-lead-tier"
                    value={scoreTier}
                    onChange={(e) => setScoreTier(e.target.value as LeadScoreTier)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CRM Notes & Background</label>
                <textarea
                  id="modal-lead-notes"
                  rows={2}
                  placeholder="Architectural specs approved, requested CIF pricing with sample slabs..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="modal-lead-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {editingLead ? 'Save Lead' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
