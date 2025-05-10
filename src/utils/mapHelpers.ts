// Helper functions for map-related operations

import {Property, UnitType} from "../types";

export function calculateMarkerOffsets(properties: Property[] | UnitType[]) {
    const offsetDistance = 0.005; // Adjust this value as needed
    const seenCoordinates = new Map();

    return properties.map(property => {
        const lat = typeof property.lat === 'string' ? parseFloat(property.lat) : property.lat;
        const lng = typeof property.lng === 'string' ? parseFloat(property.lng) : property.lng;

        const key = `${lat},${lng}`;
        if (seenCoordinates.has(key)) {
            const count = seenCoordinates.get(key);
            seenCoordinates.set(key, count + 1);

            // Apply offset based on the count
            const offsetLat = lat + count * offsetDistance;
            const offsetLng = lng + count * offsetDistance;
            return { ...property, lat: offsetLat, lng: offsetLng };
        } else {
            seenCoordinates.set(key, 1);
            return property;
        }
    });
}
