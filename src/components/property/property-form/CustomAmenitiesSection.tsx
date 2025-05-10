import React from 'react';
import { Plus, X } from 'lucide-react';

interface CustomAmenitiesSectionProps {
  customAmenity: string;
  customAmenities: string[];
  onCustomAmenityChange: (value: string) => void;
  onAddCustomAmenity: () => void;
  onRemoveCustomAmenity: (amenity: string) => void;
}

export default function CustomAmenitiesSection({
  customAmenity,
  customAmenities,
  onCustomAmenityChange,
  onAddCustomAmenity,
  onRemoveCustomAmenity,
}: CustomAmenitiesSectionProps) {
  return (
    <section className="mt-6">
      <h3 className="text-md font-medium mb-3">Custom Amenities</h3>

      {/* Custom amenity input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={customAmenity}
          onChange={(e) => onCustomAmenityChange(e.target.value)}
          placeholder="Add custom amenity"
          className="flex-1 px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
        />
        <button
          type="button"
          onClick={onAddCustomAmenity}
          disabled={!customAmenity.trim()}
          className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </button>
      </div>

      {/* Custom amenity tags */}
      {customAmenities.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {customAmenities.map((amenity) => (
            <div
              key={amenity}
              className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full"
            >
              <span className="text-sm">{amenity}</span>
              <button
                type="button"
                onClick={() => onRemoveCustomAmenity(amenity)}
                className="ml-2 text-gray-500 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
