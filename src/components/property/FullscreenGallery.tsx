import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface FullscreenGalleryProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

const FullscreenGallery: React.FC<FullscreenGalleryProps> = ({
  images,
  initialIndex,
  onClose,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(initialIndex);

  const handlePrevImage = () => {
    setActiveImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20"
        >
          <X className="h-6 w-6 text-white" />
        </button>
      </div>

      <div className="h-full flex items-center justify-center">
        <img
          src={images[activeImageIndex]}
          alt={`Image ${activeImageIndex + 1}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveImageIndex(index)}
              className={`w-2 h-2 rounded-full ${
                index === activeImageIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handlePrevImage}
        className="absolute top-1/2 left-4 -translate-y-1/2 p-2 bg-white/10 rounded-full hover:bg-white/20"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        onClick={handleNextImage}
        className="absolute top-1/2 right-4 -translate-y-1/2 p-2 bg-white/10 rounded-full hover:bg-white/20"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>
    </div>
  );
};

export default FullscreenGallery;
