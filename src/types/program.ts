import { TrainingDay } from './profile';

export type Program = {
  id: string;
  owner_id: string;
  title: string;
  focus: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProgramWorkout = {
  id: string;
  program_id: string;
  day_of_week: number; // 0 = Monday
  title: string;
  order_index: number;
  notes?: string | null;
};

export type WorkoutExercise = {
  id: string;
  block_id: string;
  movement_id: string;
  sets: number;
  reps: string;
  rest_seconds?: number | null;
  tempo?: string | null;
  note?: string | null;
};

export type TrainingPlan = {
  program: Program;
  workouts: ProgramWorkout[];
};

export type BuilderWorkout = {
  day: TrainingDay;
  title: string;
  exercises: BuilderExercise[];
};

export type BuilderExercise = {
  movementId: string;
  movementName: string;
  movementImage?: string | null;
  sets: number;
  reps: string;
  restSeconds?: number | null;
  note?: string | null;
};

export type ScheduleInstance = {
  id: string;
  program_id: string;
  workout_id: string;
  scheduled_date: string;
  status: 'pending' | 'done' | 'skipped';
  auto_shifted_from?: string | null;
  program_workouts?: {
    title: string;
    day_of_week: number;
  };
  programs?: {
    title: string;
  };
};

// Egzersiz log kaydı
export type ExerciseLog = {
  id: string;
  user_id: string;
  movement_id: string;
  schedule_instance_id?: string | null;
  sets_completed: number;
  reps_completed?: string | null; // "10,10,8" formatında
  weight_kg?: number | null;
  duration_seconds?: number | null;
  note?: string | null;
  difficulty_rating?: number | null; // 1-5
  logged_at: string;
  created_at?: string;
  // Join edilmiş veriler
  movements?: {
    name: string;
    image_url?: string | null;
  };
};

// Hareket için özet istatistikler
export type MovementStats = {
  movement_id: string;
  movement_name: string;
  movement_image?: string | null;
  total_sessions: number;
  last_weight_kg?: number | null;
  max_weight_kg?: number | null;
  avg_sets: number;
  last_logged_at: string;
};
