export type TrainingDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  mail: string | null;
  goal: string | null;
  goal_description: string | null;
  timezone: string | null;
  training_days: TrainingDay[];
  onboarding_complete: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};
