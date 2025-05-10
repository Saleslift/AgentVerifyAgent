import React from 'react';
import { Image as ImageIcon, Video } from 'lucide-react';

interface MediaUploaderProps {
  images: string[];
  videos: string[];
  onImagesChange: (images: string[]) => void;
  onVideosChange: (videos: string[]) => void;
}

export default function MediaUploader({
  images,
  videos,
  onImagesChange,
  onVideosChange,
}: MediaUploaderProps) {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
    onImagesChange([...images, ...newImages]);
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const newVideos = Array.from(files).map((file) => URL.createObjectURL(file));
    onVideosChange([...videos, ...newVideos]);
  };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Media</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images
          </label>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
          <div className="mt-2 grid grid-cols-3 gap-2">
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Uploaded ${index}`}
                className="w-full h-auto rounded-lg"
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Videos
          </label>
          <input type="file" accept="video/*" multiple onChange={handleVideoUpload} />
          <div className="mt-2 grid grid-cols-3 gap-2">
            {videos.map((video, index) => (
              <video
                key={index}
                src={video}
                controls
                className="w-full h-auto rounded-lg"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
