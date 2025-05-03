import React from 'react';
import { Upload } from 'lucide-react';

interface ProfileImageUploadProps {
  imagePreview: string | null;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({ imagePreview, onUpload }) => {
  return (
    <div className="flex items-center space-x-6">
      <div className="relative">
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover"
          />
        ) : (
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={onUpload}
            className="hidden"
          />
          <Upload className="h-5 w-5 text-gray-600" />
        </label>
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600 mb-2">
          Upload a professional profile photo.
        </p>
        <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
          <li>Maximum file size: 2MB</li>
          <li>Recommended dimensions: 400x400 pixels</li>
          <li>Accepted formats: JPG, PNG, WebP</li>
        </ul>
      </div>
    </div>
  );
};

export default ProfileImageUpload;
