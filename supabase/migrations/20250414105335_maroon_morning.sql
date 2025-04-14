/*
  # Add Agency-Agent Team Management Notification System

  1. New Tables
    - `agent_invitations` - Store agent invitation records
    - `notifications` - Store user notifications
    - `agency_agents` - Store agency-agent relationships

  2. Modifications
    - Add agency-related columns to profiles table
    - Add permissions for agency to send invitations to agents
    - Add ability for agents to accept/reject invitations
*/

-- Create agent_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  agency_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'refused')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  full_name text,
  phone text,
  whatsapp text
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('system', 'alert', 'review', 'deal', 'agency_invitation')),
  title text NOT NULL,
  message text NOT NULL,
  link_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  agency_id uuid REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create agency_agents table if it doesn't exist
CREATE TABLE IF NOT EXISTS agency_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, agent_id)
);

-- Add agency_id to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN agency_id uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Add agency-related columns to profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'agency_website'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN agency_website text,
    ADD COLUMN agency_email text,
    ADD COLUMN agency_formation_date date,
    ADD COLUMN agency_team_size integer;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE agent_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_agents ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_invitations_email ON agent_invitations(email);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_token ON agent_invitations(token);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_agency_id ON agent_invitations(agency_id);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_status ON agent_invitations(status);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_agency_agents_agency_id ON agency_agents(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_agents_agent_id ON agency_agents(agent_id);

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Agencies can manage invitations" ON agent_invitations;
  DROP POLICY IF EXISTS "Public can verify tokens" ON agent_invitations;
  
  DROP POLICY IF EXISTS "Public can insert notifications" ON notifications;
  DROP POLICY IF EXISTS "Service role can create notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
  
  DROP POLICY IF EXISTS "Agencies can manage their agents" ON agency_agents;
  DROP POLICY IF EXISTS "Agents can view their agency affiliations" ON agency_agents;
  DROP POLICY IF EXISTS "Only agencies can manage agents" ON agency_agents;
EXCEPTION
  WHEN undefined_object THEN
    -- Do nothing, policies don't exist yet
END $$;

-- Create policies for agent_invitations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_invitations' AND policyname = 'Agencies can manage invitations'
  ) THEN
    CREATE POLICY "Agencies can manage invitations"
      ON agent_invitations
      FOR ALL
      TO authenticated
      USING (agency_id = auth.uid())
      WITH CHECK (agency_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_invitations' AND policyname = 'Public can verify tokens'
  ) THEN
    CREATE POLICY "Public can verify tokens"
      ON agent_invitations
      FOR SELECT
      TO public
      USING (
        token = current_setting('app.current_token', true)
        AND status = 'pending'
        AND expires_at > now()
      );
  END IF;
END $$;

-- Create policies for notifications
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Public can insert notifications'
  ) THEN
    CREATE POLICY "Public can insert notifications"
      ON notifications
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Service role can create notifications'
  ) THEN
    CREATE POLICY "Service role can create notifications"
      ON notifications
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Users can read their own notifications'
  ) THEN
    CREATE POLICY "Users can read their own notifications"
      ON notifications
      FOR SELECT
      TO authenticated
      USING (recipient_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications'
  ) THEN
    CREATE POLICY "Users can update their own notifications"
      ON notifications
      FOR UPDATE
      TO authenticated
      USING (recipient_id = auth.uid())
      WITH CHECK (recipient_id = auth.uid());
  END IF;
END $$;

-- Create policies for agency_agents
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agency_agents' AND policyname = 'Agencies can manage their agents'
  ) THEN
    CREATE POLICY "Agencies can manage their agents"
      ON agency_agents
      FOR ALL
      TO authenticated
      USING (agency_id = auth.uid())
      WITH CHECK (agency_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agency_agents' AND policyname = 'Agents can view their agency affiliations'
  ) THEN
    CREATE POLICY "Agents can view their agency affiliations"
      ON agency_agents
      FOR SELECT
      TO authenticated
      USING (agent_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agency_agents' AND policyname = 'Only agencies can manage agents'
  ) THEN
    CREATE POLICY "Only agencies can manage agents"
      ON agency_agents
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'agency'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'agency'
        )
      );
  END IF;
END $$;

-- Create trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_agent_invitations_updated_at'
  ) THEN
    CREATE TRIGGER update_agent_invitations_updated_at
      BEFORE UPDATE ON agent_invitations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_agency_agents_updated_at'
  ) THEN
    CREATE TRIGGER update_agency_agents_updated_at
      BEFORE UPDATE ON agency_agents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create function to generate a random token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer := 0;
  rand_idx integer;
BEGIN
  -- Generate a random token
  FOR i IN 1..32 LOOP
    -- Get a random index into the chars string
    rand_idx := floor(random() * length(chars)) + 1;
    -- Append the character at that index to the result
    result := result || substr(chars, rand_idx, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create function to create an agent invitation
CREATE OR REPLACE FUNCTION create_agent_invitation(
  p_email text,
  p_agency_id uuid,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_whatsapp text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
  v_invitation_id uuid;
  v_agency_name text;
BEGIN
  -- Validate email
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  -- Get agency name for notification
  SELECT COALESCE(agency_name, full_name) INTO v_agency_name
  FROM profiles
  WHERE id = p_agency_id;
  
  -- Generate token
  SELECT generate_invitation_token() INTO v_token;
  
  -- Create invitation
  INSERT INTO agent_invitations (
    email,
    agency_id,
    token,
    status,
    expires_at,
    full_name,
    phone,
    whatsapp
  ) VALUES (
    p_email,
    p_agency_id,
    v_token,
    'pending',
    now() + interval '7 days',
    p_full_name,
    p_phone,
    p_whatsapp
  )
  RETURNING id INTO v_invitation_id;
  
  -- Create notification
  -- Check if there's already a user with this email
  DECLARE
    v_user_id uuid;
  BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;
    
    IF v_user_id IS NOT NULL THEN
      -- Create notification for the user
      INSERT INTO notifications (
        recipient_id,
        type,
        title,
        message,
        link_url,
        is_read,
        created_at,
        agency_id
      ) VALUES (
        v_user_id,
        'agency_invitation',
        'Agency Invitation',
        v_agency_name || ' has invited you to join their team',
        '/accept?agency_id=' || p_agency_id::text || '&token=' || v_token,
        false,
        now(),
        p_agency_id
      );
    END IF;
  END;
  
  RETURN v_invitation_id;
END;
$$;

-- Create function to create sample notifications for new users
CREATE OR REPLACE FUNCTION create_sample_notifications_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := NEW.id;
  
  -- Create welcome notification
  INSERT INTO notifications (
    recipient_id,
    type,
    title,
    message,
    is_read,
    created_at
  ) VALUES (
    v_user_id,
    'system',
    'Welcome to AgentVerify',
    'Thank you for joining our platform. Complete your profile to get started.',
    false,
    now()
  );
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_sample_notifications_trigger ON auth.users;

-- Create trigger to create sample notifications
CREATE TRIGGER create_sample_notifications_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_sample_notifications_for_new_user();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_agent_invitation(text, uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invitation_token() TO authenticated;