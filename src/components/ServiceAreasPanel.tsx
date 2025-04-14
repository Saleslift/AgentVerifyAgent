import React from 'react';
import { Building2, X } from 'lucide-react';
import { ServiceArea } from '../types';

interface ServiceAreasPanelProps {
  serviceAreas: ServiceArea[];
  onRemove?: (id: string) => void;
  isEditing?: boolean;
}

export default function ServiceAreasPanel({ serviceAreas, onRemove, isEditing = false }: ServiceAreasPanelProps) {
  if (!Array.isArray(serviceAreas)) {
    return (
      <div className="text-center py-8 text-gray-500">
        No service areas available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {serviceAreas.map((area) => (
        <div
          key={area.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-primary-300 mr-3" />
            <span className="font-medium">{area.location}</span>
          </div>
          {isEditing && onRemove && (
            <button
              onClick={() => onRemove(area.id)}
              className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      ))}

      {serviceAreas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No service areas added yet
        </div>
      )}
    </div>
  );
}