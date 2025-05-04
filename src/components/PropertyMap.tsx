import React, {useState, useEffect} from 'react';
import {Map, Marker, InfoWindow, useMap} from '@vis.gl/react-google-maps';
import type {Property} from '../types';
import {calculateMarkerOffsets} from '../utils/mapHelpers';

type MapProperty = Property | DB_Properties;

interface PropertyMapVisGLProps {
    properties: MapProperty[];
    onPropertySelect: (property: MapProperty) => void;
    initialCenter?: { lat: number; lng: number };
    initialZoom?: number;
    customMapStyle?: React.CSSProperties
    mapID?: string;
}

const mapContainerStyle = {
    width: '100%',
    height: '700px'
};

const defaultCenter = {
    lat: 25.2048, // Dubai center
    lng: 55.2708
};

const MAP_ID = 'property-map';

export default function PropertyMap(props: PropertyMapVisGLProps) {
    const {
        properties,
        onPropertySelect,
        initialCenter = defaultCenter,
        initialZoom = 11,
        customMapStyle = {},
        mapID = MAP_ID,
    } = props;
    const [hoveredProperty, setHoveredProperty] = useState<MapProperty | null>(null);
    const [displayProperties, setDisplayProperties] = useState<MapProperty[]>([]);
    const map = useMap(mapID);

    // Apply marker offsets to prevent overlapping
    useEffect(() => {
        if (properties.length > 0) {
            if (properties.length === 1) {
                setDisplayProperties(properties);
            } else {
                const offsetProperties = calculateMarkerOffsets(properties);
                setDisplayProperties(offsetProperties);
            }
        } else {
            setDisplayProperties([]);
        }
    }, [properties]);

    const handleMarkerClick = (property: MapProperty) => {
        onPropertySelect(property);
    };

    const getLatLng = (property: MapProperty) => {
        const lat = typeof property.lat === 'string' ? parseFloat(property.lat) : property.lat as number;
        const lng = typeof property.lng === 'string' ? parseFloat(property.lng) : property.lng as number;


        return {lat, lng};
    }

    const fitMapToBounds = () => {
        if (displayProperties.length > 0 && map) {
            if (displayProperties.length === 1) {
                const {lat = 0, lng = 0} = getLatLng(displayProperties[0]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    map.setCenter({lat, lng});
                    map.setZoom(14); // Adjust this zoom level as needed for a single property
                }
            }
            else {
                const bounds = new google.maps.LatLngBounds();

                displayProperties.forEach(property => {
                    if (property.lat && property.lng) {
                        const {lat = 0, lng = 0} = getLatLng(property);

                        if (!isNaN(lat) && !isNaN(lng)) {
                            bounds.extend({lat, lng});
                        }
                    }
                });
                if (!bounds.isEmpty()) {
                    map.fitBounds(bounds);
                } else {
                    map.setCenter(initialCenter);
                    map.setZoom(initialZoom);
                }
            }
        }
    };

    useEffect(() => {
        if (map) {
            fitMapToBounds();
        }
    }, [map, displayProperties]);

    return (
        <div className="relative rounded-xl overflow-hidden shadow-lg break-before-page">
            <Map
                id={mapID}
                defaultCenter={initialCenter}
                defaultZoom={initialZoom}
                style={{...mapContainerStyle, ...customMapStyle}}
            >
                {/* Property Markers */}
                {displayProperties.map(property => {
                    if (!property.lat || !property.lng) {
                        return null;
                    }
                    const {lat, lng} = getLatLng(property)

                    return (
                        <Marker
                            key={property.id}
                            position={{lat, lng}}
                            onClick={() => handleMarkerClick(property)}
                            onMouseOver={() => setHoveredProperty(property)}
                            onMouseOut={() => setHoveredProperty(null)}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 20,
                                fillColor: property.contractType === 'Sale' ? '#000000' : '#4CAF50',
                                fillOpacity: 1,
                                strokeWeight: 1,
                                strokeColor: '#FFFFFF'
                            }}
                        />
                    );
                })}

                {/* Property Info Window */}
                {hoveredProperty && hoveredProperty.lat && hoveredProperty.lng && (
                    <InfoWindow
                        position={getLatLng(hoveredProperty)}
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
            </Map>
        </div>
    );
}
