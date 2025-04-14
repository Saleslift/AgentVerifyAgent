-- Create notifications table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications'
  ) THEN
    CREATE TABLE notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      type text NOT NULL CHECK (type IN ('system', 'alert', 'review', 'deal')),
      title text NOT NULL,
      message text NOT NULL,
      link_url text,
      is_read boolean DEFAULT false,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create agent_invitations table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'agent_invitations'
  ) THEN
    CREATE TABLE agent_invitations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL,
      agency_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      token text NOT NULL UNIQUE,
      status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'refused')),
      expires_at timestamptz NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create indexes for notifications if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_notifications_recipient_id'
  ) THEN
    CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_notifications_is_read'
  ) THEN
    CREATE INDEX idx_notifications_is_read ON notifications(is_read);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_notifications_created_at'
  ) THEN
    CREATE INDEX idx_notifications_created_at ON notifications(created_at);
  END IF;
END $$;

-- Create indexes for agent_invitations if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_agent_invitations_email'
  ) THEN
    CREATE INDEX idx_agent_invitations_email ON agent_invitations(email);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_agent_invitations_token'
  ) THEN
    CREATE INDEX idx_agent_invitations_token ON agent_invitations(token);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_agent_invitations_agency_id'
  ) THEN
    CREATE INDEX idx_agent_invitations_agency_id ON agent_invitations(agency_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_agent_invitations_status'
  ) THEN
    CREATE INDEX idx_agent_invitations_status ON agent_invitations(status);
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public can insert notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Agencies can manage invitations" ON agent_invitations;
  DROP POLICY IF EXISTS "Public can verify tokens" ON agent_invitations;
EXCEPTION
  WHEN undefined_object THEN
    -- Do nothing, policies don't exist yet
END $$;

-- Create notification policies
CREATE POLICY "Public can insert notifications"
  ON notifications
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Create agency invitation policies
CREATE POLICY "Agencies can manage invitations"
  ON agent_invitations
  FOR ALL
  TO authenticated
  USING (agency_id = auth.uid())
  WITH CHECK (agency_id = auth.uid());

CREATE POLICY "Public can verify tokens"
  ON agent_invitations
  FOR SELECT
  TO public
  USING (
    token = current_setting('app.current_token', true)
    AND status = 'pending'
    AND expires_at > now()
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_agent_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
      EXECUTE FUNCTION update_agent_invitations_updated_at();
  END IF;
END $$;

-- Create set_claim function
CREATE OR REPLACE FUNCTION set_claim(
  claim text,
  value text
)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.' || claim, value, true);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION set_claim(text, text) TO public;