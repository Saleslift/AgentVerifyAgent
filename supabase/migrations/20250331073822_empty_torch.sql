/*
  # Add Property Coordinates and Features

  1. New Columns
    - `lat` (numeric) - Property latitude
    - `lng` (numeric) - Property longitude
    - `floor_plan_image` (text) - Floor plan image URL
    - `parking_available` (boolean) - Parking availability flag

  2. Constraints
    - Coordinates must be within UAE bounds
    - Coordinates must be valid numbers
    - Default false for parking_available

  3. Indexes
    - Create index for location-based queries
    - Create index for parking availability
*/

-- Add location coordinates if they don't exist
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS lat numeric,
ADD COLUMN IF NOT EXISTS lng numeric;

-- Add floor plan and parking if they don't exist
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS floor_plan_image text,
ADD COLUMN IF NOT EXISTS parking_available boolean DEFAULT false;

-- Create indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_properties_location_coords 
ON properties(lat, lng)
WHERE lat IS NOT NULL AND lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_parking 
ON properties(parking_available);

-- Create function to validate coordinates
CREATE OR REPLACE FUNCTION validate_property_location()
RETURNS trigger AS $$
BEGIN
  -- Validate coordinates are within UAE bounds
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    -- Check if coordinates are valid numbers
    IF NOT (
      NEW.lat::text ~ '^-?[0-9]+\.?[0-9]*$' AND
      NEW.lng::text ~ '^-?[0-9]+\.?[0-9]*$'
    ) THEN
      RAISE EXCEPTION 'Invalid coordinate format';
    END IF;

    -- Check if coordinates are within UAE bounds
    IF NEW.lat < 22.0 OR NEW.lat > 26.5 OR 
       NEW.lng < 51.0 OR NEW.lng > 56.5 THEN
      RAISE EXCEPTION 'Coordinates must be within UAE bounds';
    END IF;
  END IF;

  -- If only one coordinate is provided, both are required
  IF (NEW.lat IS NULL AND NEW.lng IS NOT NULL) OR
     (NEW.lat IS NOT NULL AND NEW.lng IS NULL) THEN
    RAISE EXCEPTION 'Both latitude and longitude must be provided';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for location validation
DROP TRIGGER IF EXISTS validate_property_location_trigger ON properties;
CREATE TRIGGER validate_property_location_trigger
  BEFORE INSERT OR UPDATE OF lat, lng ON properties
  FOR EACH ROW
  EXECUTE FUNCTION validate_property_location();

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
END $$;