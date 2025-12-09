import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

import { supabase } from '@/lib/supabase';
import { ScheduleInstance } from '@/types/program';

const TODAY_PLAN_KEY = ['today-plan'];
const WORKOUT_HISTORY_KEY = ['workout-history'];

export async function fetchTodayPlan(): Promise<ScheduleInstance[]> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data, error } = await supabase
    .from('schedule_instances')
    .select(
      'id,status,scheduled_date,program_id,workout_id,programs(title),program_workouts(title,day_of_week)'
    )
    .eq('scheduled_date', today)
    .order('scheduled_date', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function useTodayPlan() {
  return useQuery({
    queryKey: TODAY_PLAN_KEY,
    queryFn: fetchTodayPlan,
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
  const { data, error } = await supabase
    .from('schedule_instances')
    .select('scheduled_date, status')
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)
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
