import React, { useState, useEffect } from 'react';
import { MapPin, Coffee, ShoppingBag, Utensils, School, Bus, Building2, Star } from 'lucide-react';

interface Place {
  id: string; // Unified ID to handle both `id` and `place_id`
  name: string;
  vicinity: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  distance?: number;
  duration?: string; // Added duration for travel time
  openNow?: boolean; // Added open/closed status
  icon: React.ElementType;
}

interface PlaceType {
  type: string;
  label: string;
  radius: number; // Added radius for dynamic search
  icon: React.ElementType;
}

interface NearbyPlacesProps {
  propertyLat: number;
  propertyLng: number;
  placeTypes?: PlaceType[]; // Made `placeTypes` configurable
}


const defaultPlaceTypes: PlaceType[] = [
  { type: 'restaurant', label: 'Restaurants', radius: 1000, icon: Utensils },
  { type: 'cafe', label: 'Cafes', radius: 1000, icon: Coffee },
  { type: 'shopping_mall', label: 'Shopping', radius: 5000, icon: ShoppingBag },
  { type: 'school', label: 'Schools', radius: 5000, icon: School },
  { type: 'transit_station', label: 'Transit', radius: 3000, icon: Bus },
  { type: 'supermarket', label: 'Supermarkets', radius: 3000, icon: Building2 }
];

export default function NearbyPlaces({ propertyLat, propertyLng, placeTypes = defaultPlaceTypes }: NearbyPlacesProps) {
  const [selectedType, setSelectedType] = useState(placeTypes[0].type);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Added error state for better error handling

  useEffect(() => {
    if (!propertyLat || !propertyLng || !window.google) return;
    fetchNearbyPlaces(selectedType);
  }, [selectedType, propertyLat, propertyLng]);

  const fetchNearbyPlaces = (type: string) => {
    setLoading(true);
    setError(null); // Reset error state before fetching
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    const selectedPlaceType = placeTypes.find(pt => pt.type === type);

    const request = {
      location: new google.maps.LatLng(propertyLat, propertyLng),
      radius: selectedPlaceType?.radius || 1000, // Use radius from `placeTypes`
      type: type as google.maps.places.PlaceType
    };

    service.nearbySearch(request, (results, status) => {

      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const propertyLocation = new google.maps.LatLng(propertyLat, propertyLng);

        const processedPlaces = results
            .map(place => {
              if (!place.geometry?.location) return null;

              const placeLocation = place.geometry.location;
              const distance = google.maps.geometry.spherical.computeDistanceBetween(
                  propertyLocation,
                  placeLocation
              );

              const duration = `${Math.round((distance / 1000) / 30 * 60)} min`; // Approx. duration by car
              return {
                id: place.place_id || `${place.name}-${distance}`, // Unified ID logic
                name: place.name || 'Unknown Place',
                vicinity: place.vicinity || '',
                types: place.types || [],
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                distance: Math.round(distance),
                duration, // Added duration to the place object
                openNow: place.opening_hours?.isOpen?.(), // Added open/closed status
                icon: selectedPlaceType?.icon || MapPin
              };
            })
            .filter(place => place !== null) as Place[];

        processedPlaces.sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Sort by distance
        setPlaces(processedPlaces.slice(0, 6)); // Limit to 6 places
      } else {
        setError(`Failed to fetch ${selectedPlaceType?.label || 'places'}`); // Set error message
        setPlaces([]);
      }
      setLoading(false);
    });
  };

  return (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Nearby Places</h2>
          <MapPin className="h-6 w-6 text-gray-400" />
        </div>

        <div className="flex flex-wrap overflow-x-auto space-x-2 pb-2 mb-4">
          {placeTypes.map(({ type, label, icon: Icon }) => (
              <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex items-center space-x-2 px-4 py-2 my-1 rounded-full whitespace-nowrap
              ${selectedType === type
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
          ))}
        </div>

        {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
            </div>
        ) : error ? ( // Display error message if fetching fails
            <div className="text-center py-6 text-red-500">{error}</div>
        ) : places.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {places.map((place) => {
                const Icon = place.icon;
                return (
                    <div
                        key={place.id} // Unified key to handle both `id` and `place_id`
                        className="p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{place.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{place.vicinity}</p>
                          <div className="flex justify-between items-center mt-2">
                            {place.rating ? (
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                  <span className="text-sm font-medium">{place.rating}</span>
                                  <span className="text-xs text-gray-500 ml-1">
                            ({place.user_ratings_total})
                          </span>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-500">No ratings</span>
                            )}
                            <span className="text-sm text-gray-600">{place.distance}m away</span>
                          </div>
                          {place.duration && (
                              <div className="text-xs text-gray-500 mt-1">~{place.duration} by car</div> // Display duration
                          )}
                          {place.openNow !== undefined && (
                              <div className="mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            place.openNow
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                          {place.openNow ? 'Open Now' : 'Closed'} // Display open/closed status
                        </span>
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
        ) : (
            <div className="text-center py-6 text-gray-500">
              No {placeTypes.find(pt => pt.type === selectedType)?.label.toLowerCase()} found nearby
            </div>
        )}
      </div>
  );
}
