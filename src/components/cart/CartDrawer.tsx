import React, { useState } from 'react';
import { useCart, SHIPPING_OPTIONS } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { submitCheckoutOrder, CheckoutOrderRequest } from '../../lib/db';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Bookmark,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Truck,
  Landmark,
  DollarSign,
  Tag,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Order, Invoice } from '../../types';

interface CartDrawerProps {
  onOrderCompleted?: (order: Order, invoice: Invoice) => void;
  onNavigateToOrders?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onOrderCompleted,
  onNavigateToOrders,
}) => {
  const { currentBusiness, user } = useAuth();
  const {
    items,
    savedForLater,
    appliedCoupon,
    subtotal,
    discountAmount,
    shippingOption,
    setShippingOption,
    shippingAmount,
    taxAmount,
    total,
    itemCount,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    saveForLater,
    moveToCart,
    applyCouponCode,
    removeCoupon,
    clearCart,
  } = useCart();

  // Checkout Mode States
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Checkout Form fields
  const [buyerName, setBuyerName] = useState(user?.full_name || currentBusiness?.owner_name || 'Alex Morgan');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || currentBusiness?.email || 'buyer@enterpriseglobal.com');
  const [buyerPhone, setBuyerPhone] = useState(currentBusiness?.phone || '+1 (555) 234-8901');
  const [buyerCompany, setBuyerCompany] = useState(currentBusiness?.name || 'Vanguard Procurement Group');
  const [shippingAddress, setShippingAddress] = useState('742 Industrial Boulevard, Suite 400');
  const [city, setCity] = useState('Chicago');
  const [country, setCountry] = useState('United States');
  const [postalCode, setPostalCode] = useState('60607');
  const [paymentMethod, setPaymentMethod] = useState<'Credit/Debit Card' | 'Escrow & Letter of Credit' | 'Bank Wire (SWIFT/SEPA)' | 'Instant UPI / NetBanking'>('Credit/Debit Card');
  const [orderNotes, setOrderNotes] = useState('Please palletize with moisture-barrier wrapping and corner protectors.');

  // Submission & Result States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{ order: Order; invoice: Invoice; orderNumber: string } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);
    if (!couponInput.trim()) return;

    const res = await applyCouponCode(couponInput.trim());
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!buyerName.trim() || !buyerEmail.trim() || !shippingAddress.trim() || !country.trim()) {
      setErrorMessage('Please complete all required shipping and contact fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const checkoutReq: CheckoutOrderRequest = {
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerCompany,
        shippingAddress,
        city,
        country,
        postalCode,
        shippingMethod: shippingOption,
        paymentMethod,
        orderNotes,
        couponCode: appliedCoupon?.code,
      };

      const result = await submitCheckoutOrder(checkoutReq, items, currentBusiness?.id);
      setCompletedOrder(result);
      clearCart();
      if (onOrderCompleted) {
        onOrderCompleted(result.order, result.invoice);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please review stock availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{isCheckingOut ? 'B2C Marketplace Checkout' : 'Shopping Cart'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-semibold">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isCheckingOut ? 'Review delivery details & instant payment' : 'Direct consumer purchase with verified escrow'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeCart}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Completed Order View */}
            {completedOrder ? (
              <div className="text-center py-8 space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Order reference: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{completedOrder.orderNumber}</span>
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tracking Number:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{completedOrder.order.tracking_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Carrier:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{completedOrder.order.carrier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Charged:</span>
                    <span className="font-bold text-slate-900 dark:text-white">${completedOrder.order.total_amount.toLocaleString()} {completedOrder.order.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Delivery:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{shippingOption.estimated_days}</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-left border border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Fulfillment Timeline
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Order Confirmed & Escrow Reserved</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">2</div>
                      <span>Warehouse Packing & Quality Inspection</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">3</div>
                      <span>Dispatched with {shippingOption.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCompletedOrder(null);
                      setIsCheckingOut(false);
                      closeCart();
                      if (onNavigateToOrders) onNavigateToOrders();
                    }}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-colors flex items-center gap-2"
                  >
                    <span>View in Orders Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : isCheckingOut ? (
              /* Checkout Form */
              <form onSubmit={handlePlaceOrder} className="space-y-5">
                {errorMessage && (
                  <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Section: Buyer & Delivery Address */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>1. Shipping Destination</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Company (Optional)</label>
                      <input
                        type="text"
                        value={buyerCompany}
                        onChange={(e) => setBuyerCompany(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Street Address *</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Country *</label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Carrier & Delivery Method */}
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>2. Delivery Carrier & Transit Speed</span>
                  </h3>
                  <div className="space-y-2">
                    {SHIPPING_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          shippingOption.id === opt.id
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={shippingOption.id === opt.id}
                            onChange={() => setShippingOption(opt)}
                            className="text-blue-600"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{opt.name}</p>
                            <p className="text-[11px] text-slate-500">{opt.estimated_days} • Live Tracking Included</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">${opt.price}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Section: Payment Method */}
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>3. Payment Gateway & Escrow Guarantee</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'Credit/Debit Card', icon: CreditCard, label: 'Credit / Debit Card' },
                      { id: 'Escrow & Letter of Credit', icon: ShieldCheck, label: 'Escrow Trade Guarantee' },
                      { id: 'Bank Wire (SWIFT/SEPA)', icon: Landmark, label: 'Bank Wire (SWIFT/SEPA)' },
                      { id: 'Instant UPI / NetBanking', icon: DollarSign, label: 'Instant NetBanking / UPI' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          paymentMethod === m.id
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <m.icon className="w-4 h-4 shrink-0" />
                        <span className="text-[11px] truncate">{m.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>VYRA Buyer Protection: Funds held securely in escrow until shipment delivery confirmation.</span>
                  </div>
                </div>

                {/* Section: Order Notes */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Special Packaging & Delivery Notes
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Confirming Order & Stock...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Pay ${total.toLocaleString()} & Confirm Order</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : items.length === 0 ? (
              /* Empty Cart */
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Your cart is currently empty
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    Explore verified products, consumer items, and wholesale offerings in the marketplace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              /* Cart Item List */
              <div className="space-y-4">
                {/* Free Shipping Notification Banner */}
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>Standard courier delivery to 180+ global destinations.</span>
                  </div>
                  <span className="font-bold text-blue-800 dark:text-blue-200 uppercase text-[10px]">Global Trade</span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => {
                    const maxStock = typeof item.product.stock_quantity === 'number' ? item.product.stock_quantity : 9999;
                    const isMaxStockReached = item.quantity >= maxStock;

                    return (
                      <div key={item.id} className="py-3.5 flex gap-3.5">
                        {/* Thumbnail */}
                        <div className="w-18 h-18 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
                          {item.product.images && item.product.images.length > 0 ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ShoppingBag className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {item.product.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.product_id)}
                                className="text-slate-400 hover:text-rose-500 p-1 rounded"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              SKU: {item.product.sku || 'N/A'} • {item.product.category || 'General'}
                            </p>
                            {typeof item.product.stock_quantity === 'number' && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                In stock: {item.product.stock_quantity} units
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1">
                            {/* Quantity Stepper */}
                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                title="Decrease"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={isMaxStockReached}
                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                                title="Increase"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                ${(item.unit_price * item.quantity).toLocaleString()}{' '}
                                <span className="text-[10px] font-normal text-slate-500">{item.currency}</span>
                              </p>
                              <button
                                type="button"
                                onClick={() => saveForLater(item.product_id)}
                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 justify-end mt-0.5"
                              >
                                <Bookmark className="w-2.5 h-2.5" />
                                <span>Save for later</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Saved For Later items */}
                {savedForLater.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Saved For Later ({savedForLater.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {savedForLater.map((sItem) => (
                        <div
                          key={sItem.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <div className="truncate pr-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{sItem.product.name}</p>
                            <p className="text-[10px] text-slate-500">${sItem.unit_price} each</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => moveToCart(sItem.product_id)}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shrink-0"
                          >
                            Move to Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer & Order Summary */}
          {!completedOrder && items.length > 0 && !isCheckingOut && (
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 space-y-3">
              {/* Coupon Bar */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. WELCOME10, BULK50)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase placeholder:normal-case font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  Apply
                </button>
              </form>

              {couponSuccess && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{couponSuccess}</span>
                </p>
              )}
              {couponError && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{couponError}</span>
                </p>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{appliedCoupon.code} applied</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-[10px] text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Cost Calculations */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">${subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount:</span>
                    <span>-${discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping ({shippingOption.name.split(' ')[0]}):</span>
                  <span>{shippingAmount === 0 ? <strong className="text-emerald-600">FREE</strong> : `$${shippingAmount}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated VAT / Duties (8%):</span>
                  <span>${taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Due:</span>
                  <span className="text-blue-600 dark:text-blue-400">${total.toLocaleString()} USD</span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                type="button"
                onClick={() => setIsCheckingOut(true)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>Proceed to Instant Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
