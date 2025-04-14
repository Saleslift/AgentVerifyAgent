/*
  # Fix RLS policies for developer_agency_contracts table

  1. Changes
     - Updates the policy for agencies to properly view and update their contracts
     - Ensures agencies can update all relevant document URLs in their collaboration contracts
     - Fixes permission issues when uploading documents

  2. Security
     - Maintains proper row-level security
     - Only allows agencies to update their own contracts
     - Ensures developers still have appropriate access
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Agencies can update their contracts" ON developer_agency_contracts;

-- Create a new, more permissive policy that allows agencies to update the document URLs
CREATE POLICY "Agencies can update their own contracts" 
ON developer_agency_contracts
FOR UPDATE
TO authenticated
USING (agency_id = auth.uid())
WITH CHECK (agency_id = auth.uid());

-- Ensure the SELECT policy allows agencies to view their contracts
DROP POLICY IF EXISTS "Agencies can view their contracts" ON developer_agency_contracts;
CREATE POLICY "Agencies can view their contracts" 
ON developer_agency_contracts
FOR SELECT
TO authenticated
USING (agency_id = auth.uid());