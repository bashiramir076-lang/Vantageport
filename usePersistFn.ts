import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, isOpen, onClose }: ImageLightboxProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all"
          aria-label="إغلاق"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Zoom Toggle Button */}
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute top-4 left-4 z-10 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all"
          aria-label="تكبير/تصغير"
        >
          <ZoomIn className="w-6 h-6" />
        </button>

        {/* Image Container */}
        <div className={`overflow-auto flex items-center justify-center ${isZoomed ? "max-h-[90vh] max-w-5xl" : "max-h-[80vh]"}`}>
          <img
            src={src}
            alt={alt}
            className={`max-w-full h-auto rounded-lg shadow-2xl transition-transform duration-500 ease-in-out ${
              isZoomed ? "scale-125 cursor-zoom-out" : "cursor-zoom-in"
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
            onError={(e) => {
              console.error("Image error:", e);
              const target = e.target as HTMLImageElement;
              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23222' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23666' font-family='sans-serif'%3Eتعذر تحميل الصورة%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>

        {/* Image Info */}
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg text-sm text-center">
          {alt}
        </div>
      </div>
    </div>
  );
}
