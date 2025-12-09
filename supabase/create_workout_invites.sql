-- Antrenman Davetleri Tablosu
CREATE TABLE IF NOT EXISTS public.workout_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_instance_id UUID REFERENCES public.schedule_instances(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invite_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Aynı gün için aynı kişiye birden fazla davet gönderilemesin
  CONSTRAINT unique_daily_invite UNIQUE (sender_id, receiver_id, invite_date)
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_workout_invites_sender ON public.workout_invites(sender_id);
CREATE INDEX IF NOT EXISTS idx_workout_invites_receiver ON public.workout_invites(receiver_id);
CREATE INDEX IF NOT EXISTS idx_workout_invites_date ON public.workout_invites(invite_date);
CREATE INDEX IF NOT EXISTS idx_workout_invites_status ON public.workout_invites(status);

-- RLS
ALTER TABLE public.workout_invites ENABLE ROW LEVEL SECURITY;

-- Politikalar
CREATE POLICY "Users can view their own invites"
  ON public.workout_invites FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send invites"
  ON public.workout_invites FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update invites they received"
  ON public.workout_invites FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own invites"
  ON public.workout_invites FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
