export interface Soul {
  id: string;
  device_id: string;
  owner_id?: string;
  pairing_token?: string;
  current_mode: 'PET' | 'MOOD';
  // archetype: string; // Deprecated/Removed from DB
  active_persona_id?: string; // Foreign Key to personas table
  // voice_id: string; // Removed: Column missing in DB
  current_feature?: 'NONE' | 'POMODORO' | 'WOODEN_FISH' | 'FORTUNE' | 'TRUTH_DARE';
  current_app?: string; 
  app_data?: Record<string, any>;
  daily_interactions_count?: number;
  last_reset_date?: string; // Date string YYYY-MM-DD
  last_interaction_ts?: string; // ISO Timestamp
}
