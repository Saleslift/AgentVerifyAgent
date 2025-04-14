// Helper functions for map-related operations

/**
 * Calculates a small offset for markers with identical or very close coordinates
 * to prevent overlapping and make all markers visible and clickable.
 * 
 * @param properties Array of properties to check for overlapping coordinates
 * @returns Array of properties with adjusted coordinates for display
 */
export function calculateMarkerOffsets<T extends { lat?: number | null; lng?: number | null; id: string }>(
  properties: T[]
): T[] {
  if (!properties || properties.length <= 1) return properties;

  // Create a deep copy to avoid mutating the original array
  const result = JSON.parse(JSON.stringify(properties)) as T[];
  
  // Group properties by their coordinates
  const coordinateGroups: Record<string, T[]> = {};
  
  // First pass: group properties by coordinates
  result.forEach(property => {
    if (property.lat === null || property.lng === null || 
        property.lat === undefined || property.lng === undefined) {
      return; // Skip properties without coordinates
    }
    
    // Round to 5 decimal places to group very close coordinates
    const lat = typeof property.lat === 'string' ? parseFloat(property.lat) : property.lat;
    const lng = typeof property.lng === 'string' ? parseFloat(property.lng) : property.lng;
    
    if (isNaN(lat) || isNaN(lng)) return; // Skip invalid coordinates
    
    const roundedLat = Math.round(lat * 100000) / 100000;
    const roundedLng = Math.round(lng * 100000) / 100000;
    const key = `${roundedLat},${roundedLng}`;
    
    if (!coordinateGroups[key]) {
      coordinateGroups[key] = [];
    }
    coordinateGroups[key].push(property);
  });
  
  // Second pass: apply offsets to overlapping markers
  Object.values(coordinateGroups).forEach(group => {
    if (group.length <= 1) return; // No need to offset single properties
    
    // Calculate offsets in a circular pattern
    const offsetRadius = 0.0002; // About 22 meters
    const angleStep = (2 * Math.PI) / group.length;
    
    group.forEach((property, index) => {
      if (property.lat === null || property.lng === null || 
          property.lat === undefined || property.lng === undefined) {
        return;
      }
      
      // Skip the first property (keep it at the original position)
      if (index === 0) return;
      
      const angle = angleStep * index;
      const lat = typeof property.lat === 'string' ? parseFloat(property.lat) : property.lat;
      const lng = typeof property.lng === 'string' ? parseFloat(property.lng) : property.lng;
      
      // Apply offset in a circular pattern
      property.lat = lat + offsetRadius * Math.sin(angle);
      property.lng = lng + offsetRadius * Math.cos(angle);
    });
  });
  
  return result;
}

/**
 * Calculates the distance between two coordinates in meters
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Checks if two coordinates are very close to each other (within 10 meters)
 */
function areCoordinatesClose(
  lat1?: number | null,
  lng1?: number | null,
  lat2?: number | null,
  lng2?: number | null,
  threshold = 10 // meters
): boolean {
  if (!lat1 || !lng1 || !lat2 || !lng2) return false;
  
  return calculateDistance(lat1, lng1, lat2, lng2) < threshold;
}