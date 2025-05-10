import React from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import ThumbnailNavigation from './ThumbnailNavigation';

interface MainImageGalleryProps {
    images: string[];
    activeImageIndex: number;
    onSetActiveImageIndex: (index: number) => void;
    onShowGallery: () => void;
    onPrevImage: () => void;
    onNextImage: () => void;
}

const MainImageGallery: React.FC<MainImageGalleryProps> = ({
                                                               images,
                                                               activeImageIndex,
                                                               onSetActiveImageIndex,
                                                               onShowGallery,
                                                               onPrevImage,
                                                               onNextImage,
                                                           }) => {
    if (!images) {
        return null
    }
    return (
        <div className="relative mb-8">
            <div
                className="aspect-[16/9] overflow-hidden rounded-xl cursor-pointer bg-gray-100"
                onClick={onShowGallery}
            >
                <img
                    src={images[activeImageIndex]}
                    alt={`Image ${activeImageIndex + 1}`}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Thumbnail Navigation */}
            <ThumbnailNavigation
                images={images}
                activeIndex={activeImageIndex}
                onThumbnailClick={onSetActiveImageIndex}
            />

            {/* Navigation Arrows */}
            <button
                onClick={onPrevImage}
                className="absolute top-1/2 left-4 -translate-y-1/2 p-2 bg-white/10 rounded-full hover:bg-white/20"
            >
                <ChevronLeft className="h-6 w-6 text-white"/>
            </button>
            <button
                onClick={onNextImage}
                className="absolute top-1/2 right-4 -translate-y-1/2 p-2 bg-white/10 rounded-full hover:bg-white/20"
            >
                <ChevronRight className="h-6 w-6 text-white"/>
            </button>
        </div>
    );
};

export default MainImageGallery;
