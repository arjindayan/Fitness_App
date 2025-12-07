import { supabase } from '../lib/supabase';
import { Profile, TrainingDay } from '../types/profile';

export type ProfileInput = {
  displayName: string;
  email: string;
  goal: string;
  goalDescription?: string;
  timezone: string;
  trainingDays: TrainingDay[];
  avatarUrl?: string | null;
  onboardingComplete?: boolean;
};

export async function upsertProfile(userId: string, payload: ProfileInput) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        display_name: payload.displayName,
        mail: payload.email,
        goal: payload.goal,
        goal_description: payload.goalDescription ?? null,
        timezone: payload.timezone,
        training_days: payload.trainingDays,
        onboarding_complete: payload.onboardingComplete ?? true,
        avatar_url: payload.avatarUrl ?? null,
        updated_at: now,
      },
      {
        onConflict: 'id',
      }
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return (data ?? null) as Profile | null;
}
