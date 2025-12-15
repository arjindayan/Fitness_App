import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, parseISO } from 'date-fns';

import { supabase } from '@/lib/supabase';
import { ScheduleInstance, WorkoutExercise } from '@/types/program';

const TODAY_PLAN_KEY = ['today-plan'];
const WORKOUT_HISTORY_KEY = ['workout-history'];
const WORKOUT_EXERCISES_KEY = ['workout-exercises'];

export async function fetchTodayPlan(): Promise<ScheduleInstance[]> {
  const today = format(new Date(), 'yyyy-MM-dd');
  // Sadece oturum açmış kullanıcının kendi programlarına ait bugünkü antrenmanları getir
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

  const { data, error } = await supabase
    .from('schedule_instances')
    .select(
      // Program silinmişse (veya erişilemezse) o schedule'ı hiç getirme
      'id,status,scheduled_date,program_id,workout_id,programs!inner(owner_id,title),program_workouts(title,day_of_week)'
    )
    .eq('scheduled_date', today)
    // Yalnızca current user'ın sahibi olduğu programlara ait kayıtlar
    .eq('programs.owner_id', user.id)
    .order('scheduled_date', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function useTodayPlan(userId?: string | null) {
  return useQuery({
    // Kullanıcıya özel cache anahtarı
    queryKey: [...TODAY_PLAN_KEY, userId],
    queryFn: fetchTodayPlan,
    enabled: !!userId, // Kullanıcı ID'si olmadan sorgu çalışmasın
  });
}

type UpdateScheduleStatusPayload = {
  scheduleId: string;
  status: 'pending' | 'done' | 'skipped';
};

export async function updateScheduleStatus({ scheduleId, status }: UpdateScheduleStatusPayload) {
  const { error } = await supabase.from('schedule_instances').update({ status }).eq('id', scheduleId);

  if (error) {
    throw error;
  }
}

export function useUpdateScheduleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateScheduleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODAY_PLAN_KEY });
      queryClient.invalidateQueries({ queryKey: WORKOUT_HISTORY_KEY });
    },
  });
}

// Antrenman geçmişi - belirli tarih aralığındaki tamamlanmış antrenmanlar
export type WorkoutDay = {
  date: string;
  status: 'done' | 'skipped' | 'pending';
  workoutCount: number;
};

export async function fetchWorkoutHistory(startDate: string, endDate: string): Promise<WorkoutDay[]> {
  // Sadece oturum açmış kullanıcının kendi programlarına ait geçmişi getir
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

  const { data, error } = await supabase
    .from('schedule_instances')
    // Programı silinmiş olan schedule'ları hariç tutmak için programs ile inner join
    .select('scheduled_date, status, programs!inner(owner_id,id)')
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)
    // Yalnızca current user'ın sahibi olduğu programlara ait kayıtlar
    .eq('programs.owner_id', user.id)
    .order('scheduled_date', { ascending: true });

  if (error) {
    throw error;
  }

  // Günlere göre grupla
  const dayMap = new Map<string, WorkoutDay>();
  
  for (const item of data ?? []) {
    const existing = dayMap.get(item.scheduled_date);
    if (existing) {
      existing.workoutCount++;
      // En iyi durumu tut (done > pending > skipped)
      if (item.status === 'done') {
        existing.status = 'done';
      } else if (item.status === 'pending' && existing.status !== 'done') {
        existing.status = 'pending';
      }
    } else {
      dayMap.set(item.scheduled_date, {
        date: item.scheduled_date,
        status: item.status as 'done' | 'skipped' | 'pending',
        workoutCount: 1,
      });
    }
  }

  return Array.from(dayMap.values());
}

// Bu hafta için antrenman geçmişi
export function useWeeklyWorkoutHistory() {
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  return useQuery({
    queryKey: [...WORKOUT_HISTORY_KEY, 'weekly', weekStart],
    queryFn: () => fetchWorkoutHistory(weekStart, weekEnd),
  });
}

// Belirli ay için antrenman geçmişi
export function useMonthlyWorkoutHistory(year: number, month: number) {
  const targetDate = new Date(year, month, 1);
  const monthStart = format(startOfMonth(targetDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(targetDate), 'yyyy-MM-dd');

  return useQuery({
    queryKey: [...WORKOUT_HISTORY_KEY, 'monthly', year, month],
    queryFn: () => fetchWorkoutHistory(monthStart, monthEnd),
  });
}

// Antrenman egzersizlerini çek (workout_id'ye göre)
export type WorkoutExerciseWithMovement = WorkoutExercise & {
  movements: {
    id: string;
    name: string;
    image_url?: string | null;
  };
};

export async function fetchWorkoutExercises(workoutId: string): Promise<WorkoutExerciseWithMovement[]> {
  const { data, error } = await supabase
    .from('workout_blocks')
    .select(`
      workout_exercises(
        *,
        movements(id, name, image_url)
      )
    `)
    .eq('workout_id', workoutId)
    .order('order_index', { ascending: true });

  if (error) {
    throw error;
  }

  // Flatten blocks -> exercises
  const exercises: WorkoutExerciseWithMovement[] = [];
  for (const block of data ?? []) {
    for (const exercise of block.workout_exercises ?? []) {
      exercises.push(exercise as WorkoutExerciseWithMovement);
    }
  }

  return exercises;
}

export function useWorkoutExercises(workoutId: string | null) {
  return useQuery({
    queryKey: [...WORKOUT_EXERCISES_KEY, workoutId],
    queryFn: () => fetchWorkoutExercises(workoutId!),
    enabled: !!workoutId,
  });
}

// Antrenmanı atla ve gelecek antrenmanları kaydır
type SkipAndShiftPayload = {
  scheduleId: string;
  programId: string;
  currentDate: string;
};

export async function skipAndShiftWorkouts({ scheduleId, programId, currentDate }: SkipAndShiftPayload) {
  // 1. Atlanan antrenmanı "skipped" olarak işaretle
  const { error: skipError } = await supabase
    .from('schedule_instances')
    .update({ status: 'skipped' })
    .eq('id', scheduleId);

  if (skipError) {
    throw skipError;
  }

  // 2. Bu programa ait bugünden sonraki tüm "pending" antrenmanları al
  const { data: futureWorkouts, error: fetchError } = await supabase
    .from('schedule_instances')
    .select('id, scheduled_date')
    .eq('program_id', programId)
    .eq('status', 'pending')
    .gte('scheduled_date', currentDate)
    .order('scheduled_date', { ascending: true });

  if (fetchError) {
    throw fetchError;
  }

  // 3. Her bir antrenmanı bir gün ileri kaydır
  for (const workout of futureWorkouts ?? []) {
    const currentScheduledDate = parseISO(workout.scheduled_date);
    const newDate = format(addDays(currentScheduledDate, 1), 'yyyy-MM-dd');

    const { error: updateError } = await supabase
      .from('schedule_instances')
      .update({ 
        scheduled_date: newDate,
        auto_shifted_from: workout.scheduled_date // Orijinal tarihi kaydet
      })
      .eq('id', workout.id);

    if (updateError) {
      console.error('Antrenman kaydırma hatası:', updateError);
    }
  }
}

export function useSkipAndShiftWorkouts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: skipAndShiftWorkouts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODAY_PLAN_KEY });
      queryClient.invalidateQueries({ queryKey: WORKOUT_HISTORY_KEY });
    },
  });
}
