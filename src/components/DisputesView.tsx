import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Plus,
  X,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { OrderReturn, OrderDispute, Order } from '../types';
import {
  fetchOrderReturns,
  createOrderReturn,
  updateOrderReturnStatus,
  fetchOrderDisputes,
  createOrderDispute,
  fetchBusinessOrders,
} from '../lib/db';
import { useAuth } from '../context/AuthContext';

export const DisputesView: React.FC = () => {
  const { currentBusiness } = useAuth();
  const [activeTab, setActiveTab] = useState<'returns' | 'disputes'>('returns');
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [disputes, setDisputes] = useState<OrderDispute[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // New return modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [returnReason, setReturnReason] = useState('DAMAGED_IN_TRANSIT');
  const [returnAmount, setReturnAmount] = useState(0);
  const [returnNotes, setReturnNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const [rets, disps, ords] = await Promise.all([
        fetchOrderReturns(currentBusiness.id),
        fetchOrderDisputes(currentBusiness.id),
        fetchBusinessOrders(currentBusiness.id),
      ]);
      setReturns(rets);
      setDisputes(disps);
      setOrders(ords);
      if (ords.length > 0 && !selectedOrderId) {
        setSelectedOrderId(ords[0].id);
        setReturnAmount(ords[0].total_amount);
      }
    } catch (err) {
      console.error('Failed to load returns/disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness]);

  const handleUpdateReturnStatus = async (id: string, status: OrderReturn['status']) => {
    await updateOrderReturnStatus(id, status);
    setReturns((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !selectedOrderId) return;
    const ord = orders.find((o) => o.id === selectedOrderId);
    if (!ord) return;

    setSubmitting(true);
    try {
      await createOrderReturn({
        order_id: ord.id,
        order_number: ord.order_number || ord.id.slice(0, 8),
        business_id: currentBusiness.id,
        customer_name: ord.customer_name || 'Commercial Buyer',
        status: 'REQUESTED',
        reason: returnReason,
        description: returnNotes,
        refund_amount: Number(returnAmount) || ord.total_amount,
        currency: ord.currency || 'USD',
      });

      setIsReturnModalOpen(false);
      setReturnNotes('');
      await loadData();
    } catch (err) {
      console.error('Failed to submit return:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Returns, Refunds & Commercial Disputes
            </h1>
            <p className="text-xs text-slate-500">
              Manage Return Merchandise Authorizations (RMA), inspection audits, and escrow settlements
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsReturnModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Authorize RMA / Return</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'returns'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RMAs & Returns ({returns.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'disputes'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Disputes & Claims ({disputes.length})</span>
        </button>
      </div>

      {/* Tab 1: Returns Table */}
      {activeTab === 'returns' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading returns...</div>
          ) : returns.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No return merchandise authorizations on file.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3 pl-4">RMA ID & Order</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Refund Amount</th>
                    <th className="p-3">Filed Date</th>
                    <th className="p-3 pr-4 text-right">Settlement Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {returns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="font-mono font-bold text-slate-900">
                          RMA-{ret.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Order: {ret.order_id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-800">
                        {ret.reason.replace(/_/g, ' ')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            ret.status === 'REFUNDED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ret.status === 'APPROVED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : ret.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {ret.status}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        ${ret.refund_amount} {ret.currency}
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(ret.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 pr-4 text-right space-x-1.5">
                        {ret.status === 'REQUESTED' && (
                          <>
                            <button
                              onClick={() => handleUpdateReturnStatus(ret.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold"
                            >
                              Approve Return
                            </button>
                            <button
                              onClick={() => handleUpdateReturnStatus(ret.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {ret.status === 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateReturnStatus(ret.id, 'REFUNDED')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold"
                          >
                            Mark Refund Settled
                          </button>
                        )}
                        {ret.status === 'REFUNDED' && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Settled</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Disputes Table */}
      {activeTab === 'disputes' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {disputes.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Zero active commercial disputes. Your account has a 100% dispute-free rating.
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {disputes.map((d) => (
                <div key={d.id} className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{d.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{d.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE RETURN MODAL */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Authorize Return (RMA)</h3>
              <button onClick={() => setIsReturnModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Associated Order *</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value);
                    const match = orders.find((o) => o.id === e.target.value);
                    if (match) setReturnAmount(match.total_amount);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      Order {o.id.slice(0, 8)} — ${o.total_amount} ({o.customer_name || 'Buyer'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Return Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                >
                  <option value="DAMAGED_IN_TRANSIT">Damaged during international transit</option>
                  <option value="DEFECTIVE_BATCH">Defective batch / tolerance mismatch</option>
                  <option value="WRONG_ITEM">Incorrect product specification shipped</option>
                  <option value="BUYER_CANCELLATION">Commercial cancellation before dispatch</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Refund Amount ($)</label>
                <input
                  type="number"
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Inspection Notes</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Notes from warehouse receiving inspection or laboratory quality report..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-3 py-2 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl"
                >
                  {submitting ? 'Creating...' : 'Create RMA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
