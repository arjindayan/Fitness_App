import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { ExerciseLog, MovementStats } from '@/types/program';

const EXERCISE_LOG_KEY = ['exercise-logs'];

// Yeni egzersiz log'u oluştur
export type CreateExerciseLogPayload = {
  movementId: string;
  scheduleInstanceId?: string | null;
  setsCompleted: number;
  repsCompleted?: string | null;
  weightKg?: number | null;
  durationSeconds?: number | null;
  note?: string | null;
  difficultyRating?: number | null;
};

export async function createExerciseLog(payload: CreateExerciseLogPayload): Promise<ExerciseLog> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Kullanıcı oturum açmamış');
  }

  // Bugünün tarihi (YYYY-MM-DD formatında)
  const today = new Date().toISOString().split('T')[0];

  // Upsert: Aynı gün, aynı kullanıcı, aynı hareket için kayıt varsa güncelle
  const { data, error } = await supabase
    .from('exercise_logs')
    .upsert(
      {
        user_id: user.id,
        movement_id: payload.movementId,
        log_date: today,
        schedule_instance_id: payload.scheduleInstanceId,
        sets_completed: payload.setsCompleted,
        reps_completed: payload.repsCompleted,
        weight_kg: payload.weightKg,
        duration_seconds: payload.durationSeconds,
        note: payload.note,
        difficulty_rating: payload.difficultyRating,
        logged_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,movement_id,log_date',
        ignoreDuplicates: false, // Duplicate varsa güncelle
      }
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function useCreateExerciseLogMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExerciseLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXERCISE_LOG_KEY });
    },
  });
}

// Belirli bir hareket için log geçmişi
export async function fetchMovementLogs(movementId: string, limit = 30): Promise<ExerciseLog[]> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*, movements(name, image_url)')
    .eq('movement_id', movementId)
    .order('logged_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function useMovementLogs(movementId: string | null) {
  return useQuery({
    queryKey: [...EXERCISE_LOG_KEY, 'movement', movementId],
    queryFn: () => fetchMovementLogs(movementId!),
    enabled: !!movementId,
  });
}

// Kullanıcının tüm hareket istatistikleri
export async function fetchMovementStats(): Promise<MovementStats[]> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select(`
      movement_id,
      sets_completed,
      weight_kg,
      logged_at,
      movements(name, image_url)
    `)
    .order('logged_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Harekete göre grupla ve istatistik hesapla
  const statsMap = new Map<string, MovementStats>();

  for (const log of data ?? []) {
    const existing = statsMap.get(log.movement_id);
    const movement = log.movements as { name: string; image_url?: string | null } | null;
    
    if (existing) {
      existing.total_sessions++;
      existing.avg_sets = (existing.avg_sets * (existing.total_sessions - 1) + log.sets_completed) / existing.total_sessions;
      if (log.weight_kg && (!existing.max_weight_kg || log.weight_kg > existing.max_weight_kg)) {
        existing.max_weight_kg = log.weight_kg;
      }
    } else {
      statsMap.set(log.movement_id, {
        movement_id: log.movement_id,
        movement_name: movement?.name ?? 'Bilinmeyen Hareket',
        movement_image: movement?.image_url,
        total_sessions: 1,
        last_weight_kg: log.weight_kg,
        max_weight_kg: log.weight_kg,
        avg_sets: log.sets_completed,
        last_logged_at: log.logged_at,
      });
    }
  }

  return Array.from(statsMap.values()).sort((a, b) => 
    new Date(b.last_logged_at).getTime() - new Date(a.last_logged_at).getTime()
  );
}

export function useMovementStats() {
  return useQuery({
    queryKey: [...EXERCISE_LOG_KEY, 'stats'],
    queryFn: fetchMovementStats,
  });
}

// Grafik için veri formatı
export type ChartDataPoint = {
  date: string;
  value: number;
  label: string;
};

// Hareket için grafik verisi (ağırlık ilerlemesi)
export async function fetchMovementChartData(
  movementId: string, 
  metric: 'weight' | 'sets' | 'volume' = 'weight',
  limit = 20
): Promise<ChartDataPoint[]> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('log_date, logged_at, sets_completed, weight_kg, reps_completed')
    .eq('movement_id', movementId)
    .order('log_date', { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((log) => {
    let value = 0;
    
    if (metric === 'weight') {
      value = log.weight_kg ?? 0;
    } else if (metric === 'sets') {
      value = log.sets_completed;
    } else if (metric === 'volume') {
      // Volume = sets x reps x weight
      const reps = log.reps_completed?.split(',').reduce((sum, r) => sum + (parseInt(r) || 0), 0) ?? 0;
      value = (log.weight_kg ?? 0) * reps;
    }

    const dateToUse = log.log_date || log.logged_at;
    return {
      date: dateToUse,
      value,
      label: new Date(dateToUse).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    };
  });
}

export function useMovementChartData(movementId: string | null, metric: 'weight' | 'sets' | 'volume' = 'weight') {
  return useQuery({
    queryKey: [...EXERCISE_LOG_KEY, 'chart', movementId, metric],
    queryFn: () => fetchMovementChartData(movementId!, metric),
    enabled: !!movementId,
  });
}

