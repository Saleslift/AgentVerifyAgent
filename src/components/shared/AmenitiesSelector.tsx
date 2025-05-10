import React from 'react';

interface AmenitiesSelectorProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
}

const amenitiesList = [
  'Balcony',
  'Pool',
  'Gym',
  'Parking',
  'Security',
  'Central A/C',
  'Built-in Wardrobes',
  'Concierge',
];

export default function AmenitiesSelector({
  selectedAmenities,
  onChange,
}: AmenitiesSelectorProps) {
  const handleToggleAmenity = (amenity: string) => {
    const updatedAmenities = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity];
    onChange(updatedAmenities);
  };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Amenities</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {amenitiesList.map((amenity) => (
          <label key={amenity} className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedAmenities.includes(amenity)}
              onChange={() => handleToggleAmenity(amenity)}
              className="w-5 h-5 rounded border-gray-300 text-primary-300"
            />
            <span>{amenity}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
