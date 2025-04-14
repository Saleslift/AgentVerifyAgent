import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import { PropertyFilters as PropertyFiltersType } from '../types';

interface PropertyFiltersProps {
  filters: PropertyFiltersType; 
  onFilterChange: (filters: PropertyFiltersType) => void;
  onReset: () => void;
}

// Mock locations data - replace with actual data from your backend
const locations = [
  'Dubai Marina',
  'Downtown Dubai',
  'Palm Jumeirah',
  'Jumeirah Beach Residence',
  'Business Bay',
  'Dubai Hills Estate',
  'Arabian Ranches',
  'Emirates Hills',
  'Jumeirah Lake Towers',
  'Dubai Silicon Oasis'
];

export default function PropertyFilterPanel({ filters, onFilterChange, onReset }: PropertyFiltersProps) {
  const propertyTypes = ['Any', 'Apartment', 'Penthouse', 'Townhouse', 'House', 'Villa', 'Land'];
  const furnishingStatuses = ['Any', 'Furnished', 'Unfurnished', 'Semi-Furnished'];
  const completionStatuses = ['Any', 'Ready', 'Off-plan resale', 'Off-Plan'];
  const amenitiesList = [
    'Balcony',
    'Pool',
    'Gym',
    'Parking',
    'Security',
    'Central A/C',
    'Built-in Wardrobes',
    'Concierge'
  ];

  const [query, setQuery] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    filters.locations || []
  );

  const filteredLocations = query === ''
    ? locations
    : locations.filter((location) =>
        location.toLowerCase().includes(query.toLowerCase())
      );

  const handleLocationSelect = (location: string) => {
    if (!selectedLocations.includes(location)) {
      const newLocations = [...selectedLocations, location];
      setSelectedLocations(newLocations);
      onFilterChange({ ...filters, locations: newLocations });
    }
    setQuery('');
  };

  const handleLocationRemove = (locationToRemove: string) => {
    const newLocations = selectedLocations.filter(loc => loc !== locationToRemove);
    setSelectedLocations(newLocations);
    onFilterChange({ ...filters, locations: newLocations.length > 0 ? newLocations : undefined });
  };

  const handleChange = (key: keyof PropertyFiltersType, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    setSelectedLocations([]);
    setQuery('');
    onReset();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 transition-all duration-300 hover:shadow-xl sticky top-4 border border-gray-200">
      <div className="flex justify-between items-center border-b border-gray-100 pb-6">
        <h3 className="text-xl font-bold text-gray-800">Filters</h3>
        <button
          onClick={handleReset}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center transition-colors duration-200"
        >
          <X className="h-4 w-4 mr-1" />
          Reset
        </button>
      </div>

      {/* Property Type */}
      <div className="space-y-3 mt-6">
        <label className="block text-sm font-semibold text-gray-700">
          Property Type
        </label>
        <select
          value={filters.type || 'Any'}
          onChange={(e) => handleChange('type', e.target.value === 'Any' ? undefined : e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
        >
          {propertyTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="space-y-3 mt-6">
        <label className="block text-sm font-semibold text-gray-700">
          Location
        </label>
        <div className="relative">
          <Combobox value={query} onChange={handleLocationSelect}>
            <div className="relative">
              <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                {selectedLocations.map((location) => (
                  <span
                    key={location}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-gray-900"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {location}
                    <button
                      onClick={() => handleLocationRemove(location)}
                      className="ml-1 hover:text-primary-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <Combobox.Input
                  className="flex-1 min-w-[150px] bg-transparent border-none focus:ring-0 text-sm"
                  placeholder="Search locations..."
                  onChange={(e) => setQuery(e.target.value)}
                  value={query}
                />
              </div>
              <Combobox.Options className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredLocations.length === 0 && query !== '' ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No locations found
                  </div>
                ) : (
                  filteredLocations.map((location) => (
                    <Combobox.Option
                      key={location}
                      value={location}
                      className={({ active }) =>
                        `${
                          active ? 'bg-primary-300 text-gray-900' : 'text-gray-900'
                        } cursor-pointer select-none relative py-2 px-4`
                      }
                    >
                      {({ active }) => (
                        <div className="flex items-center">
                          <MapPin className={`h-4 w-4 mr-2 ${active ? 'text-gray-900' : 'text-gray-400'}`} />
                          {location}
                        </div>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3 mt-6">
        <label className="block text-sm font-semibold text-gray-700">
          Price Range
        </label>
        <div className="space-y-3">
          <input
            type="number"
            value={filters.minPrice || ''}
            onChange={(e) => handleChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Min Price"
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
          />
          <input
            type="number"
            value={filters.maxPrice || ''}
            onChange={(e) => handleChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Max Price"
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Beds & Baths */}
      <div className="space-y-3 mt-6">
        <label className="block text-sm font-semibold text-gray-700">
          Rooms
        </label>
        <div className="space-y-3">
          <select
            value={filters.minBeds || 'Any'}
            onChange={(e) => handleChange('minBeds', e.target.value === 'Any' ? undefined : Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
          >
            <option value="Any">Any Beds</option>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num}+ Beds
              </option>
            ))}
          </select>
          <select
            value={filters.minBaths || 'Any'}
            onChange={(e) => handleChange('minBaths', e.target.value === 'Any' ? undefined : Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
          >
            <option value="Any">Any Baths</option>
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num}+ Baths
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Furnishing Status */}
      <div className="space-y-3 mt-6">
        <label className="block text-sm font-semibold text-gray-700">
          Furnishing Status
        </label>
        <select
          value={filters.furnishingStatus || 'Any'}
          onChange={(e) => handleChange('furnishingStatus', e.target.value === 'Any' ? undefined : e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
        >
          {furnishingStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Completion Status */}
      <div className="space-y-3 mt-6">
        <label className="block text-sm font-semibold text-gray-700">
          Completion Status
        </label>
        <select
          value={filters.completionStatus || 'Any'}
          onChange={(e) => handleChange('completionStatus', e.target.value === 'Any' ? undefined : e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
        >
          {completionStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Amenities */}
      <div className="space-y-3 mt-6">
        <label className="block text-sm font-semibold text-gray-700">
          Amenities
        </label>
        <div className="grid grid-cols-1 gap-3">
          {amenitiesList.map((amenity) => (
            <label key={amenity} className="flex items-center space-x-3 group cursor-pointer">
              <input
                type="checkbox"
                checked={filters.amenities?.includes(amenity) || false}
                onChange={(e) => {
                  const currentAmenities = filters.amenities || [];
                  const newAmenities = e.target.checked
                    ? [...currentAmenities, amenity]
                    : currentAmenities.filter((a) => a !== amenity);
                  handleChange('amenities', newAmenities.length > 0 ? newAmenities : undefined);
                }}
                className="w-5 h-5 rounded border-gray-300 text-primary-300 focus:ring-primary-300 transition-colors duration-200"
              />
              <span className="text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                {amenity}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}