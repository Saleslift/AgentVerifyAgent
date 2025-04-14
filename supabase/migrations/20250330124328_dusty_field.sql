-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "agent_marketplace_additions_policy" ON agent_properties;
  DROP POLICY IF EXISTS "agent_property_management_policy" ON agent_properties;
  DROP POLICY IF EXISTS "agent_property_viewing_policy" ON agent_properties;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE agent_properties ENABLE ROW LEVEL SECURITY;

-- Create policy for marketplace property additions
CREATE POLICY "agent_marketplace_additions_policy"
ON agent_properties
FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if the property exists and is shared
  EXISTS (
    SELECT 1 FROM properties
    WHERE id = property_id
    AND shared = true
  )
  -- Ensure agent is adding for themselves
  AND agent_id = auth.uid()
);

-- Create policy for property management
CREATE POLICY "agent_property_management_policy"
ON agent_properties
FOR ALL
TO authenticated
USING (
  -- Agent can manage their own properties
  agent_id = auth.uid()
)
WITH CHECK (
  -- Agent can only modify their own properties
  agent_id = auth.uid()
);

-- Create policy for property viewing
CREATE POLICY "agent_property_viewing_policy"
ON agent_properties
FOR SELECT
TO authenticated
USING (
  -- Can view if agent is involved
  agent_id = auth.uid()
  OR
  -- Can view if property is shared
  EXISTS (
    SELECT 1 FROM properties
    WHERE id = property_id
    AND shared = true
  )
);

-- Create function to check for duplicate properties
CREATE OR REPLACE FUNCTION check_duplicate_property()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM agent_properties
    WHERE property_id = NEW.property_id
    AND agent_id = NEW.agent_id
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Property is already in your listings';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicates
DROP TRIGGER IF EXISTS prevent_duplicate_properties ON agent_properties;
CREATE TRIGGER prevent_duplicate_properties
  BEFORE INSERT ON agent_properties
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_property();

-- Grant necessary permissions
GRANT ALL ON agent_properties TO authenticated;