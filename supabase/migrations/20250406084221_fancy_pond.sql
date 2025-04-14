/*
  # Fix Developer Role Assignment

  1. Changes
    - Fix the issue with developer role assignment
    - Ensure developer_details is properly initialized
    - Update existing users with proper developer role
    - Generate slugs for developer profiles
  
  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved handle_new_user function with better role handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_full_name text;
  v_company_details jsonb;
  v_developer_details jsonb;
  v_metadata jsonb;
BEGIN
  -- Log the start of the function
  RAISE LOG 'handle_new_user: Starting for user %', NEW.id;
  
  -- Safely cast raw_user_meta_data to jsonb with fallback
  BEGIN
    v_metadata := COALESCE(NEW.raw_user_meta_data::jsonb, '{}'::jsonb);
    RAISE LOG 'handle_new_user: Metadata for user %: %', NEW.id, v_metadata;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Invalid metadata format for user %: %', NEW.id, NEW.raw_user_meta_data;
    v_metadata := '{}'::jsonb;
  END;
  
  -- Extract role with validation - CRITICAL FIX: Properly check for developer role
  v_role := COALESCE(v_metadata->>'role', 'agent');
  
  -- Log the detected role
  RAISE LOG 'handle_new_user: Detected role for user %: %', NEW.id, v_role;
  
  -- Validate role
  IF v_role NOT IN ('agent', 'agency', 'developer') THEN
    RAISE LOG 'handle_new_user: Invalid role % for user %, defaulting to agent', v_role, NEW.id;
    v_role := 'agent';
  END IF;

  -- Set full name based on role
  CASE v_role
    WHEN 'agent' THEN
      v_full_name := NULLIF(TRIM(
        COALESCE(v_metadata->>'firstName', '') || ' ' || 
        COALESCE(v_metadata->>'lastName', '')
      ), ' ');
      
    WHEN 'agency' THEN
      v_full_name := NULLIF(TRIM(COALESCE(v_metadata->>'companyName', '')), '');
      
    WHEN 'developer' THEN
      -- CRITICAL FIX: Properly handle developer company name
      v_full_name := NULLIF(TRIM(COALESCE(v_metadata->>'developerCompanyName', '')), '');
      RAISE LOG 'handle_new_user: Setting developer name to: %', v_full_name;
  END CASE;

  -- Set company details for agency
  IF v_role = 'agency' THEN
    v_company_details := jsonb_build_object(
      'name', v_metadata->>'companyName',
      'registration_number', v_metadata->>'companyRegNumber',
      'address', v_metadata->>'companyAddress',
      'phone', v_metadata->>'agencyPhone'
    );
  END IF;

  -- Set developer details
  IF v_role = 'developer' THEN
    -- CRITICAL FIX: Properly build developer_details object
    v_developer_details := jsonb_build_object(
      'company_name', COALESCE(v_metadata->>'developerCompanyName', v_full_name),
      'company_address', COALESCE(v_metadata->>'developerCompanyAddress', 'Dubai, UAE')
    );
    RAISE LOG 'handle_new_user: Setting developer details: %', v_developer_details;
  END IF;

  -- Insert profile with retry logic
  FOR i IN 1..3 LOOP
    BEGIN
      -- Check if profile already exists
      IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
        -- Update existing profile
        UPDATE profiles
        SET
          email = NEW.email,
          full_name = COALESCE(v_full_name, NEW.email),
          role = v_role, -- CRITICAL FIX: Ensure role is set correctly
          company_details = v_company_details,
          developer_details = v_developer_details,
          updated_at = NOW(),
          whatsapp = CASE 
            WHEN v_role = 'agent' THEN COALESCE(v_metadata->>'whatsapp', v_metadata->>'phone')
            WHEN v_role = 'agency' THEN COALESCE(v_metadata->>'agencyWhatsapp', v_metadata->>'agencyPhone')
            WHEN v_role = 'developer' THEN COALESCE(v_metadata->>'developerWhatsapp', v_metadata->>'developerPhone')
            ELSE NULL
          END,
          registration_number = CASE 
            WHEN v_role = 'agent' THEN v_metadata->>'brokerNumber'
            WHEN v_role = 'agency' THEN v_metadata->>'companyRegNumber'
            ELSE NULL
          END
        WHERE id = NEW.id;
        
        RAISE LOG 'handle_new_user: Updated existing profile for user % with role %', NEW.id, v_role;
      ELSE
        -- Create new profile
        INSERT INTO profiles (
          id,
          email,
          full_name,
          role,
          company_details,
          developer_details,
          created_at,
          updated_at,
          whatsapp,
          registration_number
        )
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(v_full_name, NEW.email),
          v_role, -- CRITICAL FIX: Ensure role is set correctly
          v_company_details,
          v_developer_details,
          NOW(),
          NOW(),
          CASE 
            WHEN v_role = 'agent' THEN COALESCE(v_metadata->>'whatsapp', v_metadata->>'phone')
            WHEN v_role = 'agency' THEN COALESCE(v_metadata->>'agencyWhatsapp', v_metadata->>'agencyPhone')
            WHEN v_role = 'developer' THEN COALESCE(v_metadata->>'developerWhatsapp', v_metadata->>'developerPhone')
            ELSE NULL
          END,
          CASE 
            WHEN v_role = 'agent' THEN v_metadata->>'brokerNumber'
            WHEN v_role = 'agency' THEN v_metadata->>'companyRegNumber'
            ELSE NULL
          END
        );
        
        RAISE LOG 'handle_new_user: Created new profile for user % with role %', NEW.id, v_role;
      END IF;
      
      -- Create agent referrals if needed
      IF v_role = 'agent' AND 
         v_metadata->>'referral1Name' IS NOT NULL AND 
         v_metadata->>'referral1Contact' IS NOT NULL THEN
        
        -- Check if referrals already exist
        IF NOT EXISTS (SELECT 1 FROM agent_referrals WHERE agent_id = NEW.id) THEN
          INSERT INTO agent_referrals (
            agent_id,
            referral_name,
            referral_contact,
            status
          ) VALUES 
          (
            NEW.id,
            v_metadata->>'referral1Name',
            v_metadata->>'referral1Contact',
            'pending'
          ),
          (
            NEW.id,
            COALESCE(v_metadata->>'referral2Name', 'Referral 2'),
            COALESCE(v_metadata->>'referral2Contact', 'contact2@example.com'),
            'pending'
          ),
          (
            NEW.id,
            COALESCE(v_metadata->>'referral3Name', 'Referral 3'),
            COALESCE(v_metadata->>'referral3Contact', 'contact3@example.com'),
            'pending'
          );
          
          RAISE LOG 'handle_new_user: Created referrals for agent %', NEW.id;
        END IF;
      END IF;
      
      EXIT; -- Exit loop if successful
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: Error creating profile for user % (attempt %/3): %', NEW.id, i, SQLERRM;
      
      IF i = 3 THEN 
        RAISE LOG 'handle_new_user: Failed to create profile after 3 attempts for user %: %', NEW.id, SQLERRM;
      ELSE
        PERFORM pg_sleep(0.5); -- Wait before retry
      END IF;
    END;
  END LOOP;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user: Unexpected error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Fix existing users who signed up as developers but got assigned as agents
UPDATE profiles p
SET 
  role = 'developer',
  developer_details = CASE 
    WHEN developer_details IS NULL OR developer_details = '{}'::jsonb THEN 
      jsonb_build_object(
        'company_name', full_name,
        'company_address', COALESCE(location, 'Dubai, UAE')
      )
    ELSE 
      developer_details
    END,
  updated_at = now()
WHERE 
  id IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'developer'
  )
  AND role = 'agent';

-- Generate slugs for developer profiles that don't have one
UPDATE profiles
SET 
  slug = generate_agent_slug(full_name, id)
WHERE 
  role = 'developer' 
  AND slug IS NULL;

-- Log the changes
DO $$ 
DECLARE
  fixed_count int;
BEGIN
  SELECT COUNT(*) INTO fixed_count 
  FROM profiles 
  WHERE role = 'developer';
  
  RAISE NOTICE 'Fixed % developer profiles', fixed_count;
END $$;