import React, { useState, useEffect } from 'react';
import { Property } from '../../types';
import { supabase } from '../../utils/supabase';

interface PropertyDetailsProps {
  property: Property;
}

interface AmenityItem {
  name: string;
  is_custom: boolean;
}

export default function PropertyDetails({ property }: PropertyDetailsProps) {
  const [allAmenities, setAllAmenities] = useState<AmenityItem[]>([]);
  
  // Group amenities by category
  const groupedAmenities = React.useMemo(() => {
    const groups: Record<string, AmenityItem[]> = {
      'Standard': [],
      'Custom': []
    };
    
    allAmenities.forEach(amenity => {
      if (amenity.is_custom) {
        groups['Custom'].push(amenity);
      } else {
        groups['Standard'].push(amenity);
      }
    });
    
    return groups;
  }, [allAmenities]);
  
  // Fetch all amenities including custom ones
  useEffect(() => {
    const fetchAllAmenities = async () => {
      try {
        const { data, error } = await supabase.rpc(
          'get_all_property_amenities',
          { p_property_id: property.id }
        );
        
        if (error) throw error;
        
        if (data) {
          setAllAmenities(data);
        }
      } catch (err) {
        console.error('Error fetching amenities:', err);
        // Fallback to standard amenities if custom fetch fails
        setAllAmenities((property.amenities || []).map(name => ({ 
          name, 
          is_custom: false 
        })));
      }
    };
    
    fetchAllAmenities();
  }, [property.id, property.amenities]);

  return (
    <div>
      {/* Description Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Description</h2>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
      </div>

      {/* Amenities Section */}
      {allAmenities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
            {allAmenities.map((amenity, index) => (
              <div key={`${amenity.name}-${index}`} className="flex items-center">
                <div className="w-2 h-2 bg-black rounded-full mr-2" />
                <span>{amenity.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}