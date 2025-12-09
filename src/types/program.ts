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
