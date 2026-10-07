import React, { useState } from 'react';
import { Package, Plus, Search, ChevronRight, AlertTriangle, ExternalLink } from 'lucide-react';
import { Product, Lead, Quotation, Order } from '../../types';

interface ProductPerformanceTableProps {
  products: Product[];
  leads: Lead[];
  quotations: Quotation[];
  orders: Order[];
  onAddProduct: () => void;
  onSelectProduct?: (product: Product) => void;
  onNavigateToProducts: () => void;
}

export const ProductPerformanceTable: React.FC<ProductPerformanceTableProps> = ({
  products,
  leads,
  quotations,
  orders,
  onAddProduct,
  onSelectProduct,
  onNavigateToProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Map each product to its real operational metrics
  const productRows = products.map((prod) => {
    // Inquiries: count of leads with this product interest or product id
    const inquiries = leads.filter(
      (l) =>
        (l.product_interest && l.product_interest.toLowerCase().includes(prod.name.toLowerCase())) ||
        l.product_id === prod.id
    ).length;

    // Quotes: count of quotes with items matching this product
    const quoteCount = quotations.filter((q) =>
      q.items?.some(
        (it) =>
          it.product_id === prod.id ||
          (it.product_name && it.product_name.toLowerCase().includes(prod.name.toLowerCase()))
      )
    ).length;

    // Orders: count of orders with items matching this product
    const orderCount = orders.filter((o) =>
      o.items?.some(
        (it) =>
          it.product_id === prod.id ||
          (it.product_name && it.product_name.toLowerCase().includes(prod.name.toLowerCase()))
      )
    ).length;

    const stock = prod.stock_quantity ?? 0;
    const threshold = prod.low_stock_threshold ?? 10;
    const isLow = stock <= threshold;
    const isOut = stock === 0;

    let status = 'Active';
    if (isOut) status = 'Out of Stock';
    else if (isLow) status = 'Low Stock';

    return {
      product: prod,
      views: prod.views_count ?? 0,
      inquiries,
      quotes: quoteCount,
      orders: orderCount,
      inventory: stock,
      status,
      isLow,
      isOut,
    };
  });

  const filtered = productRows.filter(
    (r) =>
      r.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.product.sku && r.product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.product.category && r.product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      id="vyra-product-performance-table"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
            Catalog Intelligence
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            PRODUCT PERFORMANCE
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-48"
            />
          </div>

          <button
            type="button"
            id="perf-table-add-prod"
            onClick={onAddProduct}
            className="flex items-center gap-1 px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded text-xs font-semibold hover:bg-slate-800 dark:hover:bg-white transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No products in catalog yet
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5 mb-4">
            Add items to your catalog to track real inquiry volume, quotes sent, and inventory health.
          </p>
          <button
            type="button"
            onClick={onAddProduct}
            className="px-3.5 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition"
          >
            + Add First Product
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-right">Views</th>
                <th className="py-2.5 px-3 text-right">Inquiries</th>
                <th className="py-2.5 px-3 text-right">Quotes</th>
                <th className="py-2.5 px-3 text-right">Orders</th>
                <th className="py-2.5 px-3 text-right">Inventory</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filtered.map((row) => (
                <tr
                  key={row.product.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Product */}
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                      {row.product.name}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                      <span>SKU: {row.product.sku || 'N/A'}</span>
                      {row.product.category && (
                        <>
                          <span>·</span>
                          <span className="truncate">{row.product.category}</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Views */}
                  <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 tabular-nums">
                    {row.views}
                  </td>

                  {/* Inquiries */}
                  <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-semibold tabular-nums">
                    {row.inquiries}
                  </td>

                  {/* Quotes */}
                  <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 tabular-nums">
                    {row.quotes}
                  </td>

                  {/* Orders */}
                  <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                    {row.orders}
                  </td>

                  {/* Inventory */}
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    <span
                      className={`font-semibold ${
                        row.isOut
                          ? 'text-rose-600 dark:text-rose-400'
                          : row.isLow
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {row.inventory}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 text-center font-sans">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        row.isOut
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : row.isLow
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      type="button"
                      onClick={() => onNavigateToProducts()}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
