import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { uploadMediaAsset, StorageBucket, MediaAsset, validateMediaFile } from '../../lib/storage';

interface ImageUploaderProps {
  bucket: StorageBucket;
  businessId: string;
  initialUrl?: string;
  onUploadSuccess: (asset: MediaAsset) => void;
  onRemove?: () => void;
  label?: string;
  helperText?: string;
  maxSizeMb?: number;
  acceptedTypes?: string[];
  className?: string;
  allowAltText?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  bucket,
  businessId,
  initialUrl,
  onUploadSuccess,
  onRemove,
  label = 'Upload Media Asset',
  helperText = 'PNG, JPG, WEBP, or SVG up to 10MB',
  maxSizeMb = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  className = '',
  allowAltText = true,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = validateMediaFile(file, maxSizeMb * 1024 * 1024, acceptedTypes);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);
    setProgress(15);

    try {
      const asset = await uploadMediaAsset({
        file,
        bucket,
        businessId,
        altText: altText || file.name.replace(/\.[^/.]+$/, ''),
        caption,
        onProgress: (p) => setProgress(p),
      });

      setPreviewUrl(asset.public_url);
      setSuccessMessage('Media asset uploaded and indexed securely.');
      onUploadSuccess(asset);
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemove?.();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</label>
          <span className="text-[10px] text-slate-400 font-mono">Bucket: {bucket}</span>
        </div>
      )}

      {/* Upload Drop Zone / Preview */}
      {previewUrl ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 p-2">
          <div className="relative h-48 w-full rounded-xl overflow-hidden flex items-center justify-center bg-slate-900">
            <img
              src={previewUrl}
              alt={altText || 'Uploaded preview'}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Action Overlay */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs backdrop-blur-md transition shadow-md"
              title="Replace Media"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs backdrop-blur-md transition shadow-md"
              title="Remove Media"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {allowAltText && (
            <div className="mt-2.5 px-2 pb-1 space-y-2">
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="SEO Alt Text (e.g. Italian Carrara White Marble Slab)"
                className="w-full text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50/30 dark:hover:bg-slate-900'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 shadow-xs">
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            {isUploading ? 'Securing & Indexing Asset...' : 'Click to browse or drag & drop'}
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs">{helperText}</p>

          {isUploading && (
            <div className="w-48 mt-3 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};
