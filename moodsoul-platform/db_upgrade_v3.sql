-- Add pairing_token to souls table for secure binding
ALTER TABLE souls ADD COLUMN IF NOT EXISTS pairing_token TEXT;
