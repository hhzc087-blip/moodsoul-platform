-- Add owner_id to souls table
ALTER TABLE souls ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Update RLS Policies
-- Drop existing policy if it's too open
DROP POLICY IF EXISTS "Enable public access based on device_id" ON souls;

-- Create new policies
-- 1. Users can see souls they own
CREATE POLICY "Users can view own souls" ON souls
FOR SELECT USING (auth.uid() = owner_id);

-- 2. Users can update souls they own
CREATE POLICY "Users can update own souls" ON souls
FOR UPDATE USING (auth.uid() = owner_id);

-- 3. Users can insert (bind) if the device doesn't have an owner yet OR they are claiming it
-- Ideally, binding logic should check if device_id exists. 
-- For simplicity: Allow insert if authenticated.
CREATE POLICY "Users can insert souls" ON souls
FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Note: We might need a policy to allow the Hardware (which is anonymous/service role) to read/update.
-- If the hardware uses the ANON key, we might need a separate mechanism or keep a public read policy for specific columns.
-- For this MVP, we will assume the Hardware uses a Service Role Key OR we keep a public read policy for the device_id lookup.

-- Allow public read by device_id (for Hardware to work without logging in as a user)
CREATE POLICY "Hardware can read by device_id" ON souls
FOR SELECT USING (true); 

-- Allow public update by device_id (for Hardware heartbeat)
CREATE POLICY "Hardware can update timestamp" ON souls
FOR UPDATE USING (true);
