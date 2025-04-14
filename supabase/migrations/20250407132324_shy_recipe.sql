/*
  # Fix Developer Agency Contracts Permissions

  1. Changes
    - Update RLS policies for developer_agency_contracts table
    - Add missing policy for agency users to insert collaboration requests
    - Fix permissions for document uploads
  
  2. Security
    - Maintain data integrity
    - Ensure proper access control with specific permissions
*/

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Agencies can view their contracts" ON developer_agency_contracts;
  DROP POLICY IF EXISTS "Agencies can update their contracts" ON developer_agency_contracts;
  DROP POLICY IF EXISTS "Developers can manage their contracts" ON developer_agency_contracts;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Enable RLS on developer_agency_contracts table
ALTER TABLE developer_agency_contracts ENABLE ROW LEVEL SECURITY;

-- Create complete set of policies for developer_agency_contracts

-- 1. Agencies can create collaboration requests
CREATE POLICY "Agencies can create collaboration requests"
  ON developer_agency_contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agency_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'agency'
    )
  );

-- 2. Agencies can view their own collaboration requests
CREATE POLICY "Agencies can view their contracts"
  ON developer_agency_contracts
  FOR SELECT
  TO authenticated
  USING (agency_id = auth.uid());

-- 3. Agencies can update their own contracts (limited fields)
CREATE POLICY "Agencies can update their contracts"
  ON developer_agency_contracts
  FOR UPDATE
  TO authenticated
  USING (agency_id = auth.uid())
  WITH CHECK (
    agency_id = auth.uid() AND
    (
      -- Agencies can only update specific fields
      (
        agency_license_url IS DISTINCT FROM developer_agency_contracts.agency_license_url OR
        agency_signed_contract_url IS DISTINCT FROM developer_agency_contracts.agency_signed_contract_url OR
        agency_registration_url IS DISTINCT FROM developer_agency_contracts.agency_registration_url
      ) AND
      -- Agencies cannot change these fields
      developer_id = developer_agency_contracts.developer_id AND
      agency_id = developer_agency_contracts.agency_id AND
      status = developer_agency_contracts.status AND
      developer_contract_url = developer_agency_contracts.developer_contract_url
    )
  );

-- 4. Developers can manage their collaboration contracts
CREATE POLICY "Developers can manage their contracts"
  ON developer_agency_contracts
  FOR ALL
  TO authenticated
  USING (developer_id = auth.uid())
  WITH CHECK (developer_id = auth.uid());

-- Create or update storage policies for agency-contracts bucket
DO $$
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Developers can upload and manage contract documents" ON storage.objects;
  DROP POLICY IF EXISTS "Agencies can view their contract documents" ON storage.objects;
  DROP POLICY IF EXISTS "Agencies can upload their contract documents" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies for agency-contracts storage bucket
CREATE POLICY "Developers can upload and manage contract documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'agency-contracts' AND
  (
    -- Developer can manage files they uploaded (first folder segment is developer ID)
    auth.uid()::text = SPLIT_PART(name, '/', 1)
  )
)
WITH CHECK (
  bucket_id = 'agency-contracts' AND
  (
    -- Developer can manage files they uploaded (first folder segment is developer ID)
    auth.uid()::text = SPLIT_PART(name, '/', 1)
  )
);

CREATE POLICY "Agencies can view their contract documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agency-contracts' AND
  (
    -- Agency can view files where they are referenced (second folder segment is agency ID)
    auth.uid()::text = SPLIT_PART(name, '/', 2)
  )
);

CREATE POLICY "Agencies can upload their contract documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agency-contracts' AND
  (
    -- Agency can upload documents related to them (they must be in path)
    auth.uid()::text = SPLIT_PART(name, '/', 2) OR
    SPLIT_PART(name, '_', 2) = auth.uid()::text
  )
);