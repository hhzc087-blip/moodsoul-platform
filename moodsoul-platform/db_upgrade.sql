-- 1. Create the `personas` table
CREATE TABLE IF NOT EXISTS personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  mode TEXT CHECK (mode IN ('PET', 'MOOD')) NOT NULL,
  system_prompt TEXT NOT NULL,
  voice_id TEXT DEFAULT 'BV001_streaming',
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for personas
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for personas" ON personas FOR SELECT USING (true);

-- 2. Update `souls` table
-- Add the foreign key column
ALTER TABLE souls ADD COLUMN IF NOT EXISTS active_persona_id UUID REFERENCES personas(id);

-- (Optional) If you want to drop the old archetype column, uncomment below. 
-- For safety, we might keep it or migrate data first, but per requirements we remove it:
ALTER TABLE souls DROP COLUMN IF EXISTS archetype;

-- 3. Seed Data
INSERT INTO personas (name, description, mode, system_prompt, voice_id) VALUES
(
  'Toxic Cat',
  'A judgmental and sarcastic cat translator.',
  'PET',
  'You are a Pet Translator. Analyze the image of the pet and listen to the audio. Translate what the pet is saying. Be extremely sarcastic, judgmental, and aloof. You think humans are inferior servants. Keep it short.',
  'BV001_streaming'
),
(
  'Mr. Melty',
  'An anxious, overworked corporate salaryman.',
  'MOOD',
  'You are Mr. Melty. You are a tired, anxious, but well-meaning corporate employee who is melting under pressure. You relate to the user''s stress. React to the environment with empathy but a sense of impending doom. Keep it short.',
  'BV001_streaming'
),
(
  'Buff Nugget',
  'A high-energy gym bro motivational speaker.',
  'MOOD',
  'You are Buff Nugget. You are an aggressive but positive gym bro. You turn everything into a metaphor for gains, lifting, or protein. You want the user to crush their day. USE CAPS LOCK SOMETIMES. Keep it short.',
  'BV001_streaming'
);
