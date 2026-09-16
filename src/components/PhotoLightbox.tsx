import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface PhotoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhoto: string;
  title: string;
  allPhotos?: string[];
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  isOpen,
  onClose,
  currentPhoto,
  title,
  allPhotos = [],
}) => {
  if (!isOpen) return null;

  const photosList = allPhotos.length > 0 ? allPhotos : [currentPhoto];
  const initialIndex = Math.max(0, photosList.indexOf(currentPhoto));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  const activePhoto = photosList[activeIndex] || currentPhoto;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : photosList.length - 1));
    setZoomLevel(1);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < photosList.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(3, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(1, prev - 0.5));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="max-w-xl truncate">
          <h3 className="font-bold text-sm sm:text-base text-white">{title}</h3>
          <span className="text-xs text-slate-400">
            Фото {activeIndex + 1} из {photosList.length} &bull; Высокое разрешение
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
            title="Уменьшить"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
            title="Увеличить"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Open full in new tab */}
          <a
            href={activePhoto}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Открыть оригинал в новой вкладке"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-rose-600 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-8">
        <img
          src={activePhoto}
          alt={title}
          style={{
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.2s ease-out',
            maxHeight: '85vh',
            maxWidth: '90vw',
            objectFit: 'contain',
          }}
          className="rounded-lg shadow-2xl select-none"
        />

        {/* Prev / Next Arrows */}
        {photosList.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {photosList.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 max-w-[90vw] overflow-x-auto">
          {photosList.map((url, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveIndex(idx);
                setZoomLevel(1);
              }}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                activeIndex === idx
                  ? 'border-amber-400 scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={url} alt={`Миниатюра ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
