import React from 'react';

interface ThumbnailNavigationProps {
  images: string[];
  activeIndex: number;
  onThumbnailClick: (index: number) => void;
}

const ThumbnailNavigation: React.FC<ThumbnailNavigationProps> = ({
  images,
  activeIndex,
  onThumbnailClick,
}) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
      <div className="flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => onThumbnailClick(index)}
            className={`w-2 h-2 rounded-full ${
              index === activeIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ThumbnailNavigation;
