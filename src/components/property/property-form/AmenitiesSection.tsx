import React from 'react';

interface AmenitiesSectionProps {
  amenitiesList: string[];
  selectedAmenities: string[];
  onAmenitiesChange: (updatedAmenities: string[]) => void;
}

export default function AmenitiesSection({
  amenitiesList,
  selectedAmenities,
  onAmenitiesChange,
}: AmenitiesSectionProps) {
  const handleAmenityToggle = (amenity: string, isChecked: boolean) => {
    const updatedAmenities = isChecked
      ? [...selectedAmenities, amenity]
      : selectedAmenities.filter((a) => a !== amenity);
    onAmenitiesChange(updatedAmenities);
  };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Amenities</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {amenitiesList.map((amenity) => (
          <label key={amenity} className="flex items-center space-x-3 group cursor-pointer">
            <input
              type="checkbox"
              checked={selectedAmenities.includes(amenity)}
              onChange={(e) => handleAmenityToggle(amenity, e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-300 focus:ring-primary-300 transition-colors duration-200"
            />
            <span className="text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
              {amenity}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
