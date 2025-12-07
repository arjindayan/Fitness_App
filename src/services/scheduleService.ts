import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { supabase } from '@/lib/supabase';
import { ScheduleInstance } from '@/types/program';

const TODAY_PLAN_KEY = ['today-plan'];

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
    },
  });
}
