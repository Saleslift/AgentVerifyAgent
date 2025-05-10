import React from 'react';
import { Eye } from 'lucide-react';
interface UnitTypeCardProps {
  unitType: DB_Unit_Types,
  onViewDetails: (id: string) => void;
  propertyAddress: string | null;
  propertyName: string | null;
  profile: DB_Profile | null;
}


const UnitTypeCard: React.FC<UnitTypeCardProps> = ({unitType, onViewDetails }) => {

  const getStartRange = (prop: string | null) => {
    if (typeof prop === 'string') {
      const propParts = prop.replace(/\s+/g, '').split('-');
      if (propParts.length > 0) {
        return propParts[0].trim();
      }
    }

    return '';
  }

  const getConvertedUnitType = (unitType: DB_Unit_Types): DB_Unit_Types => {
    const {price_range, floor_range, size_range} = unitType;
    const convertedUnitType = {
      ...unitType,
      price_range: price_range ? getStartRange(price_range) : price_range,
      floor_range: floor_range ? getStartRange(floor_range) : floor_range,
      size_range: size_range ? getStartRange(size_range) : size_range,
    };
    return convertedUnitType;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="aspect-video bg-gray-200">
        {unitType.images && unitType.images[0] ? (
          <img
            src={unitType.images[0]}
            alt={unitType.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{unitType.title}</h3>

        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(unitType.id)}
            className="flex-1 py-2 text-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Eye className="h-5 w-5 mr-2 inline" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitTypeCard;
