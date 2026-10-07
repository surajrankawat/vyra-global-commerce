import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BusinessType } from '../types';
import { Building2, Lock, Mail, User, Globe, Phone, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  requireBusiness?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, requireBusiness = false }) => {
  const { user, login, signUp, resetPassword, createNewBusiness, isSupabaseMode } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot' | 'business'>(requireBusiness ? 'business' : 'login');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Business Form State
  const [bizName, setBizName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('Manufacturer');
  const [industry, setIndustry] = useState('Natural Stone & Building Materials');
  const [exportCountries, setExportCountries] = useState('United States, United Arab Emirates, Germany');
  const [gstNumber, setGstNumber] = useState('');
  const [iecCode, setIecCode] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('USD');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Login failed. Check your credentials.');
        } else if (onClose) {
          onClose();
        }
      } else if (tab === 'signup') {
        const res = await signUp(email, password, fullName);
        if (!res.success) {
          setError(res.error || 'Sign up failed.');
        } else {
          setMessage('Account successfully created! Now set up your business.');
          setTab('business');
        }
      } else if (tab === 'forgot') {
        const res = await resetPassword(email);
        if (!res.success) {
          setError(res.error || 'Password reset request failed.');
        } else {
          setMessage('Password reset instructions sent. Check your inbox.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim()) {
      setError('Business name is required.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const exportList = exportCountries
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await createNewBusiness({
        name: bizName.trim(),
        owner_name: ownerName.trim() || undefined,
        country: country.trim(),
        state: state.trim() || undefined,
        city: city.trim() || undefined,
        website: website.trim() || undefined,
        email: email || undefined,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        business_type: businessType,
        industry: industry.trim(),
        export_countries: exportList,
        gst_number: gstNumber.trim() || undefined,
        iec_code: iecCode.trim() || undefined,
        description: description.trim() || undefined,
        currency: currency || 'USD',
      });

      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create business profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg tracking-wider shadow-md">
              V
            </div>
            <div>
              <h2 className="font-bold text-lg text-white leading-tight">VYRA</h2>
              <p className="text-xs text-slate-300">Global Business & Commerce Network</p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isSupabaseMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
            {isSupabaseMode ? 'Supabase Auth' : 'Local Sandbox Mode'}
          </span>
        </div>

        {/* Tab Selection */}
        {tab !== 'business' && (
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
            <button
              id="tab-login-btn"
              type="button"
              onClick={() => { setTab('login'); setError(null); setMessage(null); }}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${tab === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Sign In
            </button>
            <button
              id="tab-signup-btn"
              type="button"
              onClick={() => { setTab('signup'); setError(null); setMessage(null); }}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${tab === 'signup' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Create Account
            </button>
            <button
              id="tab-forgot-btn"
              type="button"
              onClick={() => { setTab('forgot'); setError(null); setMessage(null); }}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${tab === 'forgot' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Reset Password
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {tab === 'business' ? (
            <form onSubmit={handleBusinessSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="pb-2 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Create Your Business Profile
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure your business entity to calibrate the AI Revenue Agent, pricing models, and international export workflows.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name *</label>
                  <input
                    id="input-biz-name"
                    type="text"
                    required
                    placeholder="e.g. Royal Marble Crafts Ltd."
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Director Name</label>
                  <input
                    id="input-biz-owner"
                    type="text"
                    placeholder="e.g. Vikramaditya Rathore"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Business Type *</label>
                  <select
                    id="select-biz-type"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Exporter">Exporter</option>
                    <option value="Importer">Importer</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Ecommerce">Ecommerce Seller</option>
                    <option value="Service">Service Business</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Sector *</label>
                  <input
                    id="input-biz-industry"
                    type="text"
                    required
                    placeholder="e.g. Natural Stone, Temples & Statuary"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country *</label>
                  <input
                    id="input-biz-country"
                    type="text"
                    required
                    placeholder="e.g. India, USA, UAE"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
                  <input
                    id="input-biz-state"
                    type="text"
                    placeholder="e.g. Rajasthan"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    id="input-biz-city"
                    type="text"
                    placeholder="e.g. Makrana / Jaipur"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Website</label>
                  <input
                    id="input-biz-website"
                    type="url"
                    placeholder="https://..."
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    id="input-biz-phone"
                    type="text"
                    placeholder="+91..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Business</label>
                  <input
                    id="input-biz-whatsapp"
                    type="text"
                    placeholder="+91..."
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Currency</label>
                  <select
                    id="select-biz-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Number (if India)</label>
                  <input
                    id="input-biz-gst"
                    type="text"
                    placeholder="08AAACH1234F1Z8"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Import Export Code (IEC)</label>
                  <input
                    id="input-biz-iec"
                    type="text"
                    placeholder="0812345678"
                    value={iecCode}
                    onChange={(e) => setIecCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Export Countries (comma separated)</label>
                <input
                  id="input-biz-export-countries"
                  type="text"
                  placeholder="e.g. USA, UAE, Germany, Australia, UK"
                  value={exportCountries}
                  onChange={(e) => setExportCountries(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Description</label>
                <textarea
                  id="input-biz-description"
                  rows={2}
                  placeholder="Describe your manufacturing facility, craftsmanship, quarry operations or wholesale capabilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                {user && (
                  <button
                    id="btn-biz-cancel"
                    type="button"
                    onClick={() => { if (onClose) onClose(); }}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                )}
                <button
                  id="btn-biz-submit"
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition disabled:opacity-50"
                >
                  {loading ? 'Creating Business...' : 'Save & Launch Workspace'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {tab === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="auth-input-name"
                      type="text"
                      required
                      placeholder="e.g. Vikramaditya Rathore"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="auth-input-email"
                    type="email"
                    required
                    placeholder="executive@yourbusiness.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {tab !== 'forgot' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="auth-input-password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition disabled:opacity-50 mt-2"
              >
                {loading
                  ? 'Processing...'
                  : tab === 'login'
                  ? 'Sign In to VYRA'
                  : tab === 'signup'
                  ? 'Create Enterprise Account'
                  : 'Send Reset Instructions'}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                {isSupabaseMode ? (
                  <span>Secured with Supabase Auth and Row Level Security.</span>
                ) : (
                  <span>Running in local sandbox mode. Database is fully isolated to this browser session.</span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
