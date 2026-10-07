import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchBusinessFollowUps, createFollowUp, updateFollowUp, fetchBusinessLeads } from '../lib/db';
import { FollowUp, Lead, Quotation } from '../types';
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Mail,
  MessageSquare,
  Phone,
  Copy,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface FollowUpsViewProps {
  initialQuotation?: Quotation | null;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({ initialQuotation }) => {
  const { currentBusiness } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed' | 'Missed'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [sequenceNumber, setSequenceNumber] = useState<number>(1);
  const [channel, setChannel] = useState<'Email' | 'WhatsApp' | 'Phone'>('Email');
  const [messageDraft, setMessageDraft] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Copy indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchBusinessFollowUps(currentBusiness.id),
      fetchBusinessLeads(currentBusiness.id),
    ])
      .then(([f, l]) => {
        setFollowUps(f);
        setLeads(l);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentBusiness]);

  useEffect(() => {
    if (initialQuotation) {
      openModalForQuotation(initialQuotation);
    }
  }, [initialQuotation]);

  const openModalForQuotation = (q: Quotation) => {
    setSelectedLeadId(q.buyer_id || '');
    setTitle(`Follow-up on Quote ${q.quote_number}: Review & Logistics Schedule`);
    const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    setScheduledDate(in3Days);
    setSequenceNumber(1);
    setChannel('Email');
    setMessageDraft(
      `Dear ${q.buyer_name},\n\nI hope you are having a productive week. Following our quotation ${q.quote_number} for ${q.items[0]?.description || 'your requested materials'}, our factory export team has reserved an allocation slot for CIF delivery.\n\nCould you please let us know if you require any physical stone samples or test certificates before we finalize the container booking?\n\nBest regards,\n${currentBusiness?.owner_name || 'Commercial Director'}`
    );
    setIsModalOpen(true);
  };

  const handleGenerateAIDraft = async () => {
    const lead = leads.find((l) => l.id === selectedLeadId);
    setIsAiDrafting(true);
    setModalError(null);
    try {
      const res = await fetch('/api/ai/generate-follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead?.name || 'Valued Client',
          company: lead?.company || 'Enterprise Partner',
          productInterest: lead?.product_interest || 'Commercial Goods',
          sequenceStep: sequenceNumber,
          channel,
          businessProfile: currentBusiness,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const raw = typeof data.error === 'string' ? data.error : data.error?.message || '';
        throw new Error(res.status === 503 || raw.toLowerCase().includes('not configured') ? 'AI NOT CONFIGURED' : (raw || 'AI generation failed'));
      }

      setMessageDraft(data.data.draft);
      if (data.data.subject && channel === 'Email') {
        setTitle(`Email: ${data.data.subject}`);
      }
    } catch (err: any) {
      setModalError(err.message || 'AI follow-up generation error');
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    if (!title.trim() || !scheduledDate) {
      setModalError('Title and Scheduled Date are required.');
      return;
    }

    const lead = leads.find((l) => l.id === selectedLeadId);
    try {
      const created = await createFollowUp({
        business_id: currentBusiness.id,
        lead_id: lead ? lead.id : undefined,
        lead_name: lead?.name,
        lead_company: lead?.company,
        scheduled_date: new Date(scheduledDate).toISOString(),
        status: 'Pending',
        title: title.trim(),
        sequence_number: sequenceNumber,
        channel,
        message_draft: messageDraft,
      });

      setFollowUps((prev) => [created, ...prev]);
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to schedule follow-up');
    }
  };

  const handleToggleComplete = async (f: FollowUp) => {
    const newStatus = f.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await updateFollowUp(f.id, { status: newStatus });
      setFollowUps((prev) => prev.map((item) => (item.id === f.id ? { ...item, status: newStatus } : item)));
    } catch (err) {
      console.error('Follow-up status update error:', err);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = followUps.filter((f) => {
    if (statusFilter === 'All') return true;
    return f.status === statusFilter;
  });

  return (
    <div id="followups-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Follow-up Cadence</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automate high-converting B2B outreach cadences (Day 1, Day 3, Day 7, Day 14) with pre-filled AI messaging drafts.
          </p>
        </div>
        <button
          id="btn-new-followup"
          type="button"
          onClick={() => {
            setSelectedLeadId('');
            setTitle('Scheduled Touchpoint: Review Specifications');
            setScheduledDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
            setSequenceNumber(1);
            setChannel('Email');
            setMessageDraft('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Schedule Follow-up
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['All', 'Pending', 'Completed', 'Missed'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusFilter === tab
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab} ({tab === 'All' ? followUps.length : followUps.filter((f) => f.status === tab).length})
          </button>
        ))}
      </div>

      {/* Follow-ups List */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No follow-ups found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Keep your pipeline warm by scheduling touches after sending quotes or initial lead conversations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((f) => {
            const isCompleted = f.status === 'Completed';
            return (
              <div
                key={f.id}
                id={`followup-card-${f.id}`}
                className={`p-5 rounded-2xl border transition bg-white flex flex-col justify-between shadow-xs ${
                  isCompleted ? 'border-slate-200 opacity-75' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(f)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-emerald-500'
                        }`}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <h4 className={`text-xs font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {f.title}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {f.lead_company || f.lead_name || 'Prospect'}
                          {f.quote_number && ` • Ref: ${f.quote_number}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Touch #{f.sequence_number || 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Due: {new Date(f.scheduled_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      {f.channel === 'WhatsApp' ? (
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      ) : f.channel === 'Phone' ? (
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                      {f.channel}
                    </span>
                  </div>

                  {f.message_draft && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 font-mono text-[11px] relative max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {f.message_draft}
                    </div>
                  )}
                </div>

                {f.message_draft && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                    <button
                      type="button"
                      onClick={() => copyText(f.message_draft!, f.id)}
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      {copiedId === f.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Message Draft</span>
                        </>
                      )}
                    </button>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {f.status}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Schedule Follow-up */}
      {isModalOpen && (
        <div id="followup-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">Schedule Commercial Follow-up</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between">
                  <span className="font-semibold">{modalError}</span>
                  <button type="button" onClick={() => setModalError(null)} className="text-red-500 hover:text-red-700">✕</button>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Client / Lead</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                >
                  <option value="">Select a Lead (optional)</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {l.company || l.country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Touchpoint Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Day 3: Verify Marble Slab Samples Delivery"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sequence Step</label>
                  <select
                    value={sequenceNumber}
                    onChange={(e) => setSequenceNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value={1}>Touch 1 (Day 1-2)</option>
                    <option value={2}>Touch 2 (Day 4-5)</option>
                    <option value={3}>Touch 3 (Day 7-10)</option>
                    <option value={4}>Touch 4 (Day 14-20)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Phone">Phone Call</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Message Draft</label>
                  <button
                    type="button"
                    onClick={handleGenerateAIDraft}
                    disabled={isAiDrafting}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isAiDrafting ? 'Drafting...' : 'AI Compose Draft'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Type or click 'AI Compose Draft' to automatically craft a contextual message..."
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
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
                  id="modal-btn-schedule-followup"
                  type="submit"
                  className="px-6 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
