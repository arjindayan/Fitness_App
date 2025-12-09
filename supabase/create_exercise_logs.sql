-- Exercise logs table - her antrenman için hareket performans kaydı
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movement_id UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  schedule_instance_id UUID REFERENCES public.schedule_instances(id) ON DELETE SET NULL,
  
  -- Performans verileri
  sets_completed INTEGER NOT NULL DEFAULT 0,
  reps_completed TEXT, -- "10,10,8" gibi her set için
  weight_kg DECIMAL(6,2), -- Kullanılan ağırlık
  duration_seconds INTEGER, -- Süre bazlı egzersizler için
  
  -- Notlar
  note TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5), -- 1-5 zorluk
  
  -- Zaman damgası - log_date için sadece tarih tutulacak
  log_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Günlük kayıt için tarih
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Her kullanıcı için her hareket günde sadece 1 kayıt
  CONSTRAINT exercise_logs_unique_daily UNIQUE (user_id, movement_id, log_date)
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_id ON public.exercise_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_movement_id ON public.exercise_logs(movement_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_log_date ON public.exercise_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_logged_at ON public.exercise_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_movement ON public.exercise_logs(user_id, movement_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_movement_date ON public.exercise_logs(user_id, movement_id, log_date);

-- RLS (Row Level Security)
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi loglarını görebilir ve düzenleyebilir
CREATE POLICY "Users can view own exercise logs"
  ON public.exercise_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise logs"
  ON public.exercise_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise logs"
  ON public.exercise_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise logs"
  ON public.exercise_logs FOR DELETE
  USING (auth.uid() = user_id);

