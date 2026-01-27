-- Update souls table for Feature Capsules
ALTER TABLE souls ADD COLUMN IF NOT EXISTS current_feature TEXT DEFAULT 'NONE'; 
-- Valid values: 'NONE', 'POMODORO', 'WOODEN_FISH', 'FORTUNE', 'TRUTH_DARE'
