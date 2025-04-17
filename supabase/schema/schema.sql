/*
    ##########
    # TABLES #
    ##########
*/

-- Organisations Table
CREATE TABLE public.organisations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Locations Table
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  name TEXT NOT NULL,
  address TEXT,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Operative Types Table
CREATE TABLE public.operative_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  name VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Operatives Table
CREATE TABLE public.operatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  location_id UUID NOT NULL REFERENCES public.locations(id),
  operative_type_id UUID NOT NULL REFERENCES public.operative_types(id),
  first_name VARCHAR NOT NULL,
  last_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  operative_number VARCHAR NOT NULL,
  default_start_time TIME NOT NULL DEFAULT '09:00:00',
  default_end_time TIME NOT NULL DEFAULT '18:00:00',
  default_days_available CHAR(7) NOT NULL DEFAULT '1111100',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  location_id UUID NOT NULL REFERENCES public.locations(id),
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  is_admin BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/*
    #############
    # FUNCTIONS #
    #############
*/

-- Function to create user organization during signup
CREATE OR REPLACE FUNCTION public.create_user_with_org_and_location(
  p_user_id UUID, 
  p_first_name TEXT, 
  p_last_name TEXT, 
  p_email TEXT, 
  p_phone TEXT, 
  p_org_name TEXT, 
  p_location_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
  v_location_id UUID;
BEGIN
  -- Create organization first
  INSERT INTO public.organisations (name)
  VALUES (p_org_name)
  RETURNING id INTO v_org_id;
  
  -- Then create location with the organization ID
  INSERT INTO public.locations (name, organisation_id)
  VALUES (p_location_name, v_org_id)
  RETURNING id INTO v_location_id;
  
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    -- Update existing profile
    UPDATE public.profiles
    SET
      first_name = p_first_name,
      last_name = p_last_name,
      email = p_email,
      phone = CASE WHEN p_phone = '' THEN NULL ELSE p_phone END,
      organisation_id = v_org_id,
      location_id = v_location_id
    WHERE id = p_user_id;
  ELSE
    -- Create new profile
    INSERT INTO public.profiles (
      id, first_name, last_name, email, phone, organisation_id, location_id
    ) VALUES (
      p_user_id, 
      p_first_name, 
      p_last_name, 
      p_email, 
      CASE WHEN p_phone = '' THEN NULL ELSE p_phone END,
      v_org_id, 
      v_location_id
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in create_user_organization: %', SQLERRM;
END;
$$;

-- First ensure operative_number and organisation_id combination is unique
ALTER TABLE operatives
ADD CONSTRAINT operatives_number_org_unique UNIQUE (operative_number, organisation_id);

-- Create function to generate the next operative number for an organization
CREATE OR REPLACE FUNCTION generate_operative_number(org_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_number integer;
BEGIN
  -- Get the current highest number for this organization
  SELECT COALESCE(
    MAX(
      NULLIF(
        REGEXP_REPLACE(operative_number, '^O-(\d+)$', '\1'),
        ''
      )::integer
    ),
    0
  ) + 1
  INTO next_number
  FROM operatives
  WHERE organisation_id = org_id;

  -- Return formatted number (O-XXX)
  RETURN 'O-' || LPAD(next_number::text, 3, '0');
END;
$$;

-- Create trigger to automatically set operative_number on insert
CREATE OR REPLACE FUNCTION set_operative_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set operative_number if it's not already set
  IF NEW.operative_number IS NULL THEN
    NEW.operative_number := generate_operative_number(NEW.organisation_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_operative_number_trigger
BEFORE INSERT ON operatives
FOR EACH ROW
EXECUTE FUNCTION set_operative_number();

/*
    ############
    # POLICIES #
    ############
*/

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