import React, { useState } from 'react';
import { Product, Business } from '../../types';
import {
  FileText,
  Download,
  Share2,
  Printer,
  X,
  Check,
  Building2,
  Package,
  ShieldCheck,
  QrCode,
  Sparkles,
} from 'lucide-react';

interface ProductPdfModalProps {
  product: Product;
  business: Business | null;
  onClose: () => void;
}

export const ProductPdfModal: React.FC<ProductPdfModalProps> = ({
  product,
  business,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [includePricing, setIncludePricing] = useState(true);
  const [includeContact, setIncludeContact] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden flex flex-col">
        {/* Header Toolbar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">Product Technical Datasheet & PDF Export</h3>
              <p className="text-[11px] text-slate-400 font-mono">SKU: {product.sku || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download / Print PDF</span>
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
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includePricing}
                onChange={(e) => setIncludePricing(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span className="font-medium">Show MOQ & Unit Price</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeContact}
                onChange={(e) => setIncludeContact(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span className="font-medium">Show Company Contact & GST/IEC</span>
            </label>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Standard A4 Printable Dimensions</span>
        </div>

        {/* Printable PDF Sheet Preview */}
        <div className="p-8 max-h-[72vh] overflow-y-auto bg-slate-100 flex justify-center">
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-2xl p-8 space-y-6 text-slate-900 print:shadow-none print:border-none print:p-0">
            {/* Sheet Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600">
                  EXPORT COMMERCIAL SPECIFICATION SHEET
                </span>
                <h1 className="text-2xl font-black text-slate-900 mt-1">{product.name}</h1>
                <p className="text-xs text-slate-500 font-medium">Category: {product.category}</p>
              </div>

              {business && (
                <div className="text-right text-xs">
                  <div className="font-extrabold text-slate-900">{business.legal_name || business.name}</div>
                  <div className="text-[11px] text-slate-500">{business.city}, {business.country}</div>
                  {business.iec_code && (
                    <div className="text-[10px] font-mono text-slate-400">IEC: {business.iec_code}</div>
                  )}
                </div>
              )}
            </div>

            {/* Product Image & Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="h-56 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-16 h-16 text-slate-300" />
                )}
              </div>

              <div className="space-y-3 text-xs">
                {includePricing && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                    <div className="text-[11px] text-blue-800 font-bold uppercase">Export Tier Pricing</div>
                    <div className="text-xl font-black text-blue-900 font-mono">
                      {product.currency} {product.price?.toLocaleString()} <span className="text-xs font-normal text-blue-700">/ unit</span>
                    </div>
                    <div className="text-[11px] text-blue-700">
                      Minimum Order Quantity (MOQ): <span className="font-bold">{product.moq} {product.unit || 'units'}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">HS Code</span>
                    <span className="font-mono font-bold">{product.hs_code || '6802.21'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Country of Origin</span>
                    <span className="font-semibold">{product.country_of_origin || business?.country || 'Export Origin'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Dimensions</span>
                    <span className="font-semibold">{product.dimensions || 'Standard Factory Spec'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Material</span>
                    <span className="font-semibold">{product.material || 'Commercial Grade'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Product Technical Summary</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {product.description || 'Manufactured according to international industrial specifications with calibrated thickness and quality control inspection.'}
              </p>
            </div>

            {/* Shipping & Packaging Notes */}
            {product.shipping_notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <span className="font-bold text-slate-800 block text-[11px] uppercase">Export Packaging & Transit Assurance</span>
                <p className="text-slate-600">{product.shipping_notes}</p>
              </div>
            )}

            {/* Verification Footer & QR */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="space-y-0.5">
                {includeContact && business && (
                  <>
                    <div className="font-bold text-slate-800">{business.name} Export Sales Division</div>
                    <div>Email: {business.email || 'export@vyra.network'} • Tel: {business.phone || '+1 800-VYRA'}</div>
                    {business.gst_number && <div>Tax ID / GST: {business.gst_number}</div>}
                  </>
                )}
                <div className="text-[10px] text-slate-400 font-mono pt-1">
                  Verified by VYRA Global Commerce Network • Sheet ID: {product.id.slice(0, 10)}
                </div>
              </div>

              <div className="w-16 h-16 border border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 p-1">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
