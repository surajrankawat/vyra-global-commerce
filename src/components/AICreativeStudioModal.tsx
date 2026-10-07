import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Image as ImageIcon,
  Palette,
  Layers,
  CheckCircle2,
  AlertCircle,
  Download,
  UploadCloud,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MediaAsset, saveLocalMediaAsset } from '../lib/storage';

interface AICreativeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (url: string) => void;
  initialType?: string;
  initialCategory?: string;
}

export const AICreativeStudioModal: React.FC<AICreativeStudioModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  initialType = 'marketplace-banner',
  initialCategory = 'Commerce',
}) => {
  const { currentBusiness } = useAuth();
  const [creativeType, setCreativeType] = useState(initialType);
  const [prompt, setPrompt] = useState('');
  const [dimensions, setDimensions] = useState<'landscape' | 'square' | 'portrait'>('landscape');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    imageUrl?: string;
    configured: boolean;
    message?: string;
    metadata?: any;
  } | null>(null);

  if (!isOpen) return null;

  const creativeTypes = [
    { id: 'marketplace-banner', label: 'Marketplace Banner' },
    { id: 'product-background', label: 'Product Background' },
    { id: 'ad-creative', label: 'Ad Creative' },
    { id: 'social-creative', label: 'Social Media Post' },
    { id: 'website-hero', label: 'Website Hero Concept' },
    { id: 'product-lifestyle', label: 'Product Lifestyle Concept' },
    { id: 'promotional-banner', label: 'Promotional Banner' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/creative-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creativeType,
          prompt,
          businessName: currentBusiness?.name || 'VYRA Partner',
          category: currentBusiness?.industry || initialCategory,
          targetDimensions: dimensions,
        }),
      });

      const data = await res.json();
      if (data.configured && data.data?.imageUrl) {
        setResult({
          imageUrl: data.data.imageUrl,
          configured: true,
          metadata: data.data.metadata,
        });

        // Save generated asset to local media cache
        if (currentBusiness) {
          const newAsset: MediaAsset = {
            id: `ai-gen-${Date.now()}`,
            business_id: currentBusiness.id,
            bucket: 'ad-creatives',
            file_name: `AI_${creativeType}_${Date.now()}.jpg`,
            file_path: `${currentBusiness.id}/ai-gen/${Date.now()}.jpg`,
            public_url: data.data.imageUrl,
            file_type: 'image/jpeg',
            file_size_bytes: 250000,
            alt_text: prompt,
            caption: `AI Generated: ${creativeType}`,
            created_at: new Date().toISOString(),
          };
          saveLocalMediaAsset(newAsset);
        }
      } else {
        setResult({
          configured: false,
          message: data.message || 'AI image generation is not configured.',
        });
      }
    } catch (err: any) {
      setResult({
        configured: false,
        message: err.message || 'Error processing creative request',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                VYRA AI Creative Studio
              </h2>
              <p className="text-[11px] text-slate-400">
                Generate high-converting commercial media assets & concepts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Asset Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {creativeTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCreativeType(t.id)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    creativeType === t.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Aspect Ratio
            </label>
            <div className="flex gap-2">
              {[
                { id: 'landscape', label: '16:9 Landscape' },
                { id: 'square', label: '1:1 Square' },
                { id: 'portrait', label: '3:4 Portrait' },
              ].map((dim) => (
                <button
                  key={dim.id}
                  type="button"
                  onClick={() => setDimensions(dim.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    dimensions === dim.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {dim.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Creative Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Modern architectural villa foyer with pristine bookmatched Makrana white marble flooring and subtle ambient warm lighting..."
              rows={3}
              required
              className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Studio Creative...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Execute Creative Directive</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Panel */}
        {result && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-950/50">
            {result.configured && result.imageUrl ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Creative generated and saved to Media Library</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Model: {result.metadata?.model}</span>
                </div>

                <div className="h-56 w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src={result.imageUrl}
                    alt="Generated preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  {onSelectImage && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectImage(result.imageUrl!);
                        onClose();
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20"
                    >
                      Use in Project
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-4 space-y-2">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  AI NOT CONFIGURED
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                  {result.message ||
                    'Add GEMINI_API_KEY to server environment variables to enable autonomous AI image and asset generation.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
