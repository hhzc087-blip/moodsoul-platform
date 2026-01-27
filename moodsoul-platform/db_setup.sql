-- Create the souls table
CREATE TABLE IF NOT EXISTS souls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  name TEXT,
  current_mode TEXT CHECK (current_mode IN ('PET', 'MOOD')) DEFAULT 'PET',
  archetype TEXT DEFAULT 'toxic_cat',
  voice_id TEXT DEFAULT 'BV001_streaming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index on device_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_souls_device_id ON souls(device_id);

-- Enable Row Level Security (RLS)
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read/write based on device_id
-- In production, you'd want proper authentication, but for this hardware prototype:
CREATE POLICY "Enable public access based on device_id" ON souls
FOR ALL
USING (true)
WITH CHECK (true);
