export interface Soul {
  id: string;
  device_id: string;
  name: string;
  current_mode: 'PET_MODE' | 'MOOD_MODE';
  archetype: string; // e.g., 'toxic_cat', 'mr_melty', 'gym_bro'
}
