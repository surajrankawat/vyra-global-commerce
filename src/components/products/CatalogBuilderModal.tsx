import React, { useState } from 'react';
import { Product, Business, CatalogFormat, CatalogTemplate } from '../../types';
import {
  FileText,
  Download,
  Printer,
  X,
  Check,
  Package,
  Layers,
  Sparkles,
  Building2,
  CheckSquare,
  Square,
} from 'lucide-react';

interface CatalogBuilderModalProps {
  products: Product[];
  business: Business | null;
  onClose: () => void;
}

export const CatalogBuilderModal: React.FC<CatalogBuilderModalProps> = ({
  products,
  business,
  onClose,
}) => {
  const [format, setFormat] = useState<CatalogFormat>('A4');
  const [template, setTemplate] = useState<CatalogTemplate>('Export');
  const [selectedIds, setSelectedIds] = useState<string[]>(products.map((p) => p.id));
  const [catalogTitle, setCatalogTitle] = useState(
    `${business?.name || 'Enterprise'} — Commercial Product Catalog`
  );
  const [includePricing, setIncludePricing] = useState(true);
  const [includeSpecs, setIncludeSpecs] = useState(true);

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(products.map((p) => p.id));
  const deselectAll = () => setSelectedIds([]);

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full my-8 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">Commercial Catalog Builder</h3>
              <p className="text-[11px] text-slate-400">
                Generate multi-page PDF catalogs for international trade fairs, wholesale buyers & importers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedProducts.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generate Catalog PDF ({selectedProducts.length} Items)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Catalog Title</label>
            <input
              type="text"
              value={catalogTitle}
              onChange={(e) => setCatalogTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Page Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as CatalogFormat)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none font-medium"
            >
              <option value="A4">A4 International (210 x 297 mm)</option>
              <option value="A5">A5 Booklet (148 x 210 mm)</option>
              <option value="Letter">US Letter (8.5 x 11 in)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Design Template</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as CatalogTemplate)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none font-medium"
            >
              <option value="Export">Export / Incoterms Standard</option>
              <option value="Business">Business Classic Corporate</option>
              <option value="Wholesale">Wholesale Bulk Matrix</option>
              <option value="Luxury">Luxury High-Finish Editorial</option>
              <option value="Minimal">Minimal Architectural Clean</option>
              <option value="Modern">Modern Vibrant Grid</option>
            </select>
          </div>

          <div className="flex flex-col justify-end space-y-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includePricing}
                onChange={(e) => setIncludePricing(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span className="font-semibold text-slate-700">Display Wholesale Price & MOQ</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSpecs}
                onChange={(e) => setIncludeSpecs(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span className="font-semibold text-slate-700">Include Dimensions & HS Codes</span>
            </label>
          </div>
        </div>

        {/* Product Selection Toggles */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Select Items:</span>
            <span className="text-slate-500 font-mono">
              {selectedIds.length} of {products.length} products included
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="text-blue-600 font-semibold hover:underline"
            >
              Select All
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-slate-500 font-semibold hover:underline"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Live Catalog Preview */}
        <div className="p-8 max-h-[60vh] overflow-y-auto bg-slate-100 flex justify-center">
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-3xl p-8 space-y-8 print:p-0 print:border-none print:shadow-none">
            {/* Catalog Cover */}
            <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600">
                  {template.toUpperCase()} TRADE CATALOG • FORMAT {format}
                </span>
                <h1 className="text-3xl font-black text-slate-900 mt-1">{catalogTitle}</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Issued by {business?.name || 'Verified Manufacturer'} • {business?.city}, {business?.country}
                </p>
              </div>

              {business && (
                <div className="text-right text-xs text-slate-500 font-mono">
                  <div>GST: {business.gst_number || 'N/A'}</div>
                  <div>IEC: {business.iec_code || 'N/A'}</div>
                </div>
              )}
            </div>

            {/* Catalog Items Grid */}
            {selectedProducts.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No products selected. Check items above to build your catalog.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {selectedProducts.map((p) => (
                  <div key={p.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                    <div className="h-44 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100">
                      {p.images && p.images.length > 0 ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-12 h-12 text-slate-300" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">{p.category}</span>
                        {p.sku && <span className="text-[10px] font-mono text-slate-400">SKU: {p.sku}</span>}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{p.description}</p>
                    </div>

                    {includePricing && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-900">
                          {p.currency} {p.price?.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500">MOQ: {p.moq} units</span>
                      </div>
                    )}

                    {includeSpecs && (p.dimensions || p.hs_code) && (
                      <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                        <span>HS: {p.hs_code || '6802.21'}</span>
                        <span>{p.dimensions || 'Custom Specs'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Catalog Footer */}
            <div className="pt-6 border-t-2 border-slate-900 flex items-center justify-between text-xs text-slate-500">
              <div>
                <span className="font-bold text-slate-800">
                  {business?.legal_name || business?.name} Commercial Division
                </span>
                <p className="text-[11px] text-slate-400">
                  Direct Inquiries: {business?.email || 'sales@vyra.network'} • {business?.phone || '+1 800-VYRA'}
                </p>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-400">
                Page 1 of {Math.ceil(selectedProducts.length / 4) || 1}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
