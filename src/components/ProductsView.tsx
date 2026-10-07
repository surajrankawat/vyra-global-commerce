import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchBusinessProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  fetchInventoryMovements,
  recordInventoryMovement,
} from '../lib/db';
import { Product, InventoryMovement } from '../types';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Filter,
  Boxes,
  History,
  FileText,
  Layers,
} from 'lucide-react';
import { ProductPdfModal } from './products/ProductPdfModal';
import { CatalogBuilderModal } from './products/CatalogBuilderModal';

interface ProductsViewProps {
  onSelectProductForAI?: (product: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onSelectProductForAI }) => {
  const { currentBusiness } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pdfModalProduct, setPdfModalProduct] = useState<Product | null>(null);
  const [isCatalogBuilderOpen, setIsCatalogBuilderOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState('USD');
  const [moq, setMoq] = useState<number | ''>(1);
  const [stockQuantity, setStockQuantity] = useState<number | ''>(0);
  const [weight, setWeight] = useState<number | ''>('');
  const [dimensions, setDimensions] = useState('');
  const [material, setMaterial] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [stockNotice, setStockNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // AI Product Content Suite State
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<{ type: string; content: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateAI = async (type: 'title' | 'description' | 'seo' | 'tags' | 'specifications' | 'translate' | 'buyer_message') => {
    setAiGenerating(true);
    setAiError(null);
    try {
      if (type === 'buyer_message') {
        const res = await fetch('/api/ai/sales-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: currentBusiness?.name,
            productTitle: name || 'Product',
            buyerCountry: 'International',
            buyerType: 'Wholesale Distributor',
            productDetails: `${description || ''} - Price: ${currency} ${price || 'Inquire'} - MOQ: ${moq}`,
            channel: 'Email',
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data?.message) {
          setAiPreview({ type: 'Buyer Outreach Message', content: `Subject: ${data.data.subject}\n\n${data.data.message}` });
        } else {
          const raw = typeof data.error === 'string' ? data.error : data.error?.message || '';
          setAiError(res.status === 503 || raw.toLowerCase().includes('not configured') ? 'AI NOT CONFIGURED' : (raw || 'Failed to generate message'));
        }
      } else if (type === 'translate') {
        const textToTranslate = `${name}\n\n${description}`;
        const res = await fetch('/api/ai/translation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textToTranslate,
            targetLanguage: 'German',
            domain: 'commercial_trade',
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data?.translated_text) {
          setAiPreview({ type: 'German Listing Translation', content: data.data.translated_text });
        } else {
          const raw = typeof data.error === 'string' ? data.error : data.error?.message || '';
          setAiError(res.status === 503 || raw.toLowerCase().includes('not configured') ? 'AI NOT CONFIGURED' : (raw || 'Failed to translate'));
        }
      } else {
        const res = await fetch('/api/ai/product-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productTitle: name || 'New Product',
            description,
            category,
            price,
            currency,
            targetCountry: 'Global',
            contentType: type,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          if (type === 'title' && data.data.title) {
            setName(data.data.title);
            setAiPreview({ type: 'Optimized Title', content: data.data.title });
          } else if (type === 'description' && data.data.description) {
            setDescription(data.data.description);
            setAiPreview({ type: 'Commercial Description', content: data.data.description });
          } else if (type === 'seo' && data.data.seo_keywords) {
            setAiPreview({ type: 'SEO Keywords', content: data.data.seo_keywords.join(', ') });
          } else if (type === 'tags' && data.data.tags) {
            setAiPreview({ type: 'Catalog Tags', content: data.data.tags.join(', ') });
          } else if (type === 'specifications' && data.data.specifications) {
            const specText = data.data.specifications.map((s: any) => `${s.label}: ${s.value}`).join('\n');
            setAiPreview({ type: 'Technical Specifications', content: specText });
          }
        } else {
          const raw = typeof data.error === 'string' ? data.error : data.error?.message || '';
          setAiError(res.status === 503 || raw.toLowerCase().includes('not configured') ? 'AI NOT CONFIGURED' : (raw || 'Failed to generate content'));
        }
      }
    } catch (err: any) {
      console.error('AI Generation error:', err);
      const raw = err.message || '';
      setAiError(raw.toLowerCase().includes('not configured') ? 'AI NOT CONFIGURED' : (raw || 'AI service error'));
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplyAIPreview = () => {
    if (!aiPreview) return;
    if (aiPreview.type.includes('Title')) {
      setName(aiPreview.content);
    } else if (aiPreview.type.includes('Description')) {
      setDescription(aiPreview.content);
    } else if (aiPreview.type.includes('Specifications')) {
      setDescription((prev) => `${prev}\n\nSpecifications:\n${aiPreview.content}`);
    }
    setAiPreview(null);
  };

  // Stock Adjustment & Movement Modal State
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [stockMovements, setStockMovements] = useState<InventoryMovement[]>([]);
  const [movementType, setMovementType] = useState<'received' | 'allocated' | 'damaged' | 'recounted'>('received');
  const [quantityDelta, setQuantityDelta] = useState<number>(10);
  const [movementNotes, setMovementNotes] = useState('');
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  const openStockModal = async (p: Product) => {
    setStockModalProduct(p);
    setQuantityDelta(10);
    setMovementType('received');
    setMovementNotes('');
    if (currentBusiness) {
      try {
        const moves = await fetchInventoryMovements(currentBusiness.id, p.id);
        setStockMovements(moves);
      } catch (err) {
        console.error('Failed to fetch movements:', err);
      }
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !stockModalProduct) return;
    setIsAdjustingStock(true);
    try {
      const delta = movementType === 'allocated' || movementType === 'damaged' 
        ? -Math.abs(quantityDelta) 
        : Math.abs(quantityDelta);
      const newStock = Math.max(0, (stockModalProduct.stock_quantity || 0) + delta);

      // Record movement
      await recordInventoryMovement({
        business_id: currentBusiness.id,
        product_id: stockModalProduct.id,
        movement_type: movementType,
        quantity: delta,
        quantity_change: delta,
        notes: movementNotes || `${movementType.toUpperCase()} adjustment via Inventory Manager`,
        reason: movementNotes || `${movementType.toUpperCase()} adjustment via Inventory Manager`,
      });

      // Update product stock
      await updateProduct(stockModalProduct.id, {
        stock_quantity: newStock,
      });

      // Refresh list
      await loadProducts();
      setStockModalProduct({ ...stockModalProduct, stock_quantity: newStock });
      const updatedMoves = await fetchInventoryMovements(currentBusiness.id, stockModalProduct.id);
      setStockMovements(updatedMoves);
      setStockNotice({ type: 'success', message: `Stock updated! New balance for ${stockModalProduct.name}: ${newStock} units.` });
      setTimeout(() => setStockNotice(null), 4000);
    } catch (err: any) {
      setStockNotice({ type: 'error', message: `Stock adjustment failed: ${err.message}` });
      setTimeout(() => setStockNotice(null), 5000);
    } finally {
      setIsAdjustingStock(false);
    }
  };

  useEffect(() => {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setCountryOfOrigin(currentBusiness.country || 'India');
    setCurrency(currentBusiness.currency || 'USD');
    loadProducts();
  }, [currentBusiness]);

  const loadProducts = async () => {
    if (!currentBusiness) return;
    try {
      const data = await fetchBusinessProducts(currentBusiness.id);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SKU-${Date.now().toString().slice(-4)}`);
    setCategory('');
    setDescription('');
    setPrice('');
    setCurrency(currentBusiness?.currency || 'USD');
    setMoq(1);
    setStockQuantity(100);
    setWeight('');
    setDimensions('');
    setMaterial('');
    setCountryOfOrigin(currentBusiness?.country || 'India');
    setHsCode('');
    setShippingNotes('FOB / CIF seaworthy wooden crates');
    setPaymentTerms(currentBusiness?.business_type === 'Exporter' ? '30% Advance, 70% against B/L' : 'Net 30');
    setImageUrl('');
    setUploadedFiles([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku || '');
    setCategory(p.category);
    setDescription(p.description);
    setPrice(p.price);
    setCurrency(p.currency);
    setMoq(p.moq);
    setStockQuantity(p.stock_quantity || 0);
    setWeight(p.weight || '');
    setDimensions(p.dimensions || '');
    setMaterial(p.material || '');
    setCountryOfOrigin(p.country_of_origin || '');
    setHsCode(p.hs_code || '');
    setShippingNotes(p.shipping_notes || '');
    setPaymentTerms(p.payment_terms || '');
    setImageUrl(p.images?.[0] || '');
    setUploadedFiles([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    setFormError(null);
    try {
      const url = await uploadProductImage(file);
      setImageUrl(url);
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    if (!name.trim() || !sku.trim() || !category.trim() || price === '') {
      setFormError('Name, SKU, Category, and Unit Price are required.');
      return;
    }

    setFormError(null);
    setLoading(true);

    try {
      const images = imageUrl ? [imageUrl] : [];
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: name.trim(),
          sku: sku.trim(),
          category: category.trim(),
          description: description.trim(),
          price: Number(price),
          currency,
          moq: Number(moq) || 1,
          stock_quantity: Number(stockQuantity) || 0,
          weight: weight !== '' ? Number(weight) : undefined,
          dimensions: dimensions.trim() || undefined,
          material: material.trim() || undefined,
          country_of_origin: countryOfOrigin.trim() || undefined,
          hs_code: hsCode.trim() || undefined,
          shipping_notes: shippingNotes.trim() || undefined,
          payment_terms: paymentTerms.trim() || undefined,
          images,
        });
      } else {
        await createProduct(
          {
            business_id: currentBusiness.id,
            name: name.trim(),
            sku: sku.trim(),
            category: category.trim(),
            description: description.trim(),
            price: Number(price),
            currency,
            moq: Number(moq) || 1,
            stock_quantity: Number(stockQuantity) || 0,
            weight: weight !== '' ? Number(weight) : undefined,
            dimensions: dimensions.trim() || undefined,
            material: material.trim() || undefined,
            country_of_origin: countryOfOrigin.trim() || undefined,
            hs_code: hsCode.trim() || undefined,
            shipping_notes: shippingNotes.trim() || undefined,
            payment_terms: paymentTerms.trim() || undefined,
            images,
          },
          images
        );
      }

      await loadProducts();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="products-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product Catalog & Inventories</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your items, technical specs, export packaging, pricing tiers, and generate instant AI sales strategies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (products.length > 0) {
                setPdfModalProduct(products[0]);
              }
            }}
            disabled={products.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition disabled:opacity-50"
            title="Generate export datasheet PDF"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Make Product PDF
          </button>

          <button
            type="button"
            onClick={() => setIsCatalogBuilderOpen(true)}
            disabled={products.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition disabled:opacity-50"
            title="Generate multi-page PDF catalog"
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            Catalog Builder
          </button>

          <button
            id="btn-add-product"
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="products-search-input"
            type="text"
            placeholder="Search products by title, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            id="products-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No products found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {products.length === 0
              ? 'Add your first product to generate automated buyer outreach and issue quotations.'
              : 'No products match your current search or category filter.'}
          </p>
          {products.length === 0 && (
            <button
              id="btn-add-first-product"
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
            >
              Create First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const hasImage = p.images && p.images.length > 0;
            return (
              <div
                key={p.id}
                id={`product-card-${p.id}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  {/* Image Banner */}
                  <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {hasImage ? (
                      <img
                        src={p.images![0]}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center">
                        <Package className="w-8 h-8 mb-1" />
                        <span className="text-[11px]">No Photo Uploaded</span>
                      </div>
                    )}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono rounded font-medium">
                      {p.sku}
                    </span>
                    {p.is_demo && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded">
                        DEMO
                      </span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {p.category}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {p.price.toLocaleString()} {p.currency}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>

                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400">MOQ: </span>
                        <span className="font-semibold text-slate-700">{p.moq} units</span>
                      </div>
                      <div>
                        <span className="text-slate-400">In Stock: </span>
                        <span className="font-semibold text-slate-700">{p.stock_quantity}</span>
                      </div>
                      {p.hs_code && (
                        <div>
                          <span className="text-slate-400">HS Code: </span>
                          <span className="font-mono text-slate-700">{p.hs_code}</span>
                        </div>
                      )}
                      {p.country_of_origin && (
                        <div>
                          <span className="text-slate-400">Origin: </span>
                          <span className="text-slate-700">{p.country_of_origin}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-product-ai-${p.id}`}
                      type="button"
                      onClick={() => onSelectProductForAI && onSelectProductForAI(p)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Strategy
                    </button>
                    <button
                      id={`btn-product-stock-${p.id}`}
                      type="button"
                      onClick={() => openStockModal(p)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                      title="Adjust Inventory & View Movements"
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      Stock
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPdfModalProduct(p)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-white"
                      title="Make Product PDF Datasheet"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-edit-product-${p.id}`}
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-white"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-delete-product-${p.id}`}
                      type="button"
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-white"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add or Edit Product */}
      {isModalOpen && (
        <div id="product-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">
                  {editingProduct ? 'Edit Product Specifications' : 'Add New Product to Catalog'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                  <input
                    id="modal-product-name"
                    type="text"
                    required
                    placeholder="e.g. Makrana Pure White Marble Slabs"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Item Code *</label>
                  <input
                    id="modal-product-sku"
                    type="text"
                    required
                    placeholder="e.g. MKR-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <input
                    id="modal-product-category"
                    type="text"
                    required
                    placeholder="e.g. Architectural Stone"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price *</label>
                  <input
                    id="modal-product-price"
                    type="number"
                    step="0.01"
                    required
                    placeholder="145.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
                  <select
                    id="modal-product-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Description & Specifications</label>
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> VYRA AI Product Intelligence
                  </span>
                </div>
                <textarea
                  id="modal-product-description"
                  rows={3}
                  placeholder="Quarry source, finish grade, grain characteristics, quality inspection standards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />

                {/* AI Content Generation Buttons Suite */}
                <div className="mt-2 p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> AI Merchandising Actions:
                    </span>
                    {aiGenerating && (
                      <span className="text-[11px] text-blue-700 font-medium animate-pulse">Generating content from product specs...</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleGenerateAI('title')}
                      disabled={aiGenerating}
                      className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[11px] font-semibold transition"
                    >
                      Generate Title
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateAI('description')}
                      disabled={aiGenerating}
                      className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[11px] font-semibold transition"
                    >
                      Generate Description
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateAI('seo')}
                      disabled={aiGenerating}
                      className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[11px] font-semibold transition"
                    >
                      Generate SEO Keywords
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateAI('tags')}
                      disabled={aiGenerating}
                      className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[11px] font-semibold transition"
                    >
                      Generate Tags
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateAI('specifications')}
                      disabled={aiGenerating}
                      className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[11px] font-semibold transition"
                    >
                      Generate Specifications
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateAI('translate')}
                      disabled={aiGenerating}
                      className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[11px] font-semibold transition"
                    >
                      Translate Listing
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateAI('buyer_message')}
                      disabled={aiGenerating}
                      className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[11px] font-semibold transition"
                    >
                      Generate Buyer Message
                    </button>
                  </div>

                  {aiError && (
                    <div className="mt-2 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between">
                      <span className="font-semibold">{aiError}</span>
                      <button type="button" onClick={() => setAiError(null)} className="text-red-500 hover:text-red-700 text-xs ml-2">✕</button>
                    </div>
                  )}

                  {aiPreview && (
                    <div className="mt-2 p-3 bg-white border border-blue-200 rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-800 border-b pb-1">
                        <span>{aiPreview.type}:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleApplyAIPreview}
                            className="px-2 py-0.5 bg-blue-600 text-white rounded text-[11px] font-bold hover:bg-blue-700"
                          >
                            Apply to Product
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiPreview(null)}
                            className="text-slate-400 hover:text-slate-600 text-[11px]"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap max-h-36 overflow-y-auto font-mono text-[11px]">
                        {aiPreview.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MOQ</label>
                  <input
                    id="modal-product-moq"
                    type="number"
                    placeholder="1"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Available</label>
                  <input
                    id="modal-product-stock"
                    type="number"
                    placeholder="500"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg/sqm)</label>
                  <input
                    id="modal-product-weight"
                    type="number"
                    placeholder="45"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dimensions</label>
                  <input
                    id="modal-product-dimensions"
                    type="text"
                    placeholder="280x160x2cm"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Material Composition</label>
                  <input
                    id="modal-product-material"
                    type="text"
                    placeholder="e.g. Natural White Marble"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Country of Origin</label>
                  <input
                    id="modal-product-origin"
                    type="text"
                    placeholder="India"
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">HS Code</label>
                  <input
                    id="modal-product-hscode"
                    type="text"
                    placeholder="68022190"
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shipping & Packaging Notes</label>
                  <input
                    id="modal-product-shipping"
                    type="text"
                    placeholder="Seaworthy wooden crating with foam buffer"
                    value={shippingNotes}
                    onChange={(e) => setShippingNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms</label>
                  <input
                    id="modal-product-payment"
                    type="text"
                    placeholder="30% Advance, 70% against B/L"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Photo</label>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex-1">
                    <label
                      htmlFor="product-image-upload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 transition bg-slate-50"
                    >
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-600">
                        {isUploading ? 'Uploading file...' : 'Click to select image or drag & drop'}
                      </span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WEBP up to 5MB</span>
                      <input
                        id="product-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="modal-btn-submit"
                  type="submit"
                  disabled={loading || isUploading}
                  className="px-6 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inventory Stock Adjustment & Movements */}
      {stockModalProduct && (
        <div id="stock-adjustment-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm">Inventory Adjustment: {stockModalProduct.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">SKU: {stockModalProduct.sku} | Current Stock: {stockModalProduct.stock_quantity} units</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStockModalProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="p-6 space-y-4">
              {stockNotice && (
                <div className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
                  stockNotice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {stockNotice.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <span className="font-semibold">{stockNotice.message}</span>
                  </div>
                  <button type="button" onClick={() => setStockNotice(null)} className="ml-2 font-bold text-slate-500 hover:text-slate-800">✕</button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Reason / Type</label>
                  <select
                    value={movementType}
                    onChange={(e: any) => setMovementType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="received">Received (Factory Batch / Restock)</option>
                    <option value="allocated">Allocated (Reserved for Order / Shipment)</option>
                    <option value="damaged">Damaged / Scrap / QC Rejection</option>
                    <option value="recounted">Recounted / Audit Discrepancy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Units Count {movementType === 'allocated' || movementType === 'damaged' ? '(Deduction)' : '(Addition)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantityDelta}
                    onChange={(e) => setQuantityDelta(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Movement Notes & Audit Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Quarry block #104 finished, dispatched container MSX-882, QC pass"
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isAdjustingStock}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isAdjustingStock ? 'Recording...' : 'Commit Movement & Update Stock'}
                </button>
              </div>
            </form>

            {/* Movement History Log */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Recorded Inventory Movements</span>
              </div>
              {stockMovements.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No historical stock movements logged yet.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
                  {stockMovements.map((m) => {
                    const qty = m.quantity ?? m.quantity_change ?? 0;
                    return (
                      <div key={m.id} className="p-3 text-xs flex items-center justify-between">
                        <div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 uppercase ${
                            m.movement_type === 'received' || m.movement_type === 'stock_in' ? 'bg-emerald-100 text-emerald-800' :
                            m.movement_type === 'allocated' || m.movement_type === 'reserved' ? 'bg-blue-100 text-blue-800' :
                            m.movement_type === 'damaged' || m.movement_type === 'stock_out' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {m.movement_type}
                          </span>
                          <span className="text-slate-600">{m.notes || m.reason || 'No description'}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-bold ${qty >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {qty > 0 ? `+${qty}` : qty} units
                          </span>
                          <div className="text-[10px] text-slate-400">{new Date(m.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
