-- V3.0 Upgrade: Soul DNA & Community Features
ALTER TABLE personas ADD COLUMN IF NOT EXISTS zodiac_sign TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS mbti_type TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS core_emotion TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS catchphrase TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
-- Rename previous sliders to match new spec (or map them logically)
-- Sassiness -> Toxicity, Empathy -> Energy (Inverse?), Chaos -> Chaos
-- We will keep existing columns but map them in UI/API for backward compatibility or clarity.
-- UI: Sassiness -> toxicity_level
-- UI: Empathy -> energy_level (We might need a new column if logic differs, but reusing is fine for MVP)
-- UI: Chaos -> chaos_level
