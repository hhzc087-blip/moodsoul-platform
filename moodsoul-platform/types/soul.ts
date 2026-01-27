export interface Soul {
  id: string;
  device_id: string;
  owner_id?: string;
  pairing_token?: string;
  current_mode: 'PET' | 'MOOD';
  archetype: string;
  voice_id: string;
  current_feature?: 'NONE' | 'POMODORO' | 'WOODEN_FISH' | 'FORTUNE' | 'TRUTH_DARE';
  current_app?: string; 
  app_data?: Record<string, any>;
  daily_interactions_count?: number;
  last_reset_date?: string; // Date string YYYY-MM-DD
  last_interaction_ts?: string; // ISO Timestamp
}
