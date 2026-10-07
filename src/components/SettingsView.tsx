import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { testSupabaseConnection, getSupabaseConfig, saveSupabaseConfig, fetchServerSupabaseConfig } from '../lib/supabase';
import {
  updateBusiness,
  fetchBankAccounts,
  createBankAccount,
  fetchPayouts,
  fetchExpenses,
  createExpense,
  fetchAuditLogs,
  fetchBusinessMembers,
  fetchDocuments,
  uploadDocumentFile,
  fetchBusinessLocations,
  createBusinessLocation,
  deleteBusinessLocation,
  fetchMigrationStatus,
} from '../lib/db';
import {
  BankAccount,
  Payout,
  Expense,
  AuditLog,
  BusinessMember,
  DocumentRecord,
  DocumentCategory,
  UserRole,
  BusinessLocation,
  LocationType,
  SupportedBankingCountry,
  MigrationRecord,
} from '../types';
import {
  Settings,
  Database,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Building2,
  CreditCard,
  Landmark,
  Users,
  FolderLock,
  History,
  Download,
  UploadCloud,
  AlertTriangle,
  AlertCircle,
  X,
  Plus,
  ArrowUpRight,
  FileCheck,
  MapPin,
  Clock,
  Globe,
  Trash2,
} from 'lucide-react';

type SettingsTab =
  | 'profile'
  | 'locations'
  | 'database'
  | 'banking_payments'
  | 'team_rbac'
  | 'documents'
  | 'audit_logs'
  | 'export'
  | 'migrations';

