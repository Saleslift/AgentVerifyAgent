import React from 'react';
import {Property, UnitType} from '../../../types';

interface DetailsSectionProps {
  formData: Partial<Property>;
  setFormData: (newAttributes: Partial<Property | UnitType>) => void;
}

export default function DetailsSection({ formData, setFormData }: DetailsSectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Property Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bedrooms
          </label>
          <input
            type="number"
            min="0"
            value={formData.bedrooms || ''}
            onChange={(e) => setFormData( {bedrooms: Number(e.target.value) })}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bathrooms
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={formData.bathrooms || ''}
            onChange={(e) => setFormData({bathrooms: Number(e.target.value) })}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Square Feet
          </label>
          <input
            type="number"
            min="0"
            value={formData.sqft || ''}
            onChange={(e) => setFormData({ sqft: Number(e.target.value) })}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
          />
        </div>
      </div>
    </section>
  );
}
