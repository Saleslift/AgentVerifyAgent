import React from 'react';
import {ArrowLeft, Plus, Save, Trash2} from 'lucide-react';
import {useAuth} from "../../../contexts/AuthContext.tsx";
import BasicInformation from "../../property/property-form/BasicInformation.tsx";
import {UnitType} from "../../../types";
import DetailsSection from "../../property/property-form/DetailsSection.tsx";
import AmenitiesSection from "../../property/property-form/AmenitiesSection.tsx";
import MediaGallery from "../../property/property-form/MediaGallery.tsx";
import AdditionalFeatures from "../../property/property-form/AdditionalFeatures.tsx";


interface UnitGroupRepeaterProps {
  unitGroups: UnitType[];
  onChange: (groups: UnitType[]) => void;
  onPrev: () => void;
  onSubmit: () => void;
  loading: boolean;
  onAddToDeletedUnitGroup: (unitType: UnitType) => void;
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

const DEFAULT_UNIT_TYPE: UnitType = {
  title: '',
  developerId: '',
  projectId: '',
  images: [],
  floorPlanImage: '',
  description: '',
  type: 'Apartment',
  price: 0,
  bedrooms: 0,
  bathrooms: 0,
  furnishingStatus: null,
  completionStatus: 'Off-Plan',
  sqft: 0,
  amenities: [],
  parkingAvailable: false,
  videos: [],
  createdAt: null,
  floorRange: null,
  notes: null,
  priceRange: null,
  sizeRange: null,
  status: '',
  unitsAvailable: null,
  updatedAt: null,
  contractType: 'Sale',
  id: ''
}

const UnitGroupRepeater = (props: UnitGroupRepeaterProps) => {
  const { user } = useAuth();
  const {
      unitGroups = [], // Provide default empty array
      onChange,
      onPrev,
      onSubmit,
      loading,
      onAddToDeletedUnitGroup,
  } = props;

  const handleAddUnitGroup = () => {
    onChange([...unitGroups, DEFAULT_UNIT_TYPE]);
  };

  const handleRemoveUnitGroup = (id: string) => {
    if (unitGroups.length <= 1) {
      return; // Don't remove the last group
    }
    const unitToDelete = unitGroups.find(group => group.id === id);
    if (unitToDelete) {
      onAddToDeletedUnitGroup(unitToDelete);
    }
    onChange(unitGroups.filter(group => group.id !== id));
  };

  const onChangeUnitType = (currentUnitType: UnitType, newAttribute: Partial<UnitType>) => {
    const newUnitType = {...currentUnitType, ...newAttribute};
    onChange(unitGroups.map(group => group.id === currentUnitType.id ? newUnitType : group));
  }

  // If no unit groups exist, add one by default
  React.useEffect(() => {
    if (unitGroups.length === 0) {
      handleAddUnitGroup();
    }
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-900">Unit Types</h2>

      <div className="space-y-6">
        {unitGroups.map((group, index) => (
          <div
            key={group.id}
            className="bg-gray-10 rounded-lg p-6 border border-gray-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Unit Type {index + 1}</h3>
              <button
                type="button"
                onClick={() => handleRemoveUnitGroup(group.id)}
                disabled={unitGroups.length <= 1}
                className="p-2 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            <div>
              {/* Units Available */}
              <div >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Units Available *
                </label>
                <input
                    type="number"
                    value={group?.unitsAvailable || 0}
                    onChange={(e) => onChangeUnitType(group, {unitsAvailable: parseInt(e.target.value)})}
                    placeholder="Number of units"
                    className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                    min="1"
                />
              </div>
              <BasicInformation
                  contractTypes={['Sale']}
                  completionStatus={['Off Plan']}
                  formData={group}
                  withLand={false}
                  setFormData={(newAttribute) => onChangeUnitType(group, newAttribute)}
              />



              {/* Details */}
              <DetailsSection
                  formData={group}
                  setFormData={(newAttribute) => onChangeUnitType(group, newAttribute)}
              />


              {/* Amenities */}
              <AmenitiesSection
                  amenitiesList={amenitiesList}
                  selectedAmenities={group.amenities || []}
                  onAmenitiesChange={(updatedAmenities) =>
                      onChangeUnitType(group, { amenities: updatedAmenities })
                  }
              />
                <MediaGallery
                    userId={user?.id || ''}
                    media={group.images || []}
                    onMediaChange={(newMedia) => onChangeUnitType(group, { images: newMedia })}
                    maxFileSizeMB={5}
                    maxFiles={20}
                    title={"Photo Gallery"}
                    type={"image"}
                    bucketName={'properties'} />

                <MediaGallery
                    userId={user?.id || ''}
                    media={group.videos || []}
                    onMediaChange={(newMedia) => onChangeUnitType(group, { videos: newMedia })}
                    maxFileSizeMB={50}
                    maxFiles={2}
                    title={"Video Gallery"}
                    type={"video"}
                    bucketName={'properties'} />

                <MediaGallery
                    userId={user?.id || ''}
                    media={group.floorPlanImage ? [group.floorPlanImage] : []}
                    onMediaChange={(newMedia) => onChangeUnitType(group, { floorPlanImage: newMedia[0] || null })}
                    maxFileSizeMB={5}
                    maxFiles={1}
                    title={"Floor Plan"}
                    type={"image"}
                    bucketName={'properties'} />

                {/* Additional Features */}
                <AdditionalFeatures
                    formData={group}
                    setFormData={(newAttribute) => onChangeUnitType(group, newAttribute)}
                    withListInMarketplace={false}
                />
            </div>
          </div>)
        )}

      {/* Add Unit Group Button */}
      <div>
        <button
          type="button"
          onClick={handleAddUnitGroup}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Another Unit Type
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onPrev}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Project Details
        </button>

        <div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {window.location.pathname.includes('edit') ? 'Update Project' : 'Create Project'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};


export { UnitGroupRepeater }