export const SettingsView: React.FC = () => {
  const { currentBusiness, refreshBusiness, isSupabaseConnected, setIsSupabaseConnected, checkConnection, user, userRole, apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Supabase Config State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Business Profile Form (Section 4)
  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [businessType, setBusinessType] = useState('Manufacturer');
  const [industry, setIndustry] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [yearEstablished, setYearEstablished] = useState<string | number>('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [iecCode, setIecCode] = useState('');
  const [website, setWebsite] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');

  // Address
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [building, setBuilding] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [countryCode, setCountryCode] = useState('IN');
  const [timezone, setTimezone] = useState('UTC+5:30');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Locations State
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState<LocationType>('Factory');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocCity, setNewLocCity] = useState('');
  const [newLocState, setNewLocState] = useState('');
  const [newLocPostal, setNewLocPostal] = useState('');
  const [newLocCountry, setNewLocCountry] = useState('India');
  const [newLocHours, setNewLocHours] = useState('08:00 - 18:00 (Mon-Sat)');
  const [newLocContact, setNewLocContact] = useState('');
  const [newLocPublic, setNewLocPublic] = useState(true);

  // Country-Aware Banking & Payments State (Section 27)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [selectedBankCountry, setSelectedBankCountry] = useState<SupportedBankingCountry>('India');
  const [newBankHolder, setNewBankHolder] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccountRaw, setNewBankAccountRaw] = useState('');
  const [newBankType, setNewBankType] = useState<BankAccount['account_type']>('current');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankSwiftBic, setBankSwiftBic] = useState('');
  const [bankAbaRouting, setBankAbaRouting] = useState('');
  const [bankSortCode, setBankSortCode] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [bankBsb, setBankBsb] = useState('');
  const [bankInstitution, setBankInstitution] = useState('');
  const [bankTransit, setBankTransit] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);
  const [settingsNotice, setSettingsNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Team & RBAC State
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('SALES');

  // Documents & Storage State
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Quality Certificate');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Migration Center Records (Section 23)
  const [migrationRecords, setMigrationRecords] = useState<MigrationRecord[]>([]);

  useEffect(() => {
    fetchMigrationStatus().then(setMigrationRecords).catch(console.error);
  }, []);

  useEffect(() => {
    const config = getSupabaseConfig();
    if (config.url) setSupabaseUrl(config.url);
    if (config.anonKey) setSupabaseAnonKey(config.anonKey);

    if (currentBusiness) {
      setBusinessName(currentBusiness.name || '');
      setLegalName(currentBusiness.legal_name || currentBusiness.name || '');
      setBrandName(currentBusiness.brand_name || currentBusiness.name || '');
      setBusinessType(currentBusiness.business_type || 'Manufacturer');
      setIndustry(currentBusiness.industry || '');
      setCategory(currentBusiness.category || '');
      setSubcategory(currentBusiness.subcategory || '');
      setYearEstablished(currentBusiness.year_established || '');
      setEmployeeCount(currentBusiness.employee_count || '');
      setRegistrationNumber(currentBusiness.registration_number || '');
      setTaxId(currentBusiness.tax_id || '');
      setGstNumber(currentBusiness.gst_number || '');
      setIecCode(currentBusiness.iec_code || '');
      setWebsite(currentBusiness.website || '');
      setOwnerName(currentBusiness.owner_name || '');
      setEmail(currentBusiness.email || '');
      setPhone(currentBusiness.phone || '');
      setCountry(currentBusiness.country || 'India');
      setCity(currentBusiness.city || '');
      setCurrency(currentBusiness.currency || 'USD');
      setDescription(currentBusiness.description || '');

      setAddressLine1(currentBusiness.address_line1 || '');
      setAddressLine2(currentBusiness.address_line2 || '');
      setBuilding(currentBusiness.building || '');
      setStreet(currentBusiness.street || '');
      setArea(currentBusiness.area || '');
      setDistrict(currentBusiness.district || '');
      setProvince(currentBusiness.province || currentBusiness.state || '');
      setPostalCode(currentBusiness.postal_code || '');
      setCountryCode(currentBusiness.country_code || 'IN');
      setTimezone(currentBusiness.timezone || 'UTC+5:30');

      loadData(currentBusiness.id);
    }
  }, [currentBusiness]);

  const loadData = async (bizId: string) => {
    try {
      const [banks, pouts, exps, mems, docs, logs, locs] = await Promise.all([
        fetchBankAccounts(bizId),
        fetchPayouts(bizId),
        fetchExpenses(bizId),
        fetchBusinessMembers(bizId),
        fetchDocuments(bizId),
        fetchAuditLogs(bizId),
        fetchBusinessLocations(bizId),
      ]);
      setBankAccounts(banks);
      setPayouts(pouts);
      setExpenses(exps);
      setMembers(mems);
      setDocuments(docs);
      setAuditLogs(logs);
      setLocations(locs);
    } catch (err) {
      console.error('Error loading settings data:', err);
    }
  };

  const handleSaveBusinessProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    setIsSavingProfile(true);
    try {
      await updateBusiness(currentBusiness.id, {
        name: businessName.trim(),
        legal_name: legalName.trim(),
        brand_name: brandName.trim(),
        business_type: businessType as any,
        industry: industry.trim(),
        category: category.trim(),
        subcategory: subcategory.trim(),
        year_established: yearEstablished,
        employee_count: employeeCount.trim(),
        registration_number: registrationNumber.trim(),
        tax_id: taxId.trim(),
        gst_number: gstNumber.trim(),
        iec_code: iecCode.trim(),
        website: website.trim(),
        owner_name: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country: country.trim(),
        city: city.trim(),
        currency: currency.trim(),
        description: description.trim(),
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim(),
        building: building.trim(),
        street: street.trim(),
        area: area.trim(),
        district: district.trim(),
        province: province.trim(),
        postal_code: postalCode.trim(),
        country_code: countryCode.trim(),
        timezone: timezone.trim(),
      });
      await refreshBusiness();
      setSettingsNotice({ type: 'success', message: 'Enterprise Profile updated successfully!' });
      setTimeout(() => setSettingsNotice(null), 5000);
    } catch (err: any) {
      setSettingsNotice({ type: 'error', message: `Failed to update enterprise profile: ${err.message}` });
      setTimeout(() => setSettingsNotice(null), 6000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !newLocName.trim() || !newLocAddress.trim()) return;

    try {
      const created = await createBusinessLocation({
        business_id: currentBusiness.id,
        name: newLocName.trim(),
        location_type: newLocType,
        address_line1: newLocAddress.trim(),
        city: newLocCity.trim() || currentBusiness.city || 'City',
        state_province: newLocState.trim() || currentBusiness.state || 'State',
        postal_code: newLocPostal.trim() || '000000',
        country: newLocCountry.trim() || currentBusiness.country || 'India',
        country_code: 'IN',
        opening_hours: newLocHours.trim(),
        contact_person: newLocContact.trim(),
        is_public: newLocPublic,
        is_primary: locations.length === 0,
      });

      setLocations([...locations, created]);
      setIsAddingLocation(false);
      setNewLocName('');
      setNewLocAddress('');
      setSettingsNotice({ type: 'success', message: `Facility "${created.name}" registered.` });
      setTimeout(() => setSettingsNotice(null), 5000);
    } catch (err: any) {
      setSettingsNotice({ type: 'error', message: `Failed to add location: ${err.message}` });
      setTimeout(() => setSettingsNotice(null), 5000);
    }
  };

  const handleDeleteLocation = async (locId: string) => {
    try {
      await deleteBusinessLocation(locId);
      setLocations(locations.filter((l) => l.id !== locId));
      setSettingsNotice({ type: 'success', message: 'Location removed.' });
      setTimeout(() => setSettingsNotice(null), 3000);
    } catch (err: any) {
      setSettingsNotice({ type: 'error', message: `Failed to delete location: ${err.message}` });
    }
  };

  // Section 27: Global Country-Aware Banking
  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !newBankHolder.trim() || !newBankName.trim() || !newBankAccountRaw.trim()) return;

    try {
      const created = await createBankAccount({
        business_id: currentBusiness.id,
        account_holder_name: newBankHolder.trim(),
        bank_name: newBankName.trim(),
        account_type: newBankType,
        country: selectedBankCountry,
        currency: currentBusiness.currency || 'USD',
        provider: 'Direct_Wire',
        last4: newBankAccountRaw.trim().slice(-4),
        is_primary: bankAccounts.length === 0,
        status: 'active',
      });

      setBankAccounts([created, ...bankAccounts]);
      setIsAddingBank(false);
      setNewBankHolder('');
      setNewBankName('');
      setNewBankAccountRaw('');
      setBankIfsc('');
      setBankAbaRouting('');
      setBankSortCode('');
      setBankIban('');
      setBankSwiftBic('');
      setBankBsb('');
      setBankInstitution('');
      setBankTransit('');
      setBankCode('');
      setBranchCode('');
      setSettingsNotice({
        type: 'success',
        message: `Compliant wire account registered for ${selectedBankCountry} (Masked: only last 4 digits persisted).`,
      });
      setTimeout(() => setSettingsNotice(null), 5000);
    } catch (err: any) {
      setSettingsNotice({ type: 'error', message: `Failed to add bank account: ${err.message}` });
      setTimeout(() => setSettingsNotice(null), 6000);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentBusiness) return;

    setIsUploadingDoc(true);
    try {
      const doc = await uploadDocumentFile(currentBusiness.id, file, uploadCategory);
      setDocuments([doc, ...documents]);
      setSettingsNotice({ type: 'success', message: `Document "${file.name}" uploaded successfully!` });
      setTimeout(() => setSettingsNotice(null), 5000);
    } catch (err: any) {
      setSettingsNotice({ type: 'error', message: `Upload failed: ${err.message}` });
      setTimeout(() => setSettingsNotice(null), 6000);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    if (!currentBusiness) return;
    try {
      const res = await apiFetch(`/api/export?business_id=${currentBusiness.id}&format=${format}`);
      if (format === 'json') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vyra_export_${currentBusiness.name.replace(/\s+/g, '_')}.json`;
        a.click();
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vyra_export_${currentBusiness.id}.json`;
        a.click();
      }
    } catch (err: any) {
      setSettingsNotice({ type: 'error', message: `Export failed: ${err.message}` });
      setTimeout(() => setSettingsNotice(null), 6000);
    }
  };

  return (
    <div id="settings-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-800" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System & Enterprise Administration</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise profile, plant mapping, country-aware wire banking, RBAC 2.0, and database migration health.
          </p>
        </div>
      </div>

      {settingsNotice && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          settingsNotice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {settingsNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{settingsNotice.message}</span>
          </div>
          <button onClick={() => setSettingsNotice(null)} className="ml-3 text-slate-500 hover:text-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'profile' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" /> Enterprise Profile
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'locations' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" /> Plant & Locations ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab('banking_payments')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'banking_payments' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Landmark className="w-4 h-4" /> Country Banking
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'database' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" /> Supabase Bridge
        </button>
        <button
          onClick={() => setActiveTab('team_rbac')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'team_rbac' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" /> Team & RBAC
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'documents' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderLock className="w-4 h-4" /> Documents & Storage
        </button>
        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'audit_logs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" /> Audit Trail
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'export' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Download className="w-4 h-4" /> Data Export
        </button>
        <button
          onClick={() => setActiveTab('migrations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'migrations' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Migration Center
        </button>
      </div>

      {/* 1. ENTERPRISE PROFILE TAB (Section 4) */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Complete Enterprise Business Profile</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 font-bold uppercase text-slate-700">
              Tax ID & Trade Compliance
            </span>
          </div>

          <form onSubmit={handleSaveBusinessProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Legal Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Makrana Marble Exports LLP"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operating Type</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                >
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Exporter">Exporter</option>
                  <option value="Importer">Importer</option>
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Brand">Brand</option>
                  <option value="Service">Service Provider</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Industry</label>
                <input
                  type="text"
                  placeholder="e.g. Natural Stone & Minerals"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subcategory</label>
                <input
                  type="text"
                  placeholder="e.g. Marble Slabs & Tiles"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Year Established</label>
                <input
                  type="text"
                  placeholder="e.g. 2008"
                  value={yearEstablished}
                  onChange={(e) => setYearEstablished(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employees</label>
                <select
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                >
                  <option value="">Select range...</option>
                  <option value="1-10">1-10 Employees</option>
                  <option value="11-50">11-50 Employees</option>
                  <option value="51-200">51-200 Employees</option>
                  <option value="201-500">201-500 Employees</option>
                  <option value="500+">500+ Employees</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GST / VAT Number</label>
                <input
                  type="text"
                  placeholder="08AAACM4821P1Z5"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">IEC Code (Export-Import)</label>
                <input
                  type="text"
                  placeholder="0512839201"
                  value={iecCode}
                  onChange={(e) => setIecCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tax ID / PAN</label>
                <input
                  type="text"
                  placeholder="Tax registration ID"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Website</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>

            {/* Address & Headquarters Section */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Headquarters Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    placeholder="Building, Plot Number, Industrial Area"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Base Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {isSavingProfile ? 'Saving Changes...' : 'Save Enterprise Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. PLANT & LOCATIONS TAB (Section 4) */}
      {activeTab === 'locations' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">Registered Facilities & Plant Locations</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingLocation(!isAddingLocation)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Facility
            </button>
          </div>

          {isAddingLocation && (
            <form onSubmit={handleAddLocation} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-800">Register New Physical Location</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Facility Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 2 Processing Yard"
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Facility Type</label>
                  <select
                    value={newLocType}
                    onChange={(e: any) => setNewLocType(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="Head Office">Head Office</option>
                    <option value="Factory">Factory / Manufacturing Plant</option>
                    <option value="Warehouse">Warehouse & Depot</option>
                    <option value="Shop">Shop / Retail Store</option>
                    <option value="Showroom">Showroom & Gallery</option>
                    <option value="Branch">Regional Branch</option>
                    <option value="Pickup Location">Pickup & Port Depot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Officer</label>
                  <input
                    type="text"
                    placeholder="e.g. Plant Manager"
                    value={newLocContact}
                    onChange={(e) => setNewLocContact(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Physical Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Industrial Zone, Plot #..."
                    value={newLocAddress}
                    onChange={(e) => setNewLocAddress(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={newLocHours}
                    onChange={(e) => setNewLocHours(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingLocation(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Facility Location
                </button>
              </div>
            </form>
          )}

          {locations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              No additional facilities mapped yet. Register factories, warehouses, or showrooms above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((loc) => (
                <div key={loc.id} className="p-4 border border-slate-200 rounded-2xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-600 uppercase font-mono">{loc.location_type}</span>
                      {loc.is_primary && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                          Primary
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{loc.name}</h4>
                    <p className="text-xs text-slate-500">{loc.address_line1}, {loc.city}, {loc.country}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{loc.opening_hours || 'Standard Hours'}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. GLOBAL COUNTRY-AWARE BANKING TAB (Section 27) */}
      {activeTab === 'banking_payments' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Global Country-Aware Wire Banking</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingBank(!isAddingBank)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Bank Account
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-800">Zero-Credentials Security:</span> VYRA only saves the last 4 digits of bank accounts for verification. We never collect or store PINs, CVVs, OTPs, or net-banking passwords.
          </div>

          {isAddingBank && (
            <form onSubmit={handleAddBankAccount} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Banking Country First</h4>

              {/* Country Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Country Jurisdiction *</label>
                <select
                  value={selectedBankCountry}
                  onChange={(e) => setSelectedBankCountry(e.target.value as SupportedBankingCountry)}
                  className="w-full sm:w-80 px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-bold text-slate-900"
                >
                  <option value="India">India (IFSC, Account Number, SWIFT)</option>
                  <option value="United States">United States (ABA / Routing, Account, SWIFT)</option>
                  <option value="United Kingdom">United Kingdom (Sort Code, Account, IBAN)</option>
                  <option value="European Union">European Union (IBAN, BIC/SWIFT)</option>
                  <option value="Australia">Australia (BSB, Account, SWIFT)</option>
                  <option value="Canada">Canada (Institution, Transit, Account)</option>
                  <option value="United Arab Emirates">United Arab Emirates (IBAN, SWIFT)</option>
                  <option value="Singapore">Singapore (Bank Code, Branch Code, Account)</option>
                  <option value="Japan">Japan (Bank Code, Branch Code, Account)</option>
                </select>
              </div>

              {/* Common Base Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Beneficiary Account Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Makrana Marble Exports LLP"
                    value={newBankHolder}
                    onChange={(e) => setNewBankHolder(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Bank of India, Chase, HSBC, Barclays"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  />
                </div>
              </div>

              {/* Dynamic Country-Specific Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {selectedBankCountry === 'European Union' || selectedBankCountry === 'United Arab Emirates'
                      ? 'IBAN *'
                      : 'Account Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Only last 4 digits stored"
                    value={newBankAccountRaw}
                    onChange={(e) => setNewBankAccountRaw(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                  />
                </div>

                {selectedBankCountry === 'India' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. SBIN0001234"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono uppercase"
                    />
                  </div>
                )}

                {selectedBankCountry === 'United States' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">ABA / Routing Number (9 Digits) *</label>
                    <input
                      type="text"
                      placeholder="9-digit routing"
                      value={bankAbaRouting}
                      onChange={(e) => setBankAbaRouting(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                    />
                  </div>
                )}

                {selectedBankCountry === 'United Kingdom' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sort Code (6 Digits) *</label>
                    <input
                      type="text"
                      placeholder="e.g. 20-00-00"
                      value={bankSortCode}
                      onChange={(e) => setBankSortCode(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                    />
                  </div>
                )}

                {selectedBankCountry === 'Australia' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">BSB Number (6 Digits) *</label>
                    <input
                      type="text"
                      placeholder="e.g. 062-000"
                      value={bankBsb}
                      onChange={(e) => setBankBsb(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                    />
                  </div>
                )}

                {selectedBankCountry === 'Canada' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Institution Number (3 Digits) *</label>
                      <input
                        type="text"
                        placeholder="e.g. 004"
                        value={bankInstitution}
                        onChange={(e) => setBankInstitution(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Transit Number (5 Digits) *</label>
                      <input
                        type="text"
                        placeholder="e.g. 12345"
                        value={bankTransit}
                        onChange={(e) => setBankTransit(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                      />
                    </div>
                  </>
                )}

                {(selectedBankCountry === 'Singapore' || selectedBankCountry === 'Japan') && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Code *</label>
                      <input
                        type="text"
                        placeholder={selectedBankCountry === 'Singapore' ? 'e.g. 7171 (DBS)' : 'e.g. 0005 (MUFG)'}
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Branch Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. 081"
                        value={branchCode}
                        onChange={(e) => setBranchCode(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">SWIFT / BIC Code</label>
                  <input
                    type="text"
                    placeholder="8 or 11 characters"
                    value={bankSwiftBic}
                    onChange={(e) => setBankSwiftBic(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddingBank(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Sanitized Account
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {bankAccounts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                No bank accounts registered yet. Click &quot;Add Bank Account&quot; to link your wire disbursement account.
              </div>
            ) : (
              bankAccounts.map((acc) => (
                <div key={acc.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900">{acc.bank_name}</h4>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          ***{acc.last4}
                        </span>
                        {acc.is_primary && (
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {acc.account_holder_name} • {acc.currency} • {acc.country}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. DATABASE & SUPABASE TAB */}
      {activeTab === 'database' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">PostgreSQL Database & Supabase Synchronization</h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isSupabaseConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {isSupabaseConnected ? 'Connected & Synced' : 'Local Sandbox Mode'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supabase Project URL</label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supabase Anon Public API Key</label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. TEAM & RBAC TAB */}
      {activeTab === 'team_rbac' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Team Governance & Role-Based Access Control (RBAC 2.0)</h3>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Current role: <span className="font-bold text-slate-900 font-mono">{userRole || 'OWNER'}</span>.
            Granular permissions enforce departmental segregation across Sales, Finance, Inventory, and Procurement.
          </p>
        </div>
      )}

      {/* 6. DOCUMENTS & STORAGE TAB */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FolderLock className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Enterprise Documents & Trade Certificates</h3>
            </div>
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isUploadingDoc ? 'Uploading...' : 'Upload Document'}</span>
              <input type="file" onChange={handleDocumentUpload} disabled={isUploadingDoc} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Securely attach ISO quality certifications, phytosanitary fumigation papers, and customs declarations.
          </p>
        </div>
      )}

      {/* 7. AUDIT TRAIL TAB */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="w-5 h-5 text-slate-800" />
            <h3 className="font-bold text-sm text-slate-900">Append-Only Enterprise Audit Trail</h3>
          </div>
          <p className="text-xs text-slate-500">
            All administrative, quotation, order, and banking modifications are immutably logged for regulatory and financial audits.
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No audit records logged yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-slate-500 text-[11px] block">{log.entity_type || log.module || 'System'} • {log.entity_id || log.record_id || log.id.slice(0, 8)}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 8. DATA EXPORT TAB */}
      {activeTab === 'export' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Download className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Multi-Entity Enterprise Data Export</h3>
          </div>
          <p className="text-xs text-slate-500">
            Export your entire business operating database (Products, Leads, CRM Interactions, Quotations, Orders, and Invoices) for offline backup or enterprise migration.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleExportData('json')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Export Full JSON Bundle
            </button>
            <button
              type="button"
              onClick={() => handleExportData('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              <Download className="w-3.5 h-3.5" /> Download Archive Package
            </button>
          </div>
        </div>
      )}

      {/* 9. MIGRATION CENTER TAB (Section 31: Replaced manual DDL UI) */}
      {activeTab === 'migrations' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Database Migration Center</h3>
            </div>
            {migrationRecords.some((m) => m.status === 'Pending') ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 font-bold uppercase">
                PENDING — MANUAL ACTION REQUIRED
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                All Migrations Applied
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Schema evolution is managed centrally through automated migration pipelines.
            Direct manual SQL entry has been retired in production to guarantee multi-tenant Row Level Security integrity.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Migration Script</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Executed At</th>
                  <th className="py-2.5 px-3">Execution Time</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {migrationRecords.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans">
                      <div>{m.name}</div>
                      {m.error && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                          {m.error}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{m.version}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {m.executed_at ? new Date(m.executed_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {m.duration_ms ? `${m.duration_ms} ms` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {m.status === 'Applied' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" /> Applied
                        </span>
                      )}
                      {m.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300">
                          PENDING — MANUAL ACTION REQUIRED
                        </span>
                      )}
                      {m.status === 'Failed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
