import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ShieldCheck,
  Clock,
  XCircle,
  AlertCircle,
  Building2,
  Globe,
  Package,
  ShoppingBag,
  DollarSign,
  Download,
  Eye,
  Edit,
  MessageSquare,
  Ban,
  CheckCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { SellerProfile } from '../../types';

interface SellerDirectoryProps {
  sellers: SellerProfile[];
  onSelectSeller: (seller: SellerProfile) => void;
  onEditSeller: (seller: SellerProfile) => void;
  onOpenVerifyModal: (seller: SellerProfile) => void;
  onToggleStatus: (seller: SellerProfile) => void;
  onMessageSeller: (seller: SellerProfile) => void;
  onExport: (format: 'csv' | 'json') => void;
}

export const SellerDirectory: React.FC<SellerDirectoryProps> = ({
  sellers,
  onSelectSeller,
  onEditSeller,
  onOpenVerifyModal,
  onToggleStatus,
  onMessageSeller,
  onExport,
}) => {
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Extract unique filter lists from real sellers
  const countries = useMemo(() => {
    const set = new Set<string>();
    sellers.forEach((s) => s.country && set.add(s.country));
    return Array.from(set).sort();
  }, [sellers]);

  const businessTypes = useMemo(() => {
    const set = new Set<string>();
    sellers.forEach((s) => s.business_type && set.add(s.business_type));
    return Array.from(set).sort();
  }, [sellers]);

  // Filtered sellers
  const filtered = useMemo(() => {
    return sellers.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.owner_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.industry?.toLowerCase().includes(q);

      const matchVerif =
        verificationFilter === 'All' || s.verification_status_normalized === verificationFilter;

      const matchStatus = statusFilter === 'All' || s.operational_status === statusFilter;

      const matchCountry = countryFilter === 'All' || s.country === countryFilter;

      const matchType = businessTypeFilter === 'All' || s.business_type === businessTypeFilter;

      return matchSearch && matchVerif && matchStatus && matchCountry && matchType;
    });
  }, [sellers, search, verificationFilter, statusFilter, countryFilter, businessTypeFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search sellers by business name, owner, city, country, or category..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Export & View Toggles */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => onExport('csv')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              title="Export as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => onExport('json')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              title="Export as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pickers */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Verification</option>
            <option value="Verified">Verified Only</option>
            <option value="Pending">Pending Review</option>
            <option value="Unverified">Unverified</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>

          {/* Country Filter */}
          <select
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Business Type Filter */}
          <select
            value={businessTypeFilter}
            onChange={(e) => {
              setBusinessTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Business Types</option>
            {businessTypes.map((bt) => (
              <option key={bt} value={bt}>
                {bt}
              </option>
            ))}
          </select>

          <span className="ml-auto text-slate-400 font-mono text-[11px]">
            {filtered.length} {filtered.length === 1 ? 'seller' : 'sellers'} found
          </span>
        </div>
      </div>

      {/* Directory Content */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No sellers found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, country, or verification filter to view suppliers.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginated.map((seller) => (
            <div
              key={seller.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/40 transition flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {seller.logo_url ? (
                      <img
                        src={seller.logo_url}
                        alt={seller.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-sm shrink-0">
                        {seller.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {seller.name}
                        </h4>
                        {seller.verification_status_normalized === 'Verified' && (
                          <span title="Verified Seller">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                        <span>{seller.city ? `${seller.city}, ${seller.country}` : seller.country}</span>
                        <span>•</span>
                        <span>{seller.business_type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        seller.verification_status_normalized === 'Verified'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : seller.verification_status_normalized === 'Pending'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : seller.verification_status_normalized === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {seller.verification_status_normalized}
                    </span>

                    {seller.operational_status === 'Suspended' && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-rose-500 text-white rounded font-bold">
                        SUSPENDED
                      </span>
                    )}
                  </div>
                </div>

                {/* Description snippet */}
                {seller.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                    {seller.description}
                  </p>
                )}

                {/* Capabilities grid */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl text-[11px] mb-3 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">MOQ</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {seller.moq || 1} units
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Products</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {seller.products_count || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Orders</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {seller.orders_count || 0}
                    </span>
                  </div>
                </div>

                {/* Contact person */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between mb-3">
                  <span>Contact: <strong className="text-slate-700 dark:text-slate-300">{seller.owner_name || 'Authorized Officer'}</strong></span>
                  {seller.email && <span className="truncate max-w-[150px]">{seller.email}</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectSeller(seller)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditSeller(seller)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onMessageSeller(seller)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <MessageSquare className="w-3 h-3 text-slate-500" />
                    <span>Message</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenVerifyModal(seller)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Review Verification"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStatus(seller)}
                    className={`p-1.5 rounded-lg transition ${
                      seller.operational_status === 'Active'
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : 'text-amber-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40'
                    }`}
                    title={seller.operational_status === 'Active' ? 'Suspend Seller' : 'Reactivate Seller'}
                  >
                    {seller.operational_status === 'Active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Seller Business</th>
                  <th className="px-4 py-3">Country & City</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Products</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginated.map((seller) => (
                  <tr key={seller.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {seller.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold">{seller.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{seller.owner_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {seller.city ? `${seller.city}, ${seller.country}` : seller.country}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {seller.category || seller.industry}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          seller.verification_status_normalized === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : seller.verification_status_normalized === 'Pending'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : seller.verification_status_normalized === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {seller.verification_status_normalized}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          seller.operational_status === 'Active'
                            ? 'text-teal-600 bg-teal-50 dark:bg-teal-950/40'
                            : 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                        }`}
                      >
                        {seller.operational_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {seller.products_count || 0}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${(seller.total_revenue || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectSeller(seller)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditSeller(seller)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} sellers
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
