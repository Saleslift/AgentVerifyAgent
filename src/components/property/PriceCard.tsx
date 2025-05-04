import React from 'react';
import { Property } from '../../types';

interface PriceCardProps {
  property: Property;
}

const PriceCard: React.FC<PriceCardProps> = ({ property }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Property Details</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Type</span>
          <span className="font-medium">{property.type}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Purpose</span>
          <span className="font-medium">For {property.contractType}</span>
        </div>
        {property.furnishingStatus && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Furnishing</span>
            <span className="font-medium">{property.furnishingStatus}</span>
          </div>
        )}
        {property.completionStatus && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Completion</span>
            <span className="font-medium">{property.completionStatus}</span>
          </div>
        )}
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Parking</span>
          <span className="font-medium">
            {property.parkingAvailable ? 'Available' : 'Not Available'}
          </span>
        </div>
      </div>

      {/* Highlight Feature */}
      {property.highlight && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6">
          <h3 className="text-lg font-semibold mb-3">Property Highlight</h3>
          <p className="text-gray-700">{property.highlight}</p>
        </div>
      )}
    </div>
  );
};

export default PriceCard;
