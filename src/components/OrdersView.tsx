import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchBusinessOrders,
  createOrder,
  updateOrder,
  fetchBusinessQuotations,
  fetchBusinessInvoices,
  createInvoice,
  updateInvoiceStatus,
  fetchBankAccounts,
} from '../lib/db';
import { Order, OrderStatus, Quotation, Invoice, BankAccount } from '../types';
import {
  ShoppingBag,
  Plus,
  Truck,
  CheckCircle2,
  DollarSign,
  Package,
  X,
  ArrowRight,
  ShieldCheck,
  FileText,
  CreditCard,
  Landmark,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface OrdersViewProps {
  onNavigateToLogistics?: (trackingNumber?: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onNavigateToLogistics }) => {
  const { currentBusiness, apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'invoices'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Order
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState<OrderStatus>('Order Confirmed');
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Advance Paid' | 'Fully Paid'>('Advance Paid');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('Maersk Line');
  const [blNumber, setBlNumber] = useState('');
  const [containerNumber, setContainerNumber] = useState('');
  const [productionNotes, setProductionNotes] = useState('Slabs inspected and crated in heavy timber with moisture barrier.');

  // Payment Modal State
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'Stripe' | 'Razorpay' | 'PayPal' | 'Wire'>('Wire');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const stages: OrderStatus[] = [
    'Order Confirmed',
    'Payment Received',
    'In Production',
    'Quality Check',
    'Packaging',
    'Dispatched',
    'In Transit',
    'Delivered',
  ];

  useEffect(() => {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setCurrency(currentBusiness.currency || 'USD');
    Promise.all([
      fetchBusinessOrders(currentBusiness.id),
      fetchBusinessQuotations(currentBusiness.id),
      fetchBusinessInvoices(currentBusiness.id),
      fetchBankAccounts(currentBusiness.id),
    ])
      .then(([o, q, invs, banks]) => {
        setOrders(o);
        setQuotations(q);
        setInvoices(invs);
        setBankAccounts(banks);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentBusiness]);

  const openCreateModal = () => {
    setFormError(null);
    const nextNum = `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`;
    setOrderNumber(nextNum);
    setBuyerName('');
    setBuyerCompany('');
    setTotalAmount('');
    setCurrency(currentBusiness?.currency || 'USD');
    setStatus('Order Confirmed');
    setPaymentStatus('Advance Paid');
    setTrackingNumber('');
    setCarrier('Maersk Container Line');
    setBlNumber('');
    setContainerNumber('');
    setProductionNotes('');
    setIsModalOpen(true);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!currentBusiness) return;
    if (!orderNumber.trim() || !buyerName.trim() || totalAmount === '') {
      setFormError('Order number, Buyer name, and Total Amount are required.');
      return;
    }

    try {
      const created = await createOrder({
        business_id: currentBusiness.id,
        order_number: orderNumber.trim(),
        buyer_name: buyerName.trim(),
        buyer_company: buyerCompany.trim() || undefined,
        total_amount: Number(totalAmount),
        currency,
        status,
        payment_status: paymentStatus,
        tracking_number: trackingNumber.trim() || undefined,
        carrier: carrier.trim() || undefined,
        bl_number: blNumber.trim() || undefined,
        container_number: containerNumber.trim() || undefined,
        production_notes: productionNotes.trim() || undefined,
      });

      setOrders((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setNoticeMessage({ type: 'success', text: `Commercial Order ${created.order_number} created successfully!` });
      setTimeout(() => setNoticeMessage(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save order');
    }
  };

  const handleAdvanceStage = async (order: Order) => {
    const currentIndex = stages.indexOf(order.status);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      try {
        await updateOrder(order.id, { status: nextStage });
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: nextStage } : o)));
      } catch (err) {
        console.error('Advance error:', err);
      }
    }
  };

  const handleGenerateInvoiceForOrder = async (order: Order) => {
    if (!currentBusiness) return;
    try {
      const invNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const created = await createInvoice(
        {
          business_id: currentBusiness.id,
          order_id: order.id,
          invoice_number: invNumber,
          customer_name: order.buyer_name || 'Valued Customer',
          customer_company: order.buyer_company || '',
          customer_email: '',
          currency: order.currency || 'USD',
          subtotal: order.total_amount,
          tax_rate: 0,
          tax_amount: 0,
          discount_amount: 0,
          shipping_fee: 0,
          total_amount: order.total_amount,
          amount_paid: order.payment_status === 'Fully Paid' ? order.total_amount : 0,
          payment_status: order.payment_status === 'Fully Paid' ? 'Paid' : 'Issued',
          due_date: dueDate.toISOString().split('T')[0],
          notes: `Commercial invoice for contract ${order.order_number}`,
          terms: 'Payment due upon receipt or via confirmed letter of credit (L/C) / direct wire.',
          items: [
            {
              description: `Commercial Goods as per contract ${order.order_number}`,
              quantity: 1,
              unit_price: order.total_amount,
              total_price: order.total_amount,
            },
          ],
        },
        [
          {
            description: `Commercial Goods as per contract ${order.order_number}`,
            quantity: 1,
            unit_price: order.total_amount,
            total_price: order.total_amount,
          },
        ]
      );

      setInvoices((prev) => [created, ...prev]);
      setActiveTab('invoices');
      setNoticeMessage({ type: 'success', text: `Invoice ${invNumber} generated successfully for ${order.order_number}!` });
      setTimeout(() => setNoticeMessage(null), 5000);
    } catch (err: any) {
      setNoticeMessage({ type: 'error', text: `Failed to generate invoice: ${err.message}` });
      setTimeout(() => setNoticeMessage(null), 6000);
    }
  };

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setPaymentResult(null);
    setIsPaymentModalOpen(true);
  };

  const handleInitiatePayment = async () => {
    if (!selectedInvoiceForPayment || !currentBusiness) return;
    setIsProcessingPayment(true);
    setPaymentResult(null);

    if (paymentProvider === 'Wire') {
      setIsProcessingPayment(false);
      setPaymentResult({
        success: true,
        message: 'Wire transfer instructions generated. Buyer can transfer funds to the verified corporate bank account below.',
      });
      return;
    }

    try {
      const res = await apiFetch('/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          business_id: currentBusiness.id,
          order_id: selectedInvoiceForPayment.order_id || selectedInvoiceForPayment.id,
          invoice_id: selectedInvoiceForPayment.id,
          amount: selectedInvoiceForPayment.total_amount,
          currency: selectedInvoiceForPayment.currency,
          preferredProvider: paymentProvider.toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!data.configured || !data.success) {
        setPaymentResult({
          success: false,
          message: 'PAYMENT PROVIDER NOT CONFIGURED',
        });
      } else {
        setPaymentResult({
          success: true,
          message: `Payment intent created successfully via ${paymentProvider}. Reference ID: ${data.intentId || data.orderId || 'ready'}. Please authorize payment through secure gateway.`,
        });
      }
    } catch (err: any) {
      setPaymentResult({
        success: false,
        message: 'PAYMENT PROVIDER NOT CONFIGURED',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div id="orders-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Order Lifecycle & Invoicing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track milestones from factory production and customs through sea freight, commercial invoicing, and payments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-create-order"
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </button>
        </div>
      </div>

      {noticeMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          noticeMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {noticeMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{noticeMessage.text}</span>
          </div>
          <button onClick={() => setNoticeMessage(null)} className="ml-3 text-slate-500 hover:text-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'orders' ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Active Orders ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'invoices' ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Commercial Invoices ({invoices.length})</span>
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No Orders in Pipeline</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Convert an accepted quotation to an order or create a new commercial contract.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Create First Order
              </button>
            </div>
          ) : (
            orders.map((o) => {
              const currentStageIndex = stages.indexOf(o.status);
              return (
                <div key={o.id} id={`order-card-${o.id}`} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-slate-900">{o.order_number}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {o.status}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            o.payment_status === 'Fully Paid'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {o.payment_status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Buyer: <strong>{o.buyer_name}</strong> {o.buyer_company ? `(${o.buyer_company})` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900">
                        {o.total_amount.toLocaleString()} {o.currency}
                      </span>
                      <p className="text-[11px] text-slate-400">Total Contract Value</p>
                    </div>
                  </div>

                  {/* Milestones Progress Tracker */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                      <span>Manufacturing & Shipment Milestones</span>
                      <span>Stage {currentStageIndex + 1} of {stages.length}</span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {stages.map((st, idx) => {
                        const isDone = idx <= currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        return (
                          <div
                            key={st}
                            className={`p-2 rounded-lg text-center text-[10px] font-semibold border transition ${
                              isCurrent
                                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            {st}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shipment Details & Logistics */}
                  {(o.carrier || o.bl_number || o.container_number || o.production_notes) && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-xs text-slate-700">
                      {o.carrier && (
                        <div>
                          <span className="font-bold text-slate-500 block text-[10px] uppercase">Shipping Carrier</span>
                          <span>{o.carrier}</span>
                        </div>
                      )}
                      {o.bl_number && (
                        <div>
                          <span className="font-bold text-slate-500 block text-[10px] uppercase">Bill of Lading (B/L)</span>
                          <span className="font-mono">{o.bl_number}</span>
                        </div>
                      )}
                      {o.container_number && (
                        <div>
                          <span className="font-bold text-slate-500 block text-[10px] uppercase">Container #</span>
                          <span className="font-mono">{o.container_number}</span>
                        </div>
                      )}
                      {o.production_notes && (
                        <div className="sm:col-span-4 pt-1 text-[11px] text-slate-600 border-t border-slate-200">
                          <strong>Quality & Dispatch Notes:</strong> {o.production_notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateInvoiceForOrder(o)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Generate Commercial Invoice</span>
                      </button>

                      {onNavigateToLogistics && (
                        <button
                          type="button"
                          onClick={() => onNavigateToLogistics(o.tracking_number)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                        >
                          <Truck className="w-3.5 h-3.5 text-blue-600" />
                          <span>{o.tracking_number ? 'Track in Logistics Hub' : 'Ship with VYRA Logistics'}</span>
                        </button>
                      )}
                    </div>

                    {currentStageIndex < stages.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStage(o)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                      >
                        <span>Advance to &quot;{stages[currentStageIndex + 1]}&quot;</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: INVOICES & PAYMENTS */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No Invoices Issued</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Switch to the Orders tab and click &quot;Generate Commercial Invoice&quot; on any active contract.
              </p>
            </div>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-slate-900">{inv.invoice_number}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          inv.payment_status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : inv.payment_status === 'Partially Paid'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {inv.payment_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Customer: <strong>{inv.customer_name}</strong> {inv.customer_company ? `(${inv.customer_company})` : ''} • Due: {inv.due_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900">
                      {inv.total_amount.toLocaleString()} {inv.currency}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Paid: {inv.amount_paid.toLocaleString()} {inv.currency}
                    </p>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Billed Items</div>
                  {inv.items && inv.items.length > 0 ? (
                    inv.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-700">
                        <span>{it.description} (x{it.quantity})</span>
                        <span className="font-mono font-bold">{it.total_price.toLocaleString()} {inv.currency}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">Contract items as per agreed specifications.</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPayment(inv)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Collect / Wire Payment</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">ID: {inv.id.slice(0, 8)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Create Order */}
      {isModalOpen && (
        <div id="order-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Create Commercial Order</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between">
                  <span>{formError}</span>
                  <button type="button" onClick={() => setFormError(null)} className="ml-2 font-bold text-red-500 hover:text-red-800">✕</button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Order Number *</label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Buyer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Buyer Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Stone Imports LLC"
                    value={buyerCompany}
                    onChange={(e) => setBuyerCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Amount *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    {stages.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Advance Paid">Advance Paid (e.g. 30%)</option>
                    <option value="Fully Paid">Fully Paid</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Export Shipping & Ocean Freight Metadata
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Carrier / Line</label>
                    <input
                      type="text"
                      placeholder="e.g. Maersk / MSC"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bill of Lading (B/L)</label>
                    <input
                      type="text"
                      placeholder="e.g. MAEU98234123"
                      value={blNumber}
                      onChange={(e) => setBlNumber(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Container Number</label>
                    <input
                      type="text"
                      placeholder="e.g. MSKU4819201"
                      value={containerNumber}
                      onChange={(e) => setContainerNumber(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  Save Commercial Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Collect Payment & Wire Instructions */}
      {isPaymentModalOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Collect Payment for {selectedInvoiceForPayment.invoice_number}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Invoice Balance Due:</span>
                  <div className="text-xl font-black text-slate-900">
                    {selectedInvoiceForPayment.total_amount.toLocaleString()} {selectedInvoiceForPayment.currency}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                  {selectedInvoiceForPayment.customer_name}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Payment Route</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentProvider('Wire')}
                    className={`p-3 rounded-xl border text-center transition ${
                      paymentProvider === 'Wire' ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Landmark className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs">Direct Wire</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentProvider('Stripe')}
                    className={`p-3 rounded-xl border text-center transition ${
                      paymentProvider === 'Stripe' ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span className="text-xs">Stripe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentProvider('Razorpay')}
                    className={`p-3 rounded-xl border text-center transition ${
                      paymentProvider === 'Razorpay' ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                    <span className="text-xs">Razorpay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentProvider('PayPal')}
                    className={`p-3 rounded-xl border text-center transition ${
                      paymentProvider === 'PayPal' ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span className="text-xs">PayPal</span>
                  </button>
                </div>
              </div>

              {/* Wire Instructions Box */}
              {paymentProvider === 'Wire' && (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Verified Corporate Disbursement Account
                  </div>
                  {bankAccounts.length > 0 ? (
                    <div className="space-y-1 font-mono text-[11px] pt-1 text-emerald-900">
                      <div>Bank: <strong>{bankAccounts[0].bank_name}</strong></div>
                      <div>Beneficiary: <strong>{bankAccounts[0].account_holder_name}</strong></div>
                      <div>Account: <strong>***{bankAccounts[0].last4}</strong></div>
                      <div>Currency: <strong>{bankAccounts[0].currency}</strong></div>
                      <div>Reference: <strong>{selectedInvoiceForPayment.invoice_number}</strong></div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-800">
                      Primary corporate account is active for {currentBusiness?.name}. Reference invoice # on wire memo.
                    </p>
                  )}
                </div>
              )}

              {paymentResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    paymentResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{paymentResult.message}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleInitiatePayment}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {isProcessingPayment ? 'Connecting Gateway...' : paymentProvider === 'Wire' ? 'Confirm Wire Details' : `Pay with ${paymentProvider}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
