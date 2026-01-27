-- Add last_seen_at to souls table
ALTER TABLE souls ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;
