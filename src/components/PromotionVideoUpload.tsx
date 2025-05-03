import React from 'react';
import { Upload, Trash2 } from 'lucide-react';

interface PromotionVideoUploadProps {
  videoPreview: string | null;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

const PromotionVideoUpload: React.FC<PromotionVideoUploadProps> = ({ videoPreview, onUpload, onRemove }) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-6">
        <div className="relative">
          {videoPreview ? (
            <video
              src={videoPreview}
              controls
              className="w-32 h-32 rounded-lg object-cover"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer">
            <input
              type="file"
              accept=".mp4,.webm"
              onChange={onUpload}
              className="hidden"
            />
            <Upload className="h-5 w-5 text-gray-600" />
          </label>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">
            Upload a short promotion video.
          </p>
          <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
            <li>Maximum file size: 50MB</li>
            <li>Accepted formats: MP4, WebM</li>
          </ul>
        </div>
      </div>
      {videoPreview && (
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onRemove}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PromotionVideoUpload;
