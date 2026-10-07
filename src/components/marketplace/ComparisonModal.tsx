import React from 'react';
import { Product, Business } from '../../types';
import {
  X,
  Scale,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Send,
  MessageSquare,
  Star,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onRequestQuote: (product: Product) => void;
  onOpenChatWithSeller: (sellerId: string, sellerName: string) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  products,
  onRemoveProduct,
  onClearAll,
  onRequestQuote,
  onOpenChatWithSeller,
}) => {
  const { addToCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Side-by-Side Product & Supplier Comparison</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-bold">
                  {products.length} {products.length === 1 ? 'item' : 'items'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare pricing, MOQ, lead times, export compliance, and supplier capability matrices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {products.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-slate-500 hover:text-rose-500 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6">
          {products.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Scale className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No products selected for comparison
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select "Compare" on any product card in the marketplace to evaluate up to 4 items simultaneously.
              </p>
            </div>
          ) : (
            <div className="min-w-[650px] divide-y divide-slate-100 dark:divide-slate-800">
              {/* Product Header Row */}
              <div className="grid grid-cols-5 gap-4 pb-4 items-start">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">
                  Product Details
                </div>
                {products.map((p) => (
                  <div key={p.id} className="relative space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => onRemoveProduct(p.id)}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500"
                      title="Remove from comparison"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-full h-24 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      {p.images && p.images.length > 0 ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">{p.category || 'General'}</p>
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => addToCart(p, 1)}
                        className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Add to Cart</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestQuote(p)}
                        className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]"
                        title="Request Quote"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Row */}
              <div className="grid grid-cols-5 gap-4 py-3 items-center text-xs">
                <div className="font-bold text-slate-500">Unit Price</div>
                {products.map((p) => (
                  <div key={p.id} className="font-black text-sm text-blue-600 dark:text-blue-400">
                    ${(p.price || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{p.currency || 'USD'}</span>
                  </div>
                ))}
              </div>

              {/* MOQ Row */}
              <div className="grid grid-cols-5 gap-4 py-3 items-center text-xs">
                <div className="font-bold text-slate-500">Minimum Order Qty</div>
                {products.map((p) => (
                  <div key={p.id} className="font-semibold text-slate-800 dark:text-slate-200">
                    {p.moq || 1} units
                  </div>
                ))}
              </div>

              {/* In Stock Row */}
              <div className="grid grid-cols-5 gap-4 py-3 items-center text-xs">
                <div className="font-bold text-slate-500">Available Stock</div>
                {products.map((p) => (
                  <div key={p.id} className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {typeof p.stock_quantity === 'number' ? `${p.stock_quantity.toLocaleString()} in stock` : 'Made-to-Order'}
                  </div>
                ))}
              </div>

              {/* Country & Material Row */}
              <div className="grid grid-cols-5 gap-4 py-3 items-center text-xs">
                <div className="font-bold text-slate-500">Country of Origin</div>
                {products.map((p) => (
                  <div key={p.id} className="text-slate-700 dark:text-slate-300">
                    {p.country_of_origin || 'International'}
                  </div>
                ))}
              </div>

              {/* Material */}
              <div className="grid grid-cols-5 gap-4 py-3 items-center text-xs">
                <div className="font-bold text-slate-500">Material / Build</div>
                {products.map((p) => (
                  <div key={p.id} className="text-slate-700 dark:text-slate-300">
                    {p.material || 'Standard Industrial Specification'}
                  </div>
                ))}
              </div>

              {/* Dimensions & Weight */}
              <div className="grid grid-cols-5 gap-4 py-3 items-center text-xs">
                <div className="font-bold text-slate-500">Dimensions & Weight</div>
                {products.map((p) => (
                  <div key={p.id} className="text-slate-700 dark:text-slate-300 text-[11px]">
                    {p.dimensions || 'Custom'} {p.weight ? `• ${p.weight} kg` : ''}
                  </div>
                ))}
              </div>

              {/* Verified Supplier Status */}
              <div className="grid grid-cols-5 gap-4 py-3 items-center text-xs">
                <div className="font-bold text-slate-500">Supplier Escrow</div>
                {products.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>VYRA Verified</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
