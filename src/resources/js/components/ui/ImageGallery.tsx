import { useState, useEffect, useCallback } from 'react';

interface ImageItem {
  id: number;
  src: string;
}

interface ImageGalleryProps {
  images: ImageItem[];
  alt?: string;
  /** Height class for the hero image (default: "max-h-[500px]") */
  heroMaxH?: string;
  /** Size class for thumbnails (default: "w-20 h-20") */
  thumbSize?: string;
  /** Optional overlay content rendered on the hero image */
  heroOverlay?: React.ReactNode;
}

function Lightbox({
  images,
  currentIndex,
  onClose,
  onChangeIndex,
}: {
  images: ImageItem[];
  currentIndex: number;
  onClose: () => void;
  onChangeIndex: (i: number) => void;
}) {
  const goPrev = useCallback(() => {
    onChangeIndex((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onChangeIndex]);

  const goNext = useCallback(() => {
    onChangeIndex((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onChangeIndex]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose, goPrev, goNext]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black" onClick={onClose} />

      {/* Image */}
      <img
        src={images[currentIndex].src}
        alt=""
        className="relative z-10 max-w-[90vw] max-h-[85vh] object-contain select-none"
      />

      {/* Close button - top right */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Nav arrows (only if multiple images) */}
      {images.length > 1 && (
        <>
          {/* Left arrow */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right arrow */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Counter */}
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-white text-sm bg-black/60 px-3 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </span>
        </>
      )}
    </div>
  );
}

export default function ImageGallery({
  images,
  alt = '',
  heroMaxH = 'max-h-[500px]',
  thumbSize = 'w-20 h-20',
  heroOverlay,
}: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      {/* Hero (first image) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="block w-full overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
        >
          <img
            src={images[0].src}
            alt={alt}
            className={`w-full h-auto object-contain ${heroMaxH}`}
          />
        </button>
        {heroOverlay}
      </div>

      {/* Thumbnails (2nd image onward) */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mt-2">
          {images.slice(1).map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightboxIndex(i + 1)}
              className={`shrink-0 ${thumbSize} overflow-hidden rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer`}
            >
              <img
                src={img.src}
                alt={alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      )}
    </>
  );
}
