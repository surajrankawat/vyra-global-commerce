import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  Eye,
  ExternalLink,
  Plus,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import {
  MediaAsset,
  StorageBucket,
  getLocalMediaAssets,
  deleteLocalMediaAsset,
} from '../../lib/storage';
import { ImageUploader } from './ImageUploader';

interface MediaLibraryProps {
  businessId: string;
  onSelectAsset?: (asset: MediaAsset) => void;
  allowedBuckets?: StorageBucket[];
  className?: string;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  businessId,
  onSelectAsset,
  allowedBuckets,
  className = '',
}) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);

  const loadAssets = () => {
    const list = getLocalMediaAssets(businessId);
    setAssets(list);
  };

  useEffect(() => {
    loadAssets();
  }, [businessId]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteLocalMediaAsset(id);
    loadAssets();
  };

  const handleCopyUrl = (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesQuery =
      asset.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.alt_text && asset.alt_text.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesBucket = selectedBucket === 'all' || asset.bucket === selectedBucket;
    return matchesQuery && matchesBucket;
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search media assets, alt text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedBucket}
            onChange={(e) => setSelectedBucket(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Buckets</option>
            <option value="product-images">product-images</option>
            <option value="business-logos">business-logos</option>
            <option value="business-banners">business-banners</option>
            <option value="ad-creatives">ad-creatives</option>
            <option value="store-assets">store-assets</option>
            <option value="documents">documents</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAssets}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Refresh Media List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New</span>
          </button>
        </div>
      </div>

      {/* Expandable Upload Panel */}
      {isUploadOpen && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-md">
          <ImageUploader
            bucket={(selectedBucket !== 'all' ? selectedBucket : 'product-images') as StorageBucket}
            businessId={businessId}
            onUploadSuccess={(asset) => {
              loadAssets();
              setIsUploadOpen(false);
            }}
          />
        </div>
      )}

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <HardDrive className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            No media assets found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Upload images, banners, or technical attachments to store them in your secure tenant
            storage buckets.
          </p>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20"
          >
            Upload First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => onSelectAsset?.(asset)}
              className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl overflow-hidden p-2 flex flex-col transition duration-200 cursor-pointer shadow-xs hover:shadow-md ${
                onSelectAsset ? 'ring-2 ring-transparent hover:ring-blue-500' : ''
              }`}
            >
              {/* Thumbnail Display */}
              <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center relative">
                {asset.file_type.startsWith('image/') ? (
                  <img
                    src={asset.public_url}
                    alt={asset.alt_text || asset.file_name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center p-3 text-white">
                    <FolderOpen className="w-8 h-8 mx-auto text-blue-400 mb-1" />
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      {asset.file_name.split('.').pop()}
                    </span>
                  </div>
                )}

                {/* Hover Action Bar */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-xs flex items-center justify-center gap-1.5 transition-opacity duration-150">
                  <button
                    type="button"
                    onClick={(e) => handleCopyUrl(asset.public_url, asset.id, e)}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-black transition"
                    title="Copy Public URL"
                  >
                    {copiedId === asset.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewAsset(asset);
                    }}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-black transition"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(asset.id, e)}
                    className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Asset Info */}
              <div className="mt-2 px-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {asset.file_name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                  <span className="truncate">{asset.bucket}</span>
                  <span>{(asset.file_size_bytes / 1024).toFixed(0)} KB</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Detail Preview Modal */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 text-white space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold truncate pr-4">{previewAsset.file_name}</h3>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="h-72 w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              <img
                src={previewAsset.public_url}
                alt={previewAsset.alt_text}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500">Storage Bucket:</span> {previewAsset.bucket}
              </div>
              <div>
                <span className="text-slate-500">File Size:</span>{' '}
                {(previewAsset.file_size_bytes / 1024).toFixed(1)} KB
              </div>
              <div>
                <span className="text-slate-500">Alt Text:</span>{' '}
                {previewAsset.alt_text || 'Not configured'}
              </div>
              <div>
                <span className="text-slate-500">Uploaded:</span>{' '}
                {new Date(previewAsset.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <a
                href={previewAsset.public_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open URL</span>
              </a>
              {onSelectAsset && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectAsset(previewAsset);
                    setPreviewAsset(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20"
                >
                  Select for Use
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
