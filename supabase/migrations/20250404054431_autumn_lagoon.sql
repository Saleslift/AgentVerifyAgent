/*
  # Fix CRM Foreign Key Relationships

  1. Changes
    - Check if constraints already exist before adding them
    - Add indexes for better query performance
    
  2. Security
    - No changes to RLS policies
*/

-- Check if the constraint already exists before adding it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'crm_agent_relations_contacted_agent_id_fkey'
  ) THEN
    -- Add the foreign key constraint if it doesn't exist
    ALTER TABLE crm_agent_relations
    ADD CONSTRAINT crm_agent_relations_contacted_agent_id_fkey
    FOREIGN KEY (contacted_agent_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'crm_blacklist_blocked_agent_id_fkey'
  ) THEN
    -- Add the foreign key constraint if it doesn't exist
    ALTER TABLE crm_blacklist
    ADD CONSTRAINT crm_blacklist_blocked_agent_id_fkey
    FOREIGN KEY (blocked_agent_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for better performance (these will be ignored if they already exist)
CREATE INDEX IF NOT EXISTS idx_crm_agent_relations_contacted_agent_id
ON crm_agent_relations(contacted_agent_id);

CREATE INDEX IF NOT EXISTS idx_crm_blacklist_blocked_agent_id
ON crm_blacklist(blocked_agent_id);