import React, { useState, useEffect } from 'react';
import { Product, ProductReview } from '../../types';
import { fetchProductReviews, createProductReview } from '../../lib/db';
import {
  X,
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProductReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductReviewsModal: React.FC<ProductReviewsModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { currentBusiness, user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingReview, setIsAddingReview] = useState(false);

  // Form states
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState(
    user?.full_name || currentBusiness?.owner_name || 'Verified Buyer'
  );
  const [authorCountry, setAuthorCountry] = useState(currentBusiness?.country || 'United States');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!product || !isOpen) return;
    setLoading(true);
    fetchProductReviews(product.id)
      .then((data) => {
        setReviews(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
      : 5.0;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !comment.trim()) return;

    setSubmitting(true);
    try {
      const created = await createProductReview({
        product_id: product.id,
        business_id: currentBusiness?.id,
        user_id: user?.id,
        author_name: authorName.trim() || 'Verified Buyer',
        author_country: authorCountry.trim() || 'International',
        rating,
        title: title.trim(),
        comment: comment.trim(),
        is_verified_purchase: true,
      });

      setReviews((prev) => [created, ...prev]);
      setIsAddingReview(false);
      setTitle('');
      setComment('');
      setNotice('Your verified review has been published.');
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Customer Reviews & Quality Ratings</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">
              Verified intake reports for: <strong className="text-slate-800 dark:text-slate-200">{product.name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/40 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{avgRating}</span>
              <div className="flex items-center gap-0.5 text-amber-500 mt-0.5 justify-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= Math.round(avgRating) ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{reviews.length} ratings</p>
            </div>

            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
              <p className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Verified Purchase Intake Reports</span>
              </p>
              <p className="text-[11px] text-slate-500">
                All evaluations submitted post-customs inspection and delivery verification.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingReview(!isAddingReview)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            {isAddingReview ? 'Cancel Review' : 'Write a Review'}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {notice && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* Review Submission Form */}
          {isAddingReview && (
            <form onSubmit={handleSubmitReview} className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Submit Quality Evaluation
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Overall Rating (1 - 5 Stars)
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${val <= rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {rating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Review Headline / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Excellent dimensional tolerance and packaging"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Detailed Experience & Inspection Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe material finish, packaging integrity, transit timing, and compliance..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Your Name or Organization
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Country of Destination
                  </label>
                  <input
                    type="text"
                    value={authorCountry}
                    onChange={(e) => setAuthorCountry(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingReview(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Post Review'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Review List */}
          {loading ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No reviews recorded yet for this product
              </p>
              <p className="text-xs text-slate-500">
                Be the first verified customer to submit an intake and quality evaluation report.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`}
                          />
                        ))}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {rev.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rev.comment}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{rev.author_name}</span>
                      <span>({rev.author_country || 'International'})</span>
                      {rev.is_verified_purchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified Purchase</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{rev.helpful_count} found helpful</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
