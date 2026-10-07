import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  MapPin,
  Image,
  Package,
  Globe,
  ShieldCheck,
  Store,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { SellerOnboardingDraft, SellerProfile } from '../../types';
import { saveSellerOnboardingDraft, fetchSellerOnboardingDraft, createSeller } from '../../lib/db';

interface SellerOnboardingWizardProps {
  onComplete: (seller: SellerProfile) => void;
  onCancel: () => void;
}

export const SellerOnboardingWizard: React.FC<SellerOnboardingWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [legalName, setLegalName] = useState('Apex International Industries');
  const [brandName, setBrandName] = useState('Apex Stone');
  const [businessType, setBusinessType] = useState('Manufacturer');
  const [category, setCategory] = useState('Natural Stone & Construction');
  const [email, setEmail] = useState('onboarding@apexstone.com');
  const [phone, setPhone] = useState('+91 98290 12345');
  const [website, setWebsite] = useState('https://apexstone.com');
  const [description, setDescription] = useState('Leading exporter and manufacturer of architectural marble slabs, granite countertops, and sandstone pavers with quarry ownership.');

  // Step 2 Address
  const [addressLine1, setAddressLine1] = useState('Plot 42-45, Industrial Growth Centre');
  const [city, setCity] = useState('Udaipur');
  const [state, setState] = useState('Rajasthan');
  const [postalCode, setPostalCode] = useState('313001');
  const [country, setCountry] = useState('India');
  const [locationType, setLocationType] = useState('Factory & Processing Unit');

  // Step 3 Media
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=200&auto=format&fit=crop&q=80');
  const [coverImageUrl, setCoverImageUrl] = useState('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80');
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=factory-tour-sample');

  // Step 4 Product
  const [firstProductName, setFirstProductName] = useState('Statuario White Polished Marble Slabs');
  const [firstProductPrice, setFirstProductPrice] = useState<number | ''>(85);
  const [firstProductMoq, setFirstProductMoq] = useState<number | ''>(100);
  const [firstProductStock, setFirstProductStock] = useState<number | ''>(2500);

  // Step 5 Capabilities
  const [manufacturingCapacity, setManufacturingCapacity] = useState('15,000 square meters / month');
  const [exportCountries, setExportCountries] = useState('United States, UAE, United Kingdom, Canada, Australia');
  const [shippingTerms, setShippingTerms] = useState('FOB, CIF, EXW');
  const [leadTimeDays, setLeadTimeDays] = useState<number | ''>(14);

  // Step 6 Compliance
  const [registrationNumber, setRegistrationNumber] = useState('U14101RJ2018PTC061234');
  const [taxId, setTaxId] = useState('08AABCA1234F1Z5');
  const [iecCode, setIecCode] = useState('0512345678');

  // Step 7 Storefront
  const [storeSlug, setStoreSlug] = useState('apex-stone');
  const [storeTagline, setStoreTagline] = useState('Precision quarried natural stone for global architects.');

  // Load draft if available
  useEffect(() => {
    fetchSellerOnboardingDraft().then((draft) => {
      if (draft && draft.business_info?.legal_name) {
        setLegalName(draft.business_info.legal_name);
        setBrandName(draft.business_info.brand_name || draft.business_info.legal_name);
        setCategory(draft.business_info.category || '');
        setEmail(draft.business_info.email || '');
        setPhone(draft.business_info.phone || '');
        setWebsite(draft.business_info.website || '');
        setDescription(draft.business_info.description || '');
        if (draft.address_info) {
          setAddressLine1(draft.address_info.address_line1 || '');
          setCity(draft.address_info.city || '');
          setCountry(draft.address_info.country || 'India');
        }
        if (draft.current_step) {
          setCurrentStep(Math.min(draft.current_step, 8));
        }
      }
    });
  }, []);

  const handleSaveDraft = async () => {
    const draft: SellerOnboardingDraft = {
      id: 'draft-seller-onboarding',
      current_step: currentStep,
      business_info: {
        legal_name: legalName,
        brand_name: brandName,
        business_type: businessType,
        industry: category,
        category,
        email,
        phone,
        website,
        description,
      },
      address_info: {
        address_line1: addressLine1,
        city,
        state,
        postal_code: postalCode,
        country,
        location_type: locationType,
      },
      media_info: {
        logo_url: logoUrl,
        cover_image_url: coverImageUrl,
        gallery_urls: [coverImageUrl],
        video_url: videoUrl,
      },
      product_info: {
        name: firstProductName,
        category,
        price: Number(firstProductPrice) || 50,
        currency: 'USD',
        moq: Number(firstProductMoq) || 1,
        stock: Number(firstProductStock) || 100,
        images: [coverImageUrl],
      },
      capabilities_info: {
        manufacturing_capacity: manufacturingCapacity,
        export_countries: exportCountries.split(',').map((c) => c.trim()),
        shipping_capabilities: shippingTerms.split(',').map((s) => s.trim()),
        lead_time_days: Number(leadTimeDays) || 14,
      },
      compliance_info: {
        registration_number: registrationNumber,
        tax_id: taxId,
        iec_code: iecCode,
        evidence_urls: [],
      },
      storefront_info: {
        store_slug: storeSlug,
        tagline: storeTagline,
        is_published: true,
      },
      updated_at: new Date().toISOString(),
    };

    await saveSellerOnboardingDraft(draft);
    setSavedNotice('Onboarding progress saved! You can close and resume anytime.');
    setTimeout(() => setSavedNotice(null), 4000);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const created = await createSeller({
        name: brandName.trim() || legalName.trim(),
        legal_name: legalName.trim(),
        brand_name: brandName.trim(),
        owner_name: 'Authorized Executive',
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim(),
        business_type: businessType as any,
        category: category.trim(),
        industry: category.trim(),
        description: description.trim(),
        country: country.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        address_line1: addressLine1.trim(),
        logo_url: logoUrl,
        cover_image_url: coverImageUrl,
        moq: Number(firstProductMoq) || 1,
        manufacturing_capacity: manufacturingCapacity.trim(),
        export_countries: exportCountries.split(',').map((c) => c.trim()).filter(Boolean),
        shipping_capabilities: shippingTerms.split(',').map((s) => s.trim()).filter(Boolean),
        lead_time_days: Number(leadTimeDays) || 14,
        registration_number: registrationNumber.trim(),
        tax_id: taxId.trim(),
        iec_code: iecCode.trim(),
        verification_status: 'pending',
        operational_status: 'Active',
      });

      onComplete(created);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error publishing seller');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Identity', icon: Building2 },
    { num: 2, title: 'Addresses', icon: MapPin },
    { num: 3, title: 'Media', icon: Image },
    { num: 4, title: 'Initial Catalog', icon: Package },
    { num: 5, title: 'Shipping & Trade', icon: Globe },
    { num: 6, title: 'Compliance', icon: ShieldCheck },
    { num: 7, title: 'Storefront', icon: Store },
    { num: 8, title: 'Review & Publish', icon: CheckCircle2 },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold">
            STEP {currentStep} OF 8 — SELLER ONBOARDING
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {steps[currentStep - 1].title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Progress</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
          >
            Exit Wizard
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stepper Dots Bar */}
      <div className="flex items-center justify-between overflow-x-auto py-2">
        {steps.map((s) => {
          const isDone = s.num < currentStep;
          const isCurrent = s.num === currentStep;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setCurrentStep(s.num)}
              className="flex items-center gap-2 px-2 shrink-0 group text-left"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span
                className={`hidden md:inline text-xs font-medium ${
                  isCurrent
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : isDone
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-slate-400'
                }`}
              >
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[280px] p-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-4">
        {/* Step 1: Identity */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Legal Business Name *</label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Brand Name *</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <option value="Manufacturer">Manufacturer</option>
                <option value="Exporter">Exporter</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Distributor">Distributor</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Industry & Category *</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Company Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Step 2: Addresses */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Factory / Head Office Street Address</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">City / District</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Step 3: Media */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Company Logo URL</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Factory / Workshop Cover Photo URL</label>
              <input
                type="text"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Video Tour Link (YouTube or Vimeo)</label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Step 4: Initial Catalog */}
        {currentStep === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Primary Product Name *</label>
              <input
                type="text"
                value={firstProductName}
                onChange={(e) => setFirstProductName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Wholesale Price (USD)</label>
              <input
                type="number"
                value={firstProductPrice}
                onChange={(e) => setFirstProductPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Minimum Order Quantity (MOQ)</label>
              <input
                type="number"
                value={firstProductMoq}
                onChange={(e) => setFirstProductMoq(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Step 5: Shipping & Trade */}
        {currentStep === 5 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Production / Monthly Capacity</label>
              <input
                type="text"
                value={manufacturingCapacity}
                onChange={(e) => setManufacturingCapacity(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Average Production Lead Time (Days)</label>
              <input
                type="number"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Export Destinations (comma separated)</label>
              <input
                type="text"
                value={exportCountries}
                onChange={(e) => setExportCountries(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Step 6: Compliance */}
        {currentStep === 6 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Registration / CIN Number</label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">GST / VAT / Tax ID</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">IEC Export Code</label>
              <input
                type="text"
                value={iecCode}
                onChange={(e) => setIecCode(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
              />
            </div>
          </div>
        )}

        {/* Step 7: Storefront */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Storefront Web Handle</label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-200 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-xl font-mono text-slate-500">
                  vyra.network/seller/
                </span>
                <input
                  type="text"
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-r-xl font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Storefront Banner Tagline</label>
              <input
                type="text"
                value={storeTagline}
                onChange={(e) => setStoreTagline(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Step 8: Review & Publish */}
        {currentStep === 8 && (
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Review Registration Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><strong>Business:</strong> {brandName} ({legalName})</div>
                <div><strong>Type:</strong> {businessType}</div>
                <div><strong>Location:</strong> {city}, {country}</div>
                <div><strong>Category:</strong> {category}</div>
                <div><strong>Product:</strong> {firstProductName} (${firstProductPrice})</div>
                <div><strong>Capacity:</strong> {manufacturingCapacity}</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Upon publishing, your seller entity will be registered in the global directory, indexed for buyer RFQs, and queued for compliance verification review.
            </p>
          </div>
        )}
      </div>

      {/* Stepper Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        {currentStep < 8 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.min(8, s + 1))}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleFinalSubmit}
            className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Publishing Seller...' : 'Publish Seller Profile'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
