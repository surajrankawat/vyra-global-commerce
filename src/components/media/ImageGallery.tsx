import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Image as ImageIcon } from 'lucide-react';
import { MediaFallback } from './MediaFallback';

interface ImageGalleryProps {
  images?: string[];
  category?: string;
  title?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'wide';
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images = [],
  category = 'General',
  title = '',
  className = '',
  aspectRatio = 'video',
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const cleanImages = (images || []).filter(Boolean);

  if (cleanImages.length === 0) {
    return <MediaFallback category={category} title={title} className={className} size="lg" />;
  }

  const activeImage = cleanImages[selectedIndex] || cleanImages[0];

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'h-72 sm:h-96 w-full',
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Feature View */}
      <div
        className={`relative ${aspectClasses[aspectRatio]} bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center group`}
      >
        <img
          src={activeImage}
          alt={`${title} - view ${selectedIndex + 1}`}
          className="w-full h-full object-contain"
        />

        {/* Lightbox Trigger */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black text-white opacity-0 group-hover:opacity-100 backdrop-blur-xs transition shadow-md"
          title="Fullscreen View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Prev / Next Arrows */}
        {cleanImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : cleanImages.length - 1))
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/60 hover:bg-black text-white opacity-0 group-hover:opacity-100 backdrop-blur-xs transition shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((prev) => (prev < cleanImages.length - 1 ? prev + 1 : 0))
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/60 hover:bg-black text-white opacity-0 group-hover:opacity-100 backdrop-blur-xs transition shadow-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Index counter */}
        {cleanImages.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white">
            {selectedIndex + 1} / {cleanImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {cleanImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {cleanImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 bg-slate-900 transition ${
                selectedIndex === idx
                  ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeImage}
              alt={title}
              className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {title && (
              <p className="mt-3 text-xs text-slate-300 font-medium tracking-wide">{title}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
