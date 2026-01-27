-- Upgrade Souls table for Binding Flow
ALTER TABLE souls ADD COLUMN IF NOT EXISTS is_bound BOOLEAN DEFAULT FALSE;
ALTER TABLE souls ADD COLUMN IF NOT EXISTS owner_name TEXT;
-- Ensure device_id is unique or primary key for upsert
ALTER TABLE souls ADD CONSTRAINT unique_device_id UNIQUE (device_id);
