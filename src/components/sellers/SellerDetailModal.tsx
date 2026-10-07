import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  ShieldCheck,
  Clock,
  XCircle,
  AlertCircle,
  Globe,
  Mail,
  Phone,
  MapPin,
  Package,
  FileSpreadsheet,
  ShoppingBag,
  Layers,
  Image,
  Video,
  FileText,
  ExternalLink,
  MessageSquare,
  Edit,
  Ban,
  CheckCircle,
  Download,
  Check,
} from 'lucide-react';
import {
  SellerProfile,
  Product,
  Quotation,
  Order,
  RFQ,
  SellerVerificationEvidence,
} from '../../types';
import {
  fetchBusinessProducts,
  fetchBusinessQuotations,
  fetchBusinessOrders,
  fetchSellerVerificationEvidence,
} from '../../lib/db';

interface SellerDetailModalProps {
  seller: SellerProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (seller: SellerProfile) => void;
  onOpenVerifyModal: (seller: SellerProfile) => void;
  onToggleStatus: (seller: SellerProfile) => void;
  onMessage: (seller: SellerProfile) => void;
}

export const SellerDetailModal: React.FC<SellerDetailModalProps> = ({
  seller,
  isOpen,
  onClose,
  onEdit,
  onOpenVerifyModal,
  onToggleStatus,
  onMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'commercial' | 'media' | 'verification'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [evidenceList, setEvidenceList] = useState<SellerVerificationEvidence[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!isOpen || !seller) return;
    setLoadingDetails(true);

    Promise.all([
      fetchBusinessProducts(seller.id),
      fetchBusinessQuotations(seller.id),
      fetchBusinessOrders(seller.id),
      fetchSellerVerificationEvidence(seller.id),
    ])
      .then(([prods, quotes, ords, ev]) => {
        setProducts(prods);
        setQuotations(quotes);
        setOrders(ords);
        setEvidenceList(ev);
      })
      .catch((err) => console.warn('Error loading seller related data:', err))
      .finally(() => setLoadingDetails(false));
  }, [isOpen, seller]);

  if (!isOpen || !seller) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6">
        {/* Cover / Header Section */}
        <div className="relative bg-gradient-to-r from-slate-900 to-blue-950 p-6 sm:p-8 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {seller.logo_url ? (
              <img
                src={seller.logo_url}
                alt={seller.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-200 flex items-center justify-center font-bold text-xl shrink-0">
                {seller.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight truncate">{seller.name}</h2>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                    seller.verification_status_normalized === 'Verified'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : seller.verification_status_normalized === 'Pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : seller.verification_status_normalized === 'Rejected'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {seller.verification_status_normalized === 'Verified' && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                  {seller.verification_status_normalized === 'Pending' && <Clock className="w-3 h-3 text-amber-400" />}
                  <span>{seller.verification_status_normalized} SELLER</span>
                </span>
                {seller.operational_status === 'Suspended' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                    SUSPENDED
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {seller.city ? `${seller.city}, ${seller.country}` : seller.country}
                </span>
                <span>•</span>
                <span>{seller.business_type}</span>
                <span>•</span>
                <span>{seller.category || seller.industry}</span>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 mt-3 sm:mt-0 self-stretch sm:self-auto justify-end">
              <button
                type="button"
                onClick={() => onMessage(seller)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(seller)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-950/60 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Profile', icon: Building2 },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'commercial', label: `Commercials (${orders.length + quotations.length})`, icon: ShoppingBag },
            { id: 'media', label: 'Media & Factory', icon: Image },
            { id: 'verification', label: `Compliance (${evidenceList.length})`, icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                  active
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              {seller.description && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Company Profile</h4>
                  <p className="leading-relaxed">{seller.description}</p>
                </div>
              )}

              {/* Manufacturing & Trade Capabilities */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-400">
                  Manufacturing & Supply Capabilities
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">MOQ</span>
                    <strong className="text-slate-900 dark:text-white text-sm">{seller.moq || 1} units</strong>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Lead Time</span>
                    <strong className="text-slate-900 dark:text-white text-sm">{seller.lead_time_days || 7} days</strong>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Established</span>
                    <strong className="text-slate-900 dark:text-white text-sm">{seller.year_established || '—'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Workforce</span>
                    <strong className="text-slate-900 dark:text-white text-sm">{seller.employee_count || '10-50'}</strong>
                  </div>
                </div>

                {seller.manufacturing_capacity && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Manufacturing Capacity:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{seller.manufacturing_capacity}</span>
                  </div>
                )}
              </div>

              {/* Trade Routes & Shipping */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-400">
                  Global Shipping & Trade Routes
                </h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Export Destinations:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {seller.export_countries && seller.export_countries.length > 0 ? (
                        seller.export_countries.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[11px] border border-blue-200 dark:border-blue-800">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Global trade destination terms upon request.</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Shipping Terms Supported:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(seller.shipping_capabilities || ['FOB', 'CIF', 'EXW']).map((term, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px]">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal & Registration Metadata */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-400">
                  Legal & Corporate Registration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">Legal Entity Name</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{seller.legal_name || seller.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-2">Registration / CIN Number</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{seller.registration_number || 'Not provided'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">Tax ID / VAT</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{seller.tax_id || seller.gst_number || 'Not provided'}</span>
                    <span className="text-[10px] text-slate-400 block mt-2">IEC Export Code</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{seller.iec_code || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-400">
                  Corporate Contacts & Web
                </h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contact Person</span>
                    <span className="font-semibold">{seller.owner_name || 'Principal Officer'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Official Email</span>
                    <span className="font-mono">{seller.email || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Telephone / WhatsApp</span>
                    <span className="font-mono">{seller.phone || seller.whatsapp || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white">Seller Catalog Items</h4>
                <span className="font-mono text-slate-400">{products.length} listed</span>
              </div>

              {products.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  <p className="font-semibold">No catalog items listed yet</p>
                  <p className="text-[11px] mt-0.5">This seller has not published products to the catalog.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3"
                    >
                      {p.images && p.images[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-slate-900 dark:text-white truncate">{p.name}</h5>
                        <p className="text-[11px] text-slate-400 truncate">{p.category}</p>
                        <div className="flex items-center justify-between mt-2 font-mono text-[11px]">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ${Number(p.price || 0).toLocaleString()}
                          </span>
                          <span className="text-slate-500">MOQ: {p.moq || 1}</span>
                          <span className="text-slate-500">Stock: {p.stock_quantity || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. COMMERCIAL ACTIVITY TAB */}
          {activeTab === 'commercial' && (
            <div className="space-y-6">
              {/* Orders */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Orders Fulfilled ({orders.length})</h4>
                {orders.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    0 commercial orders processed.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <div key={o.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between font-mono">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{o.order_number}</span>
                          <span className="text-[11px] text-slate-400 block">{o.buyer_name} ({o.buyer_company || 'Direct Buyer'})</span>
                        </div>
                        <div className="text-right">
                          <strong className="text-emerald-600 dark:text-emerald-400">${(o.total_amount || 0).toLocaleString()}</strong>
                          <span className="text-[10px] text-slate-400 block">{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quotations */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Quotations Dispatched ({quotations.length})</h4>
                {quotations.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    0 formal quotations recorded.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quotations.map((q) => (
                      <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between font-mono">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{q.quote_number}</span>
                          <span className="text-[11px] text-slate-400 block">{q.buyer_name}</span>
                        </div>
                        <div className="text-right">
                          <strong className="text-slate-900 dark:text-white">${(q.total_amount || 0).toLocaleString()}</strong>
                          <span className="text-[10px] text-slate-400 block">{q.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. MEDIA & GALLERY TAB */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white">Factory & Shop Media Assets</h4>
              {(!seller.gallery_urls || seller.gallery_urls.length === 0) && (!seller.video_urls || seller.video_urls.length === 0) ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <Image className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  <p className="font-semibold">No media assets uploaded</p>
                  <p className="text-[11px] mt-0.5">Use "Edit Seller" to upload factory tour photos, workshop videos, and digital catalogs.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {seller.gallery_urls && seller.gallery_urls.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Facility & Product Photos</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {seller.gallery_urls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Gallery ${i + 1}`}
                            className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {seller.video_urls && seller.video_urls.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Company Videos & Tours</h5>
                      <div className="space-y-2">
                        {seller.video_urls.map((vUrl, i) => (
                          <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                            <span className="font-mono truncate">{vUrl}</span>
                            <a href={vUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                              Watch <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. VERIFICATION & COMPLIANCE TAB */}
          {activeTab === 'verification' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Compliance Status: {seller.verification_status_normalized}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {seller.verification_notes || 'All verification decisions are recorded in immutable audit logs.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenVerifyModal(seller)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Update Decision</span>
                </button>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Submitted Evidence Documents</h5>
                {evidenceList.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    0 compliance documents submitted by seller.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {evidenceList.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{doc.title}</span>
                            <span className="text-[10px] text-slate-400 capitalize">{doc.document_type.replace('_', ' ')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 font-mono">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            doc.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : doc.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {doc.status}
                          </span>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-blue-600"
                            title="View Document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => onToggleStatus(seller)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              seller.operational_status === 'Active'
                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
            }`}
          >
            {seller.operational_status === 'Active' ? 'Suspend Seller Operations' : 'Reactivate Seller'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
