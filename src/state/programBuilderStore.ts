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
  syncAcrossDays: boolean;
  setMeta: (meta: Partial<BuilderMeta>) => void;
  toggleTrainingDay: (day: TrainingDay) => void;
  setSyncAcrossDays: (value: boolean) => void;
  setWorkoutTitle: (day: TrainingDay, title: string) => void;
  addExercise: (day: TrainingDay, exercise: BuilderExercise) => void;
  removeExercise: (day: TrainingDay, index: number) => void;
  reset: () => void;
};

const defaultState: Omit<
  ProgramBuilderState,
  'setMeta' | 'toggleTrainingDay' | 'setSyncAcrossDays' | 'setWorkoutTitle' | 'addExercise' | 'removeExercise' | 'reset'
> = {
  meta: {
    title: '',
    focus: '',
  },
  trainingDays: [],
  workouts: [],
  syncAcrossDays: false,
};

export const useProgramBuilderStore = create<ProgramBuilderState>((set) => ({
  ...defaultState,
  setMeta: (meta) =>
    set((state) => ({
      meta: { ...state.meta, ...meta },
    })),
  toggleTrainingDay: (day) =>
    set((state) => {
      const exists = state.trainingDays.includes(day);
      const nextDays = exists ? state.trainingDays.filter((d) => d !== day) : [...state.trainingDays, day];

      const templateWorkout =
        state.workouts.find((workout) => workout.exercises.length > 0) ?? state.workouts[0] ?? null;

      const nextWorkouts = exists
        ? state.workouts.filter((workout) => workout.day !== day)
        : [
            ...state.workouts,
            {
              day,
              title: templateWorkout?.title ?? '',
              exercises: state.syncAcrossDays ? (templateWorkout?.exercises ?? []) : [],
            },
          ];

      return {
        trainingDays: nextDays,
        workouts: nextWorkouts,
      };
    }),
  setSyncAcrossDays: (value) =>
    set((state) => {
      if (!value) {
        return { syncAcrossDays: false };
      }

      const templateWorkout =
        state.workouts.find((workout) => workout.exercises.length > 0) ?? state.workouts[0] ?? null;
      const templateExercises = templateWorkout?.exercises ?? [];
      const templateTitle = templateWorkout?.title ?? '';

      return {
        syncAcrossDays: true,
        workouts: state.trainingDays.map((day) => {
          const existingWorkout = state.workouts.find((workout) => workout.day === day);
          return {
            day,
            title: existingWorkout?.title ?? templateTitle,
            exercises: templateExercises,
          };
        }),
      };
    }),
  setWorkoutTitle: (day, title) =>
    set((state) => ({
      workouts: state.syncAcrossDays
        ? state.workouts.map((workout) => ({ ...workout, title }))
        : state.workouts.map((workout) => (workout.day === day ? { ...workout, title } : workout)),
    })),
  addExercise: (day, exercise) =>
    set((state) => {
      if (state.syncAcrossDays) {
        return {
          workouts: state.workouts.map((workout) => ({ ...workout, exercises: [...workout.exercises, exercise] })),
        };
      }

      const workouts = state.workouts.some((workout) => workout.day === day)
        ? state.workouts.map((workout) =>
            workout.day === day ? { ...workout, exercises: [...workout.exercises, exercise] } : workout
          )
        : [...state.workouts, { day, title: '', exercises: [exercise] }];

      return { workouts };
    }),
  removeExercise: (day, index) =>
    set((state) => ({
      workouts: state.syncAcrossDays
        ? state.workouts.map((workout) => ({
            ...workout,
            exercises: workout.exercises.filter((_, exerciseIndex) => exerciseIndex !== index),
          }))
        : state.workouts.map((workout) =>
            workout.day === day
              ? { ...workout, exercises: workout.exercises.filter((_, exerciseIndex) => exerciseIndex !== index) }
              : workout
          ),
    })),
  reset: () => set({ ...defaultState }),
}));
