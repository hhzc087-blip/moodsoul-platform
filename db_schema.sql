-- Create the souls table
CREATE TABLE IF NOT EXISTS souls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  name TEXT,
  current_mode TEXT CHECK (current_mode IN ('PET_MODE', 'MOOD_MODE')) DEFAULT 'PET_MODE',
  archetype TEXT DEFAULT 'toxic_cat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index on device_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_souls_device_id ON souls(device_id);

-- Enable Row Level Security (RLS)
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read/write for now (since we are using device_id as a key)
-- In a real production app, we would want stricter auth, but for this hardware prototype:
CREATE POLICY "Enable all access based on device_id" ON souls
FOR ALL
USING (true)
WITH CHECK (true);
