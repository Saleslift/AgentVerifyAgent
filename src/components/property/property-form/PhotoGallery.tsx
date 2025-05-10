import React, { useState } from 'react';
import { X, Image as ImageIcon, MoveUp } from 'lucide-react';
import { uploadFileToSupabase } from '../../../utils/supabase';

interface PhotoGalleryProps {
  images: string[];
  onImagesChange: (updatedImages: string[]) => void;
  agentId: string;
}

export default function PhotoGallery({ images, onImagesChange, agentId }: PhotoGalleryProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      setError(null);
      const uploadedUrls = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          throw new Error('Please upload only image files');
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Image size should not exceed 5MB');
        }

        const filePath = `${agentId}/${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase()}`;
        const publicUrl = await uploadFileToSupabase({ file, filePath, bucketName: 'properties' });
        uploadedUrls.push(publicUrl);
      }

      onImagesChange([...images, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload images');
    }
  };

  const handleImageDelete = async (imageUrl: string) => {
    onImagesChange(images.filter((url) => url !== imageUrl));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    onImagesChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Photo Gallery *</h2>
        <div className="text-sm text-gray-500 flex items-center">
          <MoveUp className="h-4 w-4 mr-1" />
          Drag to reorder
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative aspect-square cursor-move ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <img
                src={image}
                alt={`Property ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleImageDelete(image)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center w-full">
          <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg tracking-wide uppercase border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
            <ImageIcon className="w-8 h-8" />
            <span className="mt-2 text-sm">Upload Images</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
            />
          </label>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </section>
  );
}
