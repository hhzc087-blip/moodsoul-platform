-- Update Personas Table for Community Features
ALTER TABLE personas ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS downloads_count INT DEFAULT 0;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS keywords TEXT[]; -- Array of strings for tags
