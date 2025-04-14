import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import type { Property } from '../types';
import { calculateMarkerOffsets } from '../utils/mapHelpers';

interface PropertyMapProps {
  properties: Property[];
  onPropertySelect: (property: Property) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '700px'
};

const defaultCenter = {
  lat: 25.2048, // Dubai center
  lng: 55.2708
};

export default function PropertyMap({
  properties,
  onPropertySelect,
  initialCenter = defaultCenter,
  initialZoom = 11
}: PropertyMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'drawing']
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [displayProperties, setDisplayProperties] = useState<Property[]>([]);

  // Apply marker offsets to prevent overlapping
  useEffect(() => {
    if (properties.length > 0) {
      // Don't apply offsets on the Property Page (where we only show one property)
      if (properties.length === 1) {
        setDisplayProperties(properties);
      } else {
        // Apply offsets for multiple properties
        const offsetProperties = calculateMarkerOffsets(properties);
        setDisplayProperties(offsetProperties);
      }
    } else {
      setDisplayProperties([]);
    }
  }, [properties]);

  const onLoad = useCallback((map: google.maps.Map) => {
    // Fit map to property bounds if properties exist
    if (displayProperties.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      let validCoordinatesFound = false;

      displayProperties.forEach(property => {
        if (property.lat && property.lng) {
          // Convert coordinates to numbers if they're strings
          const lat = typeof property.lat === 'string' ? parseFloat(property.lat) : property.lat;
          const lng = typeof property.lng === 'string' ? parseFloat(property.lng) : property.lng;
          
          // Only add valid coordinates
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend({ lat, lng });
            validCoordinatesFound = true;
          }
        }
      });

      if (validCoordinatesFound) {
        map.fitBounds(bounds);
        
        // Adjust zoom if too close
        const listener = google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > 15) map.setZoom(15);
          google.maps.event.removeListener(listener);
        });
      } else {
        // Use default center and zoom if no valid coordinates
        map.setCenter(initialCenter);
        map.setZoom(initialZoom);
      }
    } else {
      // Use default center and zoom if no properties
      map.setCenter(initialCenter);
      map.setZoom(initialZoom);
    }
    setMap(map);
  }, [displayProperties, initialCenter, initialZoom]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMarkerClick = (property: Property) => {
    setSelectedProperty(property);
    onPropertySelect(property);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[700px] bg-gray-100 rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={initialCenter}
        zoom={initialZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true
        }}
      >
        {/* Property Markers */}
        {displayProperties.map(property => {
          // Skip properties without coordinates
          if (!property.lat || !property.lng) return null;

          // Convert coordinates to numbers if they're strings
          const lat = typeof property.lat === 'string' ? parseFloat(property.lat) : property.lat;
          const lng = typeof property.lng === 'string' ? parseFloat(property.lng) : property.lng;
          
          // Skip invalid coordinates
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={property.id}
              position={{ lat, lng }}
              onClick={() => handleMarkerClick(property)}
              onMouseOver={() => setHoveredProperty(property)}
              onMouseOut={() => setHoveredProperty(null)}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: property.contractType === 'Sale' ? '#000000' : '#4CAF50',
                fillOpacity: 0.7,
                strokeWeight: 1,
                strokeColor: '#FFFFFF'
              }}
            />
          );
        })}

        {/* Property Info Window */}
        {hoveredProperty && hoveredProperty.lat && hoveredProperty.lng && (
          <InfoWindow
            position={{
              lat: typeof hoveredProperty.lat === 'string' ? parseFloat(hoveredProperty.lat) : hoveredProperty.lat,
              lng: typeof hoveredProperty.lng === 'string' ? parseFloat(hoveredProperty.lng) : hoveredProperty.lng
            }}
            onCloseClick={() => setHoveredProperty(null)}
          >
            <div className="max-w-xs">
              <div className="aspect-video w-full overflow-hidden rounded-lg mb-2">
                <img
                  src={hoveredProperty.images[0]}
                  alt={hoveredProperty.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{hoveredProperty.title}</h3>
              <p className="text-primary-300 font-semibold">
                {hoveredProperty.price.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'AED',
                  maximumFractionDigits: 0
                })}
              </p>
            </div>
          </InfoWindow>
        )}

        {/* Selected Property Info Window */}
        {selectedProperty && selectedProperty.lat && selectedProperty.lng && (
          <InfoWindow
            position={{
              lat: typeof selectedProperty.lat === 'string' ? parseFloat(selectedProperty.lat) : selectedProperty.lat,
              lng: typeof selectedProperty.lng === 'string' ? parseFloat(selectedProperty.lng) : selectedProperty.lng
            }}
            onCloseClick={() => setSelectedProperty(null)}
          >
            <div className="max-w-xs">
              <div className="aspect-video w-full overflow-hidden rounded-lg mb-2">
                <img
                  src={selectedProperty.images[0]}
                  alt={selectedProperty.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{selectedProperty.title}</h3>
              <p className="text-primary-300 font-semibold">
                {selectedProperty.price.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'AED',
                  maximumFractionDigits: 0
                })}
              </p>
              <div className="mt-2">
                <button 
                  onClick={() => onPropertySelect(selectedProperty)}
                  className="w-full px-3 py-1.5 bg-black text-white rounded-lg text-sm hover:bg-gray-900"
                >
                  View Details
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}