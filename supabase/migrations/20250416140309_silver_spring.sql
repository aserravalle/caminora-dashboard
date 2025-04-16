/*
  # Add operative number sequence and constraint

  1. Changes
    - Add unique constraint for operative_number + organisation_id
    - Create function to generate sequential operative numbers per organization
    - Create trigger to automatically set operative_number on insert

  2. Details
    - Operative numbers follow format "O-XXX" where XXX is a sequential number
    - Numbers are organization-scoped (each org starts from 001)
    - Numbers are padded to 3 digits (e.g., O-001, O-012, O-123)
*/

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