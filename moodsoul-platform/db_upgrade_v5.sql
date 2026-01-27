-- Add adoption_certificate_url to souls table
ALTER TABLE souls ADD COLUMN IF NOT EXISTS adoption_certificate_url TEXT;
