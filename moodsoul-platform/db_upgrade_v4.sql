-- Add Rate Limiting columns to souls table
ALTER TABLE souls ADD COLUMN IF NOT EXISTS daily_interactions_count INT DEFAULT 0;
ALTER TABLE souls ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE souls ADD COLUMN IF NOT EXISTS last_interaction_ts TIMESTAMP WITH TIME ZONE;
