import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, Send, CheckCircle2, UserPlus, Ban } from 'lucide-react';
import { SellerProfile, SellerVerificationEvidence } from '../../types';

// ==========================================
// 1. ADD / EDIT SELLER MODAL
// ==========================================
interface AddEditSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerToEdit?: SellerProfile | null;
  onSave: (data: Partial<SellerProfile>) => Promise<void>;
}

export const AddEditSellerModal: React.FC<AddEditSellerModalProps> = ({
  isOpen,
  onClose,
  sellerToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');
  const [city, setCity] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [businessType, setBusinessType] = useState('Manufacturer');
  const [category, setCategory] = useState('Natural Stone & Construction');
  const [moq, setMoq] = useState<number | ''>(50);
  const [manufacturingCapacity, setManufacturingCapacity] = useState('5,000 sqm / month');
  const [exportCountries, setExportCountries] = useState('United States, UAE, United Kingdom');
  const [shippingCapabilities, setShippingCapabilities] = useState('FOB, CIF, Air Freight, Ocean Container');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sellerToEdit) {
      setName(sellerToEdit.name || '');
      setLegalName(sellerToEdit.legal_name || sellerToEdit.name || '');
      setOwnerName(sellerToEdit.owner_name || '');
      setEmail(sellerToEdit.email || '');
      setPhone(sellerToEdit.phone || '');
      setCountry(sellerToEdit.country || 'India');
      setCity(sellerToEdit.city || '');
      setAddressLine1(sellerToEdit.address_line1 || '');
      setBusinessType(sellerToEdit.business_type || 'Manufacturer');
      setCategory(sellerToEdit.category || sellerToEdit.industry || '');
      setMoq(sellerToEdit.moq || 1);
      setManufacturingCapacity(sellerToEdit.manufacturing_capacity || '');
      setExportCountries((sellerToEdit.export_countries || []).join(', '));
      setShippingCapabilities((sellerToEdit.shipping_capabilities || ['FOB', 'CIF']).join(', '));
      setDescription(sellerToEdit.description || '');
    } else {
      setName('');
      setLegalName('');
      setOwnerName('');
      setEmail('');
      setPhone('');
      setCountry('India');
      setCity('');
      setAddressLine1('');
      setBusinessType('Manufacturer');
      setCategory('Natural Stone & Construction');
      setMoq(50);
      setManufacturingCapacity('5,000 sqm / month');
      setExportCountries('United States, UAE, United Kingdom');
      setShippingCapabilities('FOB, CIF, Air Freight, Ocean Container');
      setDescription('');
    }
    setError(null);
  }, [sellerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Business name is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        legal_name: legalName.trim() || name.trim(),
        owner_name: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country: country.trim(),
        city: city.trim(),
        address_line1: addressLine1.trim(),
        business_type: businessType as any,
        category: category.trim(),
        industry: category.trim(),
        moq: Number(moq) || 1,
        manufacturing_capacity: manufacturingCapacity.trim(),
        export_countries: exportCountries.split(',').map((c) => c.trim()).filter(Boolean),
        shipping_capabilities: shippingCapabilities.split(',').map((c) => c.trim()).filter(Boolean),
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save seller');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {sellerToEdit ? 'Edit Seller Business' : 'Add New Seller Business'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Stone Exporters Ltd."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Legal Entity Name
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Apex Global Stone Industries PVT LTD"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Authorized Owner / Contact
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@apexstone.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Type
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <option value="Manufacturer">Manufacturer</option>
                <option value="Exporter">Exporter</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Retailer">Retailer</option>
                <option value="Distributor">Distributor</option>
                <option value="Brand">Brand</option>
                <option value="Service Provider">Service Provider</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Natural Stone & Granite"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / Port City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Udaipur, Rajasthan"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Order Quantity (MOQ)
              </label>
              <input
                type="number"
                value={moq}
                onChange={(e) => setMoq(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Manufacturing / Trading Capacity
            </label>
            <input
              type="text"
              value={manufacturingCapacity}
              onChange={(e) => setManufacturingCapacity(e.target.value)}
              placeholder="e.g. 50,000 units / month"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Export Destinations (comma separated)
            </label>
            <input
              type="text"
              value={exportCountries}
              onChange={(e) => setExportCountries(e.target.value)}
              placeholder="United States, UAE, United Kingdom, Germany"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Description & Value Proposition
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe factory capabilities, quality certifications, and catalog lines..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : sellerToEdit ? 'Update Seller' : 'Create Seller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. INVITE SELLER MODAL
// ==========================================
interface InviteSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvite: (email: string, businessName: string, role: string) => Promise<void>;
}

export const InviteSellerModal: React.FC<InviteSellerModalProps> = ({
  isOpen,
  onClose,
  onSendInvite,
}) => {
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [role, setRole] = useState('Manufacturer / Supplier');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !businessName.trim()) {
      setError('Email and business name are required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSendInvite(email.trim(), businessName.trim(), role);
      setSuccessNotice(`Invitation dispatched to ${email}. Token generated.`);
      setTimeout(() => {
        setSuccessNotice(null);
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Invite Supplier / Manufacturer
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supplier Business Name *
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Kyoto Precision Parts Co."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recipient Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trade@kyotoparts.co.jp"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Seller Type / Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <option value="Manufacturer / Supplier">Manufacturer / Supplier</option>
              <option value="Wholesale Exporter">Wholesale Exporter</option>
              <option value="OEM / ODM Partner">OEM / ODM Partner</option>
              <option value="Distributor">Distributor</option>
            </select>
          </div>

          <p className="text-[11px] text-slate-400">
            The supplier will receive a secure onboarding token allowing them to set up their catalog, verify compliance credentials, and respond to global buyer RFQs.
          </p>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sending...' : 'Send Invitation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. VERIFICATION REVIEW MODAL
// ==========================================
interface VerifyEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: SellerProfile | null;
  onUpdateVerification: (status: 'Verified' | 'Rejected' | 'Pending', reason: string) => Promise<void>;
}

export const VerifyEvidenceModal: React.FC<VerifyEvidenceModalProps> = ({
  isOpen,
  onClose,
  seller,
  onUpdateVerification,
}) => {
  const [decision, setDecision] = useState<'Verified' | 'Rejected' | 'Pending'>('Verified');
  const [reason, setReason] = useState('All business registration and corporate certifications verified against official trade registry.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (seller?.verification_status_normalized === 'Verified') {
      setDecision('Verified');
      setReason('Credentials verified.');
    } else if (seller?.verification_status_normalized === 'Rejected') {
      setDecision('Rejected');
      setReason(seller.rejection_reason || 'Incomplete documentation');
    } else {
      setDecision('Verified');
      setReason('All business registration and corporate certifications verified against official trade registry.');
    }
  }, [seller, isOpen]);

  if (!isOpen || !seller) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateVerification(decision, reason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Compliance Verification Review
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Seller Entity:</span>
            <strong className="text-sm text-slate-900 dark:text-white block">{seller.name}</strong>
            <span className="text-slate-500 font-mono text-[11px]">
              CIN/Tax: {seller.tax_id || seller.registration_number || 'Under Review'} • {seller.country}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Verification Decision
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDecision('Verified');
                  setReason('All business registration and corporate certifications verified against official trade registry.');
                }}
                className={`py-2 px-3 rounded-xl font-semibold border text-center transition ${
                  decision === 'Verified'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Approve (Verified)
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('Pending');
                  setReason('Additional evidence requested: Factory audit or tax clearance certificate.');
                }}
                className={`py-2 px-3 rounded-xl font-semibold border text-center transition ${
                  decision === 'Pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Request Info (Pending)
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('Rejected');
                  setReason('Document discrepancy or unverified commercial credentials.');
                }}
                className={`py-2 px-3 rounded-xl font-semibold border text-center transition ${
                  decision === 'Rejected'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Reject Verification
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Compliance Notes & Reason *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            This compliance decision will be permanently recorded in the immutable audit log and dispatched as a notification to the seller.
          </p>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-white rounded-xl font-semibold transition ${
                decision === 'Verified'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : decision === 'Rejected'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isSubmitting ? 'Updating...' : `Confirm Decision (${decision})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
