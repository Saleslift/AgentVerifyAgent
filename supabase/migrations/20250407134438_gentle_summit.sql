/*
  # Fix developer_agency_contracts RLS policies

  1. Changes
     - Update the policy for agencies to view contracts
     - Fix the `UPDATE` policy for agencies to correctly handle field changes
  
  This fixes the 403 error when accessing developer_agency_contracts
*/

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Agencies can view their contracts" ON public.developer_agency_contracts;
DROP POLICY IF EXISTS "Agencies can update their contracts" ON public.developer_agency_contracts;

-- Create fixed SELECT policy for agencies
CREATE POLICY "Agencies can view their contracts" 
ON public.developer_agency_contracts
FOR SELECT 
TO authenticated
USING (agency_id = auth.uid());

-- Create fixed UPDATE policy for agencies
CREATE POLICY "Agencies can update their contracts" 
ON public.developer_agency_contracts
FOR UPDATE
TO authenticated
USING (agency_id = auth.uid())
WITH CHECK (
  agency_id = auth.uid() AND
  (
    developer_id = developer_id AND 
    agency_id = agency_id AND 
    status = status AND
    developer_contract_url = developer_contract_url
  )
);