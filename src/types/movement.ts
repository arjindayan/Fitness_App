export type MovementDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type MovementEquipment =
  | 'barbell'
  | 'dumbbell'
  | 'bodyweight'
  | 'machine'
  | 'cable'
  | 'kettlebell'
  | 'band'
  | 'other';

export type Movement = {
  id: string;
  name: string;
  category_id: string | null;
  equipment: MovementEquipment | null;
  difficulty: MovementDifficulty | null;
  instructions: string | null;
  video_url: string | null;
  is_custom: boolean;
  owner_id: string | null;
  created_at?: string;
  updated_at?: string;
};

export type MovementCategory = {
  id: string;
  name: string;
  icon?: string | null;
};
