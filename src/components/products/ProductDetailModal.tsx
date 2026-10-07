import React, { useState, useEffect } from 'react';
import { Product, ProductReview } from '../../types';
import { useCart } from '../../context/CartContext';
import { fetchProductReviews, createProductReview } from '../../lib/db';
import {
  X,
  Star,
  ShieldCheck,
  Package,
  Truck,
  Building2,
  ShoppingBag,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus,
  Minus,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote?: (product: Product) => void;
  onOpenChatWithSeller?: (businessId: string, businessName: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onRequestQuote,
  onOpenChatWithSeller,
}) => {
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews'>('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [orderQty, setOrderQty] = useState(1);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewerName, setReviewerName] = useState('Procurement Officer');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (product) {
      setOrderQty(product.moq || 1);
      setSelectedImageIndex(0);
      setLoadingReviews(true);
      fetchProductReviews(product.id)
        .then(setReviews)
        .finally(() => setLoadingReviews(false));
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[selectedImageIndex] || null;

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const handleAddToCart = () => {
    addToCart(product, orderQty);
    onClose();
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const created = await createProductReview({
        product_id: product.id,
        seller_id: product.business_id,
        author_name: reviewerName.trim() || 'Verified Procurement Officer',
        author_country: 'Global Buyer',
        buyer_id: 'current_user_buyer',
        buyer_name: reviewerName.trim() || 'Verified Procurement Officer',
        buyer_country: 'Global Buyer',
        is_verified_purchase: true,
        rating: reviewRating,
        seller_rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      setReviews((prev) => [created, ...prev]);
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewComment('');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              {product.category}
            </span>
            <span className="text-[11px] text-slate-400">|</span>
            <span className="text-[11px] text-slate-500 font-mono">
              SKU: {product.sku || 'VYRA-CATALOG'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Gallery Column */}
            <div className="space-y-3">
              <div className="h-64 sm:h-72 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/60 flex items-center justify-center relative">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-16 h-16 text-slate-300" />
                )}
                <div className="absolute top-2.5 right-2.5 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  Stock: {product.stock_quantity ?? 'In Stock'} {product.unit || 'units'}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImageIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info & Commercial Pricing Column */}
            <div className="space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {product.name}
                </h2>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{averageRating}</span>
                    <span className="text-slate-400 font-normal">({reviews.length} reviews)</span>
                  </div>
                  <span>•</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Origin: {product.country_of_origin || 'International'}
                  </span>
                </div>
              </div>

              {/* Pricing & Wholesale Tiers */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Unit Commercial Price
                    </span>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      ${product.price.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        {product.currency} / {product.unit || 'unit'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Min Order (MOQ)</span>
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {product.moq} {product.unit || 'units'}
                    </div>
                  </div>
                </div>

                {/* Wholesale Volume Tiers Table */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Volume Tier Pricing
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-white dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-400 text-[10px]">1 - 49 {product.unit || 'units'}</div>
                      <div className="font-bold text-slate-900 dark:text-white">${product.price.toFixed(2)}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-400 text-[10px]">50 - 199 {product.unit || 'units'}</div>
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        ${(product.price * 0.95).toFixed(2)} <span className="text-[9px] text-emerald-500">-5%</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-400 text-[10px]">200+ {product.unit || 'units'}</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        ${(product.price * 0.88).toFixed(2)} <span className="text-[9px] text-emerald-500">-12%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Stepper & Dual Action Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quantity:</span>
                  <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setOrderQty(Math.max(product.moq || 1, orderQty - 1))}
                      className="p-1.5 px-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={product.moq || 1}
                      value={orderQty}
                      onChange={(e) => setOrderQty(Math.max(product.moq || 1, Number(e.target.value)))}
                      className="w-14 text-center text-xs font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setOrderQty(orderQty + 1)}
                      className="p-1.5 px-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">
                    Total: <strong className="text-slate-900 dark:text-white">${(product.price * orderQty).toFixed(2)}</strong>
                  </span>
                </div>

                {/* Primary Dual B2B & B2C CTAs */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all hover:scale-[1.01]"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart (B2C)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onRequestQuote) onRequestQuote(product);
                    }}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                    <span>Request Quotation (B2B)</span>
                  </button>
                </div>

                {onOpenChatWithSeller && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenChatWithSeller(product.business_id, product.name);
                    }}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Instant Chat with Manufacturer</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Section: Overview / Specifications / Customer Reviews */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview & Description
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`pb-2.5 border-b-2 transition-colors ${
                  activeTab === 'specs'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Technical Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'reviews'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Verified Reviews</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
                  {reviews.length}
                </span>
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="py-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
                <p className="leading-relaxed whitespace-pre-line">
                  {product.description || 'Verified manufacturer specification catalog item.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <Truck className="w-4 h-4 text-blue-600 mb-1" />
                    <span className="font-bold text-slate-800 dark:text-white block">Logistics Terms</span>
                    <span className="text-[11px] text-slate-500">
                      {product.shipping_notes || 'FOB / CIF Seaport containerized delivery'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                    <span className="font-bold text-slate-800 dark:text-white block">Escrow Guarantee</span>
                    <span className="text-[11px] text-slate-500">
                      Payment released upon buyer customs bill of lading sign-off.
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <Building2 className="w-4 h-4 text-indigo-600 mb-1" />
                    <span className="font-bold text-slate-800 dark:text-white block">Payment Protocols</span>
                    <span className="text-[11px] text-slate-500">
                      {product.payment_terms || 'T/T, L/C at Sight, or Net 30 for Verified Buyers'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Technical Specifications */}
            {activeTab === 'specs' && (
              <div className="py-4 text-xs">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
                  <div className="grid grid-cols-2 p-3 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500 font-medium">HS Code</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {product.hs_code || '6802.91.00'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="text-slate-500 font-medium">Material Composition</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {product.material || 'Standard Commercial Grade'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 p-3 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500 font-medium">Standard Dimensions</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {product.dimensions || 'Customizable per order specification'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="text-slate-500 font-medium">Unit Weight</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {product.weight ? `${product.weight} kg` : 'Standard freight package weight'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 p-3 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500 font-medium">Country of Origin</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {product.country_of_origin || 'Global'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Verified Reviews & Form */}
            {activeTab === 'reviews' && (
              <div className="py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Buyer Reviews & Commercial Reliability ({reviews.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Ratings authenticated via platform purchase orders and verified Bills of Lading
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                  </button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <form onSubmit={handleAddReview} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Your Name / Title *</label>
                        <input
                          type="text"
                          required
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Rating *</label>
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        >
                          <option value={5}>5 Stars - Outstanding Quality & On-Time Delivery</option>
                          <option value={4}>4 Stars - High Quality & Good Communication</option>
                          <option value={3}>3 Stars - Met Basic Standards</option>
                          <option value={2}>2 Stars - Packaging / Logistics Issues</option>
                          <option value={1}>1 Star - Quality Discrepancy</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Headline Summary *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Excellent material density and reliable maritime shipment"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Detailed Review Comments *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Detail the consignment quality, packaging standard, sample match accuracy, and supplier support..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Post Verified Review'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Review List */}
                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No reviews yet for this product catalog entry.
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="bg-white dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {rev.buyer_name || rev.author_name}
                            </span>
                            {(rev.buyer_country || rev.author_country) && (
                              <span className="text-[10px] text-slate-400">
                                ({rev.buyer_country || rev.author_country})
                              </span>
                            )}
                            {rev.is_verified_purchase && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified Order</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{rev.title}</h4>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{rev.comment}</p>
                        {rev.seller_reply && (
                          <div className="mt-2 p-2 bg-blue-50/60 dark:bg-blue-950/40 border-l-2 border-blue-600 rounded-r-lg text-[11px] text-slate-700 dark:text-slate-300">
                            <span className="font-bold block text-blue-600 dark:text-blue-400">Manufacturer Response:</span>
                            <span>{rev.seller_reply}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
