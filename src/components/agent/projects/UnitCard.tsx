import React from 'react';
import { Plus, Trash } from 'lucide-react';
import UnitTypePdfDowloadLink from "../../property/UnitTypePdfDownloadLink.tsx";

interface UnitCardProps {
  unit: DB_Unit_Types;
  projectId: string;
  onAddUnitToDisplay: (unitId: string, projectId: string) => void;
  removeUnitFromDisplay: (unitId: string) => void;
  addingUnitId: string | null;
  displayedUnitTypes: DB_Agent_Unit_Types[];
  profile: DB_Profile,
}

export default function UnitCard({
  unit,
  projectId,
  onAddUnitToDisplay,
  removeUnitFromDisplay,
  addingUnitId,
  displayedUnitTypes,
  profile,
}: UnitCardProps) {
  const isDisplayed = displayedUnitTypes.some(
    (displayedUnit) => displayedUnit.unit_type_id === unit.id
  );

  const handleAddUnit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddUnitToDisplay(unit.id, projectId);
  };

  const handleRemoveUnit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeUnitFromDisplay(unit.id);
  };

  return (
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300 mb-4">
        <div className="flex justify-between mb-4">
        <span className="font-medium">{unit.title}</span>
        <span
          className={`px-1.5 py-0.5 rounded text-xs ${
            unit.status === 'available'
              ? 'bg-green-100 text-green-800'
              : unit.status === 'sold out'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {unit.status === 'available' ? 'Available' : 'Sold out'}
        </span>
      </div>


      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
        <div>Size: {unit.sqft}sqft</div>
        <div>Price: {unit.price}AED</div>
      </div>
      <UnitTypePdfDowloadLink unitType={unit} profile={profile}/>

      {isDisplayed ? (
        <button
          onClick={handleRemoveUnit}
          className="w-full mt-1 inline-flex items-center justify-center px-2 py-1.5 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
        >
          <Trash className="h-3 w-3 mr-1" />
          Remove from My Public Page
        </button>
      ) : (
        <button
          onClick={handleAddUnit}
          disabled={unit.status === 'sold out' || addingUnitId === unit.id}
          className={`w-full mt-1 inline-flex items-center justify-center px-2 py-1.5 rounded text-xs font-medium ${
            unit.status === 'sold out'
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : addingUnitId === unit.id
              ? 'bg-gray-200 text-gray-500'
              : 'gradient-button'
          }`}
        >
          {addingUnitId === unit.id ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-3 w-3 mr-1" />
              Display on My Public Page
            </>
          )}
        </button>
      )}
    </div>
  );
}
