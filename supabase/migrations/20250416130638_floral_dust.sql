/*
  # Add RLS policies for profile management

  1. Security Changes
    - Enable RLS on organisations and profiles tables
    - Add policies for users to read and update their own profile
    - Add policies for users to read and update their organization if admin

  2. Changes
    - Add RLS policies for profile management
    - Add RLS policies for organization management
*/

-- Enable RLS
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Organizations policies
CREATE POLICY "Users can read their organization"
  ON organisations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organisation_id 
      FROM profiles 
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Admin users can update their organization"
  ON organisations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organisation_id 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND is_admin = true
    )
  );