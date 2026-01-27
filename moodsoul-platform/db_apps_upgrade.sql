-- Add App/Feature support to souls table
ALTER TABLE souls ADD COLUMN IF NOT EXISTS current_app TEXT DEFAULT 'IDLE'; -- e.g., 'POMODORO', 'WOODEN_FISH', 'FORTUNE'
ALTER TABLE souls ADD COLUMN IF NOT EXISTS app_data JSONB DEFAULT '{}'; -- Store state like { "fish_count": 0, "pomo_end": timestamp }
