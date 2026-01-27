-- 1. Update Personas Table (Soul Definitions)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS toxicity_level INT DEFAULT 50 CHECK (toxicity_level BETWEEN 0 AND 100);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS energy_level INT DEFAULT 50 CHECK (energy_level BETWEEN 0 AND 100);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS chaos_level INT DEFAULT 50 CHECK (chaos_level BETWEEN 0 AND 100);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS base_prompt_template TEXT;

-- 2. Update Souls Table (Active Devices)
ALTER TABLE souls ADD COLUMN IF NOT EXISTS birth_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- owner_id was already added in previous steps, ensuring it exists
ALTER TABLE souls ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id); 
ALTER TABLE souls ADD COLUMN IF NOT EXISTS location_lat FLOAT;
ALTER TABLE souls ADD COLUMN IF NOT EXISTS location_lng FLOAT;
ALTER TABLE souls ADD COLUMN IF NOT EXISTS social_battery INT DEFAULT 100 CHECK (social_battery BETWEEN 0 AND 100);

-- 3. New Table: Global Events (God Mode)
CREATE TABLE IF NOT EXISTS global_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    target_mode TEXT, -- e.g., 'ALL', 'PET', 'MOOD'
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 4. Enable Realtime
-- Note: This requires the 'supabase_realtime' publication to exist (default in Supabase)
ALTER PUBLICATION supabase_realtime ADD TABLE global_events;

-- 5. RLS Policies for Global Events (Optional but recommended)
ALTER TABLE global_events ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users (or devices)
CREATE POLICY "Public read access" ON global_events FOR SELECT USING (true);

-- Allow write access only to admins (you can refine this based on your auth roles)
-- For now, we assume service_role bypasses RLS, or you can add a specific admin policy.
