import React, { useState, useEffect } from 'react';
import {
  fetchSellers,
  fetchSellerDashboardMetrics,
  createSeller,
  updateSeller,
  updateSellerVerification,
  updateSellerOperationalStatus,
  inviteSeller,
} from '../lib/db';
import { SellerProfile, SellerDashboardMetrics } from '../types';
import { SellersDashboard } from './sellers/SellersDashboard';
import { SellerDirectory } from './sellers/SellerDirectory';
import { SellerDetailModal } from './sellers/SellerDetailModal';
import { SellerOnboardingWizard } from './sellers/SellerOnboardingWizard';
import {
  AddEditSellerModal,
  InviteSellerModal,
  VerifyEvidenceModal,
} from './sellers/SellerActionModals';
import { Store, Layers, TrendingUp, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface SellersViewProps {
  onMessageSeller?: (sellerId: string, sellerName: string) => void;
}

export const SellersView: React.FC<SellersViewProps> = ({ onMessageSeller }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'directory' | 'onboarding'>('dashboard');
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [metrics, setMetrics] = useState<SellerDashboardMetrics>({
    total_sellers: 0,
    verified_sellers: 0,
    pending_verification: 0,
    active_sellers: 0,
    inactive_sellers: 0,
    total_products_listed: 0,
    seller_rfq_responses: 0,
    seller_quotations: 0,
    seller_orders: 0,
    seller_revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [selectedSellerForDetail, setSelectedSellerForDetail] = useState<SellerProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [sellerToEdit, setSellerToEdit] = useState<SellerProfile | null>(null);

  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [sellerToVerify, setSellerToVerify] = useState<SellerProfile | null>(null);

  // Confirmation dialog state (replaces window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSellers, stats] = await Promise.all([
        fetchSellers(),
        fetchSellerDashboardMetrics(),
      ]);
      setSellers(allSellers);
      setMetrics(stats);
    } catch (err: any) {
      console.warn('Failed to load sellers data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleShowNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 5000);
  };

  // Add / Edit Seller Action
  const handleSaveSeller = async (data: Partial<SellerProfile>) => {
    if (sellerToEdit) {
      const updated = await updateSeller(sellerToEdit.id, data);
      setSellers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      handleShowNotice('success', `Seller "${updated.name}" updated successfully.`);
    } else {
      const created = await createSeller(data);
      setSellers((prev) => [created, ...prev]);
      handleShowNotice('success', `Seller "${created.name}" registered successfully.`);
    }
    await loadData();
  };

  // Verification Decision Action
  const handleUpdateVerification = async (status: 'Verified' | 'Rejected' | 'Pending', reason: string) => {
    if (!sellerToVerify) return;
    try {
      const updated = await updateSellerVerification(sellerToVerify.id, status, reason);
      setSellers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (selectedSellerForDetail?.id === updated.id) {
        setSelectedSellerForDetail(updated);
      }
      handleShowNotice(
        'success',
        `Seller "${updated.name}" verification updated to ${status}. Recorded in audit log.`
      );
      await loadData();
    } catch (err: any) {
      handleShowNotice('error', err.message || 'Failed to update verification');
    }
  };

  // Toggle Operational Status (Suspend / Reactivate)
  const handleToggleStatus = async (seller: SellerProfile) => {
    const nextStatus = seller.operational_status === 'Active' ? 'Suspended' : 'Active';
    const isSuspending = nextStatus === 'Suspended';
    const confirmMsg = isSuspending
      ? `Are you sure you want to suspend operations for "${seller.name}"? They will not appear in buyer marketplace searches.`
      : `Reactivate seller operations for "${seller.name}"? This seller will regain full active marketplace listing privileges.`;

    setConfirmDialog({
      title: isSuspending ? 'Confirm Seller Suspension' : 'Reactivate Seller',
      message: confirmMsg,
      confirmLabel: isSuspending ? 'Suspend Seller' : 'Reactivate Seller',
      isDestructive: isSuspending,
      onConfirm: async () => {
        try {
          const updated = await updateSellerOperationalStatus(
            seller.id,
            nextStatus,
            isSuspending ? 'Administrative suspension' : 'Operational reactivation'
          );
          setSellers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          if (selectedSellerForDetail?.id === updated.id) {
            setSelectedSellerForDetail(updated);
          }
          handleShowNotice('success', `Seller operational status updated to ${nextStatus}.`);
          await loadData();
        } catch (err: any) {
          handleShowNotice('error', err.message || 'Failed to change status');
        }
      },
    });
  };

  // Invite Seller
  const handleSendInvite = async (email: string, businessName: string, role: string) => {
    await inviteSeller({
      inviterBusinessId: 'current-business-id',
      email,
      businessName,
      role,
      invitedByName: 'Platform Administrator',
    });
    handleShowNotice('success', `Invitation dispatched to ${email} for "${businessName}".`);
  };

  // Export permitted seller records
  const handleExport = (format: 'csv' | 'json') => {
    if (sellers.length === 0) {
      handleShowNotice('error', 'No seller records to export.');
      return;
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(sellers, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vyra_sellers_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['Business Name', 'Legal Name', 'Owner', 'Country', 'City', 'Business Type', 'Category', 'MOQ', 'Verification Status', 'Operational Status', 'Products Count', 'Orders Count', 'Revenue'];
      const rows = sellers.map((s) => [
        `"${s.name.replace(/"/g, '""')}"`,
        `"${(s.legal_name || s.name).replace(/"/g, '""')}"`,
        `"${(s.owner_name || '').replace(/"/g, '""')}"`,
        `"${s.country}"`,
        `"${s.city || ''}"`,
        `"${s.business_type}"`,
        `"${(s.category || s.industry || '').replace(/"/g, '""')}"`,
        s.moq || 1,
        s.verification_status_normalized,
        s.operational_status,
        s.products_count || 0,
        s.orders_count || 0,
        s.total_revenue || 0,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vyra_sellers_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    handleShowNotice('success', `Exported ${sellers.length} seller records as ${format.toUpperCase()}.`);
  };

  const pendingSellers = sellers.filter((s) => s.verification_status_normalized === 'Pending');

  return (
    <div className="space-y-6">
      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Sellers Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'directory'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Seller Directory ({sellers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('onboarding')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'onboarding'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Seller Onboarding</span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Global Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Content depending on Tab */}
      {activeTab === 'dashboard' && (
        <SellersDashboard
          metrics={metrics}
          recentSellers={sellers}
          pendingSellers={pendingSellers}
          onOpenDirectory={() => setActiveTab('directory')}
          onOpenAddModal={() => {
            setSellerToEdit(null);
            setIsAddEditOpen(true);
          }}
          onOpenInviteModal={() => setIsInviteOpen(true)}
          onStartOnboarding={() => setActiveTab('onboarding')}
          onSelectSeller={(s) => {
            setSelectedSellerForDetail(s);
            setIsDetailOpen(true);
          }}
        />
      )}

      {activeTab === 'directory' && (
        <SellerDirectory
          sellers={sellers}
          onSelectSeller={(s) => {
            setSelectedSellerForDetail(s);
            setIsDetailOpen(true);
          }}
          onEditSeller={(s) => {
            setSellerToEdit(s);
            setIsAddEditOpen(true);
          }}
          onOpenVerifyModal={(s) => {
            setSellerToVerify(s);
            setIsVerifyOpen(true);
          }}
          onToggleStatus={handleToggleStatus}
          onMessageSeller={(s) => {
            if (onMessageSeller) {
              onMessageSeller(s.id, s.name);
            } else {
              handleShowNotice('success', `Initiating encrypted commercial channel with ${s.name}...`);
            }
          }}
          onExport={handleExport}
        />
      )}

      {activeTab === 'onboarding' && (
        <SellerOnboardingWizard
          onComplete={(created) => {
            setSellers((prev) => [created, ...prev]);
            handleShowNotice('success', `Seller profile for "${created.name}" published and queued for compliance review!`);
            setActiveTab('directory');
            loadData();
          }}
          onCancel={() => setActiveTab('dashboard')}
        />
      )}

      {/* Detail Modal */}
      <SellerDetailModal
        seller={selectedSellerForDetail}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(s) => {
          setIsDetailOpen(false);
          setSellerToEdit(s);
          setIsAddEditOpen(true);
        }}
        onOpenVerifyModal={(s) => {
          setSellerToVerify(s);
          setIsVerifyOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
        onMessage={(s) => {
          setIsDetailOpen(false);
          if (onMessageSeller) onMessageSeller(s.id, s.name);
        }}
      />

      {/* Add / Edit Modal */}
      <AddEditSellerModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        sellerToEdit={sellerToEdit}
        onSave={handleSaveSeller}
      />

      {/* Invite Modal */}
      <InviteSellerModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSendInvite={handleSendInvite}
      />

      {/* Verification Review Modal */}
      <VerifyEvidenceModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        seller={sellerToVerify}
        onUpdateVerification={handleUpdateVerification}
      />

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {confirmDialog.title}
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  action();
                }}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/30'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/30'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
