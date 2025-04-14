import React, { useState, useEffect } from 'react';
import { ShoppingBag, ShoppingCart, School, Building, Star, Clock, MapPin } from 'lucide-react';

interface Place {
  id: string;
  name: string;
  distance: number;
  duration: string;
  rating?: number;
  openNow?: boolean;
  openingHours?: string;
  vicinity: string;
}

interface NearbyPlacesProps {
  propertyLat: number;
  propertyLng: number;
}

const categories = [ 
  { name: 'Shopping Malls', type: 'shopping_mall', radius: 5000, icon: ShoppingBag },
  { name: 'Grocery Stores', type: 'supermarket', radius: 3000, icon: ShoppingCart },
  { name: 'Schools', type: 'school', radius: 5000, icon: School },
  { name: 'Hospitals', type: 'hospital', radius: 10000, icon: Building }
];

export default function NearbyPlaces({ propertyLat, propertyLng }: NearbyPlacesProps) {
  const [places, setPlaces] = useState<Record<string, Place[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!propertyLat || !propertyLng || !window.google || !window.google.maps.geometry?.spherical) return;

    const fetchNearbyPlaces = async () => {
      const propertyLocation = new google.maps.LatLng(propertyLat, propertyLng);
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      categories.forEach(category => {
        setLoading(prev => ({ ...prev, [category.type]: true }));
        
        const request = {
          location: propertyLocation,
          radius: category.radius,
          type: category.type
        };
        
        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Process results
            const processedPlaces = results.slice(0, 3).map(place => {
              // Calculate distance
              const placeLocation = new google.maps.LatLng(
                place.geometry?.location?.lat() || 0,
                place.geometry?.location?.lng() || 0
              );
              
              let distance = 0;
              if (google.maps.geometry?.spherical) {
                distance = google.maps.geometry.spherical.computeDistanceBetween(
                  propertyLocation,
                  placeLocation
                );
              }
              
              // Calculate duration (estimated)
              const speedKmPerHour = 30; // Average speed in city
              const distanceKm = distance / 1000;
              const timeHours = distanceKm / speedKmPerHour;
              const timeMinutes = Math.round(timeHours * 60);
              
              return {
                id: place.place_id || `${place.name}-${distance}`,
                name: place.name || 'Unknown Place',
                distance: distance / 1000, // Convert to kilometers
                duration: `${timeMinutes} min`,
                rating: place.rating,
                openNow: place.opening_hours?.isOpen?.(),
                vicinity: place.vicinity || '',
              };
            });
            
            // Sort by distance
            processedPlaces.sort((a, b) => a.distance - b.distance);
            
            setPlaces(prev => ({ ...prev, [category.type]: processedPlaces }));
            setError(prev => ({ ...prev, [category.type]: null }));
          } else {
            setError(prev => ({ ...prev, [category.type]: `Failed to fetch ${category.name}` }));
          }
          setLoading(prev => ({ ...prev, [category.type]: false }));
        });
      });
    };
    
    fetchNearbyPlaces();
  }, [propertyLat, propertyLng]);

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(1)} km`; 
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200"> 
      <h2 className="text-xl font-semibold mb-6">Nearby Places</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {categories.map(category => (
          <div key={category.type} className="space-y-4">
            <div className="flex items-center space-x-2">
              <category.icon className="h-5 w-5 text-primary-300" />
              <h3 className="text-lg font-medium">{category.name}</h3>
            </div>
            
            {loading[category.type] ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-300"></div>
              </div>
            ) : error[category.type] ? (
              <div className="text-red-500 text-sm">{error[category.type]}</div>
            ) : places[category.type]?.length ? (
              <div className="space-y-3">
                {places[category.type].map(place => (
                  <div key={place.id} className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition-shadow border border-gray-200">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900">{place.name}</h4>
                      {place.rating && (
                        <div className="flex items-center bg-primary-100 px-2 py-0.5 rounded-full">
                          <Star className="h-3 w-3 text-primary-300 mr-1 fill-current" />
                          <span className="text-xs font-medium">{place.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 mr-1" />
                        <span className="truncate">{place.vicinity}</span> 
                      </div>
                      
                      <div className="flex justify-between mt-1">
                        <div className="flex items-center"> 
                          <Clock className="h-3.5 w-3.5 text-gray-400 mr-1" />
                          <span>{place.duration} by car</span>
                        </div>
                      </div>
                    </div>
                    
                    {place.openNow !== undefined && (
                      <div className="mt-2"> 
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          place.openNow 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {place.openNow ? 'Open Now' : 'Closed'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm py-4">No {category.name.toLowerCase()} found within {category.radius/1000}km</div> 
            )}
          </div>
        ))}
      </div>
    </div>
  );
}