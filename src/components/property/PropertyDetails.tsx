import React, { useState, useEffect } from 'react';
import { Bed, Bath, Square, CarFront as Car, LayoutGrid, Building, Sparkles } from 'lucide-react';
import { Property } from '../../types';
import { supabase } from '../../utils/supabase';

interface PropertyDetailsProps {
  property: Property;
}

interface AmenityItem {
  name: string;
  is_custom: boolean;
}

const PropertyDetailsUnified: React.FC<PropertyDetailsProps> = ({ property }) => {
  const [allAmenities, setAllAmenities] = useState<AmenityItem[]>([]);

  // Group amenities by category
  const groupedAmenities = React.useMemo(() => {
    const groups: Record<string, AmenityItem[]> = {
      Standard: [],
      Custom: [],
    };

    allAmenities.forEach((amenity) => {
      if (amenity.is_custom) {
        groups.Custom.push(amenity);
      } else {
        groups.Standard.push(amenity);
      }
    });

    return groups;
  }, [allAmenities]);

  // Fetch all amenities including custom ones
  useEffect(() => {
    const fetchAllAmenities = async () => {
      try {
        const { data, error } = await supabase.rpc('get_all_property_amenities', {
          p_property_id: property.id,
        });

        if (error) throw error;

        if (data) {
          setAllAmenities(data);
        }
      } catch (err) {
        console.error('Error fetching amenities:', err);
        // Fallback to standard amenities if custom fetch fails
        setAllAmenities(
            (property.amenities || []).map((name) => ({
              name,
              is_custom: false,
            }))
        );
      }
    };
    if (property?.id) {
      fetchAllAmenities();

    }
  }, [property.id, property.amenities]);

  return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8" id={'property-details'}>
        <h2 className="text-xl font-semibold mb-6">Property Details</h2>

        {/* Property Details Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {property.bedrooms !== null && (
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Bed className="h-6 w-6 text-gray-600 mb-2" />
                <span className="text-sm text-gray-500">Bedrooms</span>
                <span className="font-semibold text-lg">{property.bedrooms}</span>
              </div>
          )}

          {property.bathrooms !== null && (
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Bath className="h-6 w-6 text-gray-600 mb-2" />
                <span className="text-sm text-gray-500">Bathrooms</span>
                <span className="font-semibold text-lg">{property.bathrooms}</span>
              </div>
          )}

          {property.sqft !== null && (
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Square className="h-6 w-6 text-gray-600 mb-2" />
                <span className="text-sm text-gray-500">Area</span>
                <span className="font-semibold text-lg">{property.sqft} sqft</span>
              </div>
          )}

          {property.parkingAvailable !== undefined && (
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Car className="h-6 w-6 text-gray-600 mb-2" />
                <span className="text-sm text-gray-500">Parking</span>
                <span className="font-semibold text-lg">{property.parkingAvailable ? 'Yes' : 'No'}</span>
              </div>
          )}

          {property.type && (
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Building className="h-6 w-6 text-gray-600 mb-2" />
                <span className="text-sm text-gray-500">Type</span>
                <span className="font-semibold text-lg">{property.type}</span>
              </div>
          )}

          {property.furnishingStatus && (
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <LayoutGrid className="h-6 w-6 text-gray-600 mb-2" />
                <span className="text-sm text-gray-500">Furnishing</span>
                <span className="font-semibold text-lg">{property.furnishingStatus}</span>
              </div>
          )}
        </div>

        {/* Amenities Section */}
        {allAmenities.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-gray-600" />
                Amenities
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(groupedAmenities).map(([category, amenities]) => amenities.length ? (
                    <div key={category}>
                      <h4 className="text-md font-semibold mb-2">{category}</h4>
                      {amenities.map((amenity, index) => (
                          <div key={`${amenity.name}-${index}`} className="flex items-center p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{amenity.name}</span>
                          </div>
                      ))}
                    </div>
                ): null)}
              </div>
            </div>
        )}

        {/* Description Section */}
        {property.description && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
            </div>
        )}
      </div>
  );
};

export default PropertyDetailsUnified;
