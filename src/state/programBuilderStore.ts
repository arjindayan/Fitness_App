import { create } from 'zustand';

import { BuilderExercise, BuilderWorkout } from '@/types/program';
import { TrainingDay } from '@/types/profile';

type BuilderMeta = {
  title: string;
  focus: string;
};

type ProgramBuilderState = {
  meta: BuilderMeta;
  trainingDays: TrainingDay[];
  workouts: BuilderWorkout[];
  setMeta: (meta: Partial<BuilderMeta>) => void;
  toggleTrainingDay: (day: TrainingDay) => void;
  setWorkoutTitle: (day: TrainingDay, title: string) => void;
  addExercise: (day: TrainingDay, exercise: BuilderExercise) => void;
  removeExercise: (day: TrainingDay, index: number) => void;
  reset: () => void;
};

const defaultState: Omit<ProgramBuilderState, 'setMeta' | 'toggleTrainingDay' | 'addExercise' | 'removeExercise' | 'reset'> =
  {
    meta: {
      title: '',
      focus: '',
    },
    trainingDays: [],
    workouts: [],
  };

export const useProgramBuilderStore = create<ProgramBuilderState>((set, get) => ({
  ...defaultState,
  setMeta: (meta) =>
    set((state) => ({
      meta: { ...state.meta, ...meta },
    })),
  toggleTrainingDay: (day) =>
    set((state) => {
      const exists = state.trainingDays.includes(day);
      const nextDays = exists ? state.trainingDays.filter((d) => d !== day) : [...state.trainingDays, day];
      const nextWorkouts = exists
        ? state.workouts.filter((workout) => workout.day !== day)
        : [...state.workouts, { day, title: '', exercises: [] }]; // Boş başlat, kullanıcı dolduracak
      return {
        trainingDays: nextDays,
        workouts: nextWorkouts,
      };
    }),
  setWorkoutTitle: (day, title) =>
    set((state) => ({
      workouts: state.workouts.map((workout) =>
        workout.day === day ? { ...workout, title } : workout
      ),
    })),
  addExercise: (day, exercise) =>
    set((state) => {
      const workouts = state.workouts.some((workout) => workout.day === day)
        ? state.workouts.map((workout) =>
            workout.day === day ? { ...workout, exercises: [...workout.exercises, exercise] } : workout
          )
        : [...state.workouts, { day, title: '', exercises: [exercise] }];

      return { workouts };
    }),
  removeExercise: (day, index) =>
    set((state) => ({
      workouts: state.workouts.map((workout) =>
        workout.day === day
          ? { ...workout, exercises: workout.exercises.filter((_, exerciseIndex) => exerciseIndex !== index) }
          : workout
      ),
    })),
  reset: () => set({ ...defaultState }),
}));
