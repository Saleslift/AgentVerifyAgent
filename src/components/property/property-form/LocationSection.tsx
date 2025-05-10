import React from 'react';
import AddressAutocomplete from '../../AddressAutocomplete';

interface LocationSectionProps {
  location: string;
  onLocationChange: (address: string, lat?: number, lng?: number) => void;
}

export default function LocationSection({ location, onLocationChange }: LocationSectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Location</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address *
        </label>
        <AddressAutocomplete
          value={location}
          onChange={onLocationChange}
          error={location === '' ? 'Please select a valid UAE address' : undefined}
        />
        <p className="mt-2 text-sm text-gray-500">
          Select a valid UAE address from the suggestions to ensure accurate map placement
        </p>
      </div>
    </section>
  );
}
