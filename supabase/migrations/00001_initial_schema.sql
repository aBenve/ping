-- Ping App Database Schema
-- Initial migration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE alert_status AS ENUM ('active', 'completed', 'fallback_triggered', 'cancelled');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_trusted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contact_id),
  CHECK (user_id != contact_id)
);

-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  destination_name TEXT NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  destination_radius INTEGER DEFAULT 100,
  fallback_minutes INTEGER NOT NULL,
  fallback_at TIMESTAMPTZ NOT NULL,
  status alert_status DEFAULT 'active',
  triggered_at TIMESTAMPTZ,
  last_known_lat DOUBLE PRECISION,
  last_known_lng DOUBLE PRECISION,
  last_known_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert recipients table
CREATE TABLE alert_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ,
  UNIQUE(alert_id, recipient_id)
);

-- Requests table
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  destination_name TEXT,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  message TEXT,
  status request_status DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  created_alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CHECK (from_user_id != to_user_id)
);

-- Indexes for performance
CREATE INDEX idx_alerts_user_status ON alerts(user_id, status);
CREATE INDEX idx_alerts_fallback ON alerts(fallback_at) WHERE status = 'active';
CREATE INDEX idx_contacts_user ON contacts(user_id);
CREATE INDEX idx_requests_to_user ON requests(to_user_id, status);
CREATE INDEX idx_alert_recipients_alert ON alert_recipients(alert_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Permitir a todos los usuarios autenticados buscar perfiles (necesario para agregar contactos)
CREATE POLICY "Authenticated users can search profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Contacts policies
CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Alerts policies
CREATE POLICY "Users can view their own alerts"
  ON alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view alerts they are recipients of"
  ON alerts FOR SELECT
  USING (
    id IN (
      SELECT alert_id FROM alert_recipients WHERE recipient_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own alerts"
  ON alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON alerts FOR UPDATE
  USING (auth.uid() = user_id);

-- Alert recipients policies
CREATE POLICY "Users can view recipients of their alerts"
  ON alert_recipients FOR SELECT
  USING (
    alert_id IN (SELECT id FROM alerts WHERE user_id = auth.uid())
    OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can insert recipients to their alerts"
  ON alert_recipients FOR INSERT
  WITH CHECK (
    alert_id IN (SELECT id FROM alerts WHERE user_id = auth.uid())
  );

-- Requests policies
CREATE POLICY "Users can view requests they sent"
  ON requests FOR SELECT
  USING (auth.uid() = from_user_id);

CREATE POLICY "Users can view requests sent to them"
  ON requests FOR SELECT
  USING (auth.uid() = to_user_id);

CREATE POLICY "Users can insert requests"
  ON requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update requests sent to them"
  ON requests FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
