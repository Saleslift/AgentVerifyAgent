import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Project } from '../../../types';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { X } from 'lucide-react';

interface ProjectMapProps {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 25.2048, // Dubai center
  lng: 55.2708
};

export default function ProjectMap({ projects, onProjectClick }: ProjectMapProps) {
  const { formatPrice } = useCurrency();
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    // Fit map to project bounds if projects exist
    if (projects.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      let validCoordinatesFound = false;

      projects.forEach(project => {
        if (project.lat && project.lng) {
          // Convert coordinates to numbers if they're strings
          const lat = typeof project.lat === 'string' ? parseFloat(project.lat) : project.lat;
          const lng = typeof project.lng === 'string' ? parseFloat(project.lng) : project.lng;
          
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
        map.setCenter(defaultCenter);
        map.setZoom(11);
      }
    } else {
      // Use default center and zoom if no projects
      map.setCenter(defaultCenter);
      map.setZoom(11);
    }
    setMap(map);
  }, [projects]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const getMarkerIcon = (project: Project) => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: project.is_prelaunch ? '#9333ea' : '#000000',
      fillOpacity: 0.8,
      strokeWeight: 1,
      strokeColor: '#FFFFFF'
    };
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}
      zoom={11}
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
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
      }}
    >
      {projects.map(project => {
        // Skip projects without coordinates
        if (!project.lat || !project.lng) return null;

        // Convert coordinates to numbers if they're strings
        const lat = typeof project.lat === 'string' ? parseFloat(project.lat) : project.lat;
        const lng = typeof project.lng === 'string' ? parseFloat(project.lng) : project.lng;
        
        // Skip invalid coordinates
        if (isNaN(lat) || isNaN(lng)) return null;

        return (
          <Marker
            key={project.id}
            position={{ lat, lng }}
            icon={getMarkerIcon(project)}
            onClick={() => setSelectedProject(project)}
          />
        );
      })}

      {selectedProject && selectedProject.lat && selectedProject.lng && (
        <InfoWindow
          position={{
            lat: typeof selectedProject.lat === 'string' ? parseFloat(selectedProject.lat) : selectedProject.lat,
            lng: typeof selectedProject.lng === 'string' ? parseFloat(selectedProject.lng) : selectedProject.lng
          }}
          onCloseClick={() => setSelectedProject(null)}
        >
          <div className="max-w-xs">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900">{selectedProject.title}</h3>
              <button 
                onClick={() => setSelectedProject(null)} 
                className="text-gray-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            
            <div className="aspect-video w-full overflow-hidden rounded-lg mb-2">
              <img
                src={selectedProject.images[0]}
                alt={selectedProject.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="text-sm text-gray-500 mb-1">
              {selectedProject.location}
            </div>
            
            <div className="text-sm font-medium mb-2">
              {formatPrice(selectedProject.min_price)} - {formatPrice(selectedProject.max_price)}
            </div>
            
            {selectedProject.is_prelaunch && (
              <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full mb-2">
                New Launch
              </span>
            )}
            
            <button 
              onClick={() => onProjectClick(selectedProject.id)}
              className="w-full px-3 py-1.5 bg-black text-white rounded-lg text-sm hover:bg-gray-900"
            >
              View Details
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}