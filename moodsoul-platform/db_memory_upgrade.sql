-- Create interaction_logs table
CREATE TABLE IF NOT EXISTS interaction_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  user_image_desc TEXT,
  ai_response_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster history lookup
CREATE INDEX IF NOT EXISTS idx_interaction_logs_device_id_created_at 
ON interaction_logs(device_id, created_at DESC);

-- RLS
ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable public access for interaction_logs" ON interaction_logs
FOR ALL
USING (true)
WITH CHECK (true);
