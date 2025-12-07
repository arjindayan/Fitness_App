import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays } from 'date-fns';

import { supabase } from '@/lib/supabase';
import { BuilderWorkout, Program, ProgramWorkout, ScheduleInstance, WorkoutExercise } from '@/types/program';
import { TrainingDay } from '@/types/profile';

const PROGRAM_QUERY_KEY = ['programs'];

const DAY_TO_INDEX: Record<TrainingDay, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

const INDEX_TO_DAY: TrainingDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export function toDayIndex(day: TrainingDay) {
  return DAY_TO_INDEX[day];
}

export function fromDayIndex(index: number): TrainingDay {
  return INDEX_TO_DAY[index];
}

export type ProgramInput = {
  title: string;
  focus?: string;
  trainingDays: TrainingDay[];
  workouts: BuilderWorkout[];
};

export async function deleteProgram(programId: string) {
  const { error } = await supabase.from('programs').delete().eq('id', programId);

  if (error) {
    throw error;
  }
}

export function useDeleteProgramMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAM_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['today-plan'] });
    },
  });
}

export async function fetchPrograms(): Promise<
  (Program & { workouts: ProgramWorkout[]; training_days?: TrainingDay[] })[]
> {
  const { data, error } = await supabase.from('programs').select('*, program_workouts(*)').order('created_at', {
    ascending: false,
  });

  if (error) {
    throw error;
  }

  return (
    data?.map((program) => ({
      ...program,
      workouts: program.program_workouts ?? [],
      training_days: program.training_days ?? [],
    })) ?? []
  );
}

export function useProgramList() {
  return useQuery({
    queryKey: PROGRAM_QUERY_KEY,
    queryFn: fetchPrograms,
  });
}

export type ProgramDetail = Program & {
  program_workouts: (ProgramWorkout & {
    workout_blocks: {
      id: string;
      workout_exercises: WorkoutExercise[];
    }[];
  })[];
};

export async function fetchProgramDetail(programId: string): Promise<ProgramDetail | null> {
  const { data, error } = await supabase
    .from('programs')
    .select(
      `
      *,
      program_workouts(
        *,
        workout_blocks(
          *,
          workout_exercises(*)
        )
      )
    `
    )
    .eq('id', programId)
    .single();

  if (error) {
    throw error;
  }

  return data as ProgramDetail;
}

export function useProgramDetail(programId?: string) {
  return useQuery({
    queryKey: [...PROGRAM_QUERY_KEY, programId],
    queryFn: () => fetchProgramDetail(programId as string),
    enabled: Boolean(programId),
  });
}

export async function createProgramWithWorkouts(payload: ProgramInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('Giriş gerekiyor');
  }

  const { data: program, error } = await supabase
    .from('programs')
    .insert({
      title: payload.title,
      focus: payload.focus ?? null,
      training_days: payload.trainingDays,
      is_active: true,
      owner_id: user.id,
    })
    .select('*')
    .single();

  if (error || !program) {
    throw error ?? new Error('Program oluşturulamadı');
  }

  const workoutPayload = payload.workouts.map((workout, index) => ({
    program_id: program.id,
    day_of_week: toDayIndex(workout.day),
    title: workout.title || `${workout.day} antrenmanı`,
    order_index: index,
    notes: null,
  }));

  const { data: workouts, error: workoutError } = await supabase
    .from('program_workouts')
    .insert(workoutPayload)
    .select('*');

  if (workoutError) {
    throw workoutError;
  }

  const blocksPayload =
    workouts?.map((workout) => ({
      workout_id: workout.id,
      block_type: 'single',
      order_index: 0,
      note: null,
    })) ?? [];

  const { data: blocks, error: blockError } = await supabase.from('workout_blocks').insert(blocksPayload).select('*');

  if (blockError) {
    throw blockError;
  }

  const exercisesPayload = payload.workouts.flatMap((workout, workoutIndex) => {
    const block = blocks?.[workoutIndex];
    if (!block) {
      return [];
    }
    return workout.exercises.map((exercise, exerciseIndex) => ({
      block_id: block.id,
      movement_id: exercise.movementId,
      sets: exercise.sets,
      reps: exercise.reps,
      rest_seconds: exercise.restSeconds ?? null,
      note: exercise.note ?? null,
      order_index: exerciseIndex,
    }));
  });

  if (exercisesPayload.length > 0) {
    const { error: exerciseError } = await supabase.from('workout_exercises').insert(exercisesPayload);
    if (exerciseError) {
      throw exerciseError;
    }
  }

  await generateInitialSchedule(program.id, workouts ?? []);

  return program as Program;
}

export function useCreateProgramMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProgramWithWorkouts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAM_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['today-plan'] });
    },
  });
}

type AddExercisePayload = {
  workoutId: string;
  movementId: string;
  sets: number;
  reps: string;
  restSeconds?: number | null;
  note?: string | null;
};

export async function addExerciseToWorkout(payload: AddExercisePayload) {
  const { data: existingBlock, error: blockError } = await supabase
    .from('workout_blocks')
    .select('id')
    .eq('workout_id', payload.workoutId)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (blockError) {
    throw blockError;
  }

  let blockId = existingBlock?.id;

  if (!blockId) {
    const { data: newBlock, error: createError } = await supabase
      .from('workout_blocks')
      .insert({
        workout_id: payload.workoutId,
        block_type: 'single',
        order_index: 0,
      })
      .select('id')
      .single();

    if (createError) {
      throw createError;
    }

    blockId = newBlock.id;
  }

  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({
      block_id: blockId,
      movement_id: payload.movementId,
      sets: payload.sets,
      reps: payload.reps,
      rest_seconds: payload.restSeconds ?? null,
      note: payload.note ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as WorkoutExercise;
}

export function useAddExerciseMutation(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addExerciseToWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAM_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...PROGRAM_QUERY_KEY, programId] });
    },
  });
}

export async function generateInitialSchedule(programId: string, workouts: ProgramWorkout[]) {
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7;
  const schedulePayload: Partial<ScheduleInstance>[] = [];

  workouts.forEach((workout) => {
    const diff = (workout.day_of_week - todayIndex + 7) % 7;
    const scheduledDate = addDays(today, diff);

    schedulePayload.push({
      program_id: programId,
      workout_id: workout.id,
      scheduled_date: scheduledDate.toISOString().slice(0, 10),
      status: 'pending',
    });
  });

  if (schedulePayload.length === 0) {
    return;
  }

  await supabase.from('schedule_instances').insert(schedulePayload);
}
