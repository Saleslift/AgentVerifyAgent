import React, { useState } from 'react';
import { X, MoveUp, Image as ImageIcon, Video } from 'lucide-react';
import { uploadFileToSupabase } from '../../../utils/supabase';

interface MediaGalleryProps {
  media: string[];
  onMediaChange: (updatedMedia: string[]) => void;
  userId: string;
  type: 'image' | 'video';
  title: string;
  maxFileSizeMB: number;
  bucketName: string;
  maxFiles: number; // Maximum number of files allowed
}

export default function MediaGallery({
  media,
  onMediaChange,
  userId,
  type,
  title,
  maxFileSizeMB,
  bucketName,
  maxFiles = 1,
}: MediaGalleryProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMaxFilesExceeded = media?.length >= maxFiles;

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      setError(null);

      // Check if adding these files exceeds the maxFiles limit
      if (media.length + files.length > maxFiles) {
        throw new Error(`You can only upload up to ${maxFiles} ${type}s.`);
      }

      const uploadedUrls = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith(type)) {
          throw new Error(`Please upload only ${type} files`);
        }

        if (file.size > maxFileSizeMB * 1024 * 1024) {
          throw new Error(`${type.charAt(0).toUpperCase() + type.slice(1)} size should not exceed ${maxFileSizeMB}MB`);
        }

        const filePath = `${userId}/${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase()}`;
        const publicUrl = await uploadFileToSupabase({ file, filePath, bucketName });
        uploadedUrls.push(publicUrl);
      }

      // If maxFiles is 1, replace the existing file
      if (maxFiles === 1) {
        onMediaChange(uploadedUrls);
      } else {
        onMediaChange([...media, ...uploadedUrls]);
      }
    } catch (error) {
      console.error(`Error uploading ${type}s:`, error);
      setError(error instanceof Error ? error.message : `Failed to upload ${type}s`);
    }
  };

  const handleMediaDelete = (mediaUrl: string) => {
    // If maxFiles is 1, set media to an empty array
    if (maxFiles === 1) {
      onMediaChange([]);
    } else {
      onMediaChange(media.filter((url) => url !== mediaUrl));
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newMedia = [...media];
    const draggedItem = newMedia[draggedIndex];
    newMedia.splice(draggedIndex, 1);
    newMedia.splice(index, 0, draggedItem);

    onMediaChange(newMedia);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {maxFiles > 1 && (
          <div className="text-sm text-gray-500 flex items-center">
            <MoveUp className="h-4 w-4 mr-1" />
            Drag to reorder
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {media.map((item, index) => (
            <div
              key={index}
              draggable={maxFiles > 1}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative aspect-square cursor-${maxFiles > 1 ? 'move' : 'default'} ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              {type === 'image' ? (
                <img
                  src={item}
                  alt={`${title} ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <video
                  src={item}
                  className="w-full h-full object-cover rounded-lg"
                  controls
                />
              )}
              <button
                type="button"
                onClick={() => handleMediaDelete(item)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {!isMaxFilesExceeded && (
          <div className="flex items-center justify-center w-full">
            <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg tracking-wide uppercase border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
              {type === 'image' ? <ImageIcon className="w-8 h-8" /> : <Video className="w-8 h-8" />}
              <span className="mt-2 text-sm">Upload {type.charAt(0).toUpperCase() + type.slice(1)}s</span>
              <input
                type="file"
                className="hidden"
                accept={`${type}/*`}
                multiple={maxFiles > 1}
                onChange={handleMediaUpload}
              />
            </label>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <p className="text-sm text-gray-500 mt-2">
        {`You can upload up to ${maxFiles} ${type}${maxFiles > 1 ? 's' : ''}. Currently uploaded: ${media.length}.`}
      </p>
    </section>
  );
}
