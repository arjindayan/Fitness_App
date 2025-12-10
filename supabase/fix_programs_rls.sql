-- =====================================================
-- PROGRAMS TABLOSU RLS DÜZELTMESİ
-- =====================================================
-- Bu script arkadaşların programlarını görebilmek için
-- programs tablosuna yeni RLS politikası ekler
-- =====================================================

-- Mevcut SELECT politikasını kontrol et ve güncelle
-- Önce eski politikayı kaldır (varsa)
DROP POLICY IF EXISTS "Users can view own programs" ON public.programs;
DROP POLICY IF EXISTS "Users can view their own programs" ON public.programs;
DROP POLICY IF EXISTS "Users can view friends programs" ON public.programs;
DROP POLICY IF EXISTS "Programs are viewable by owner and friends" ON public.programs;

-- Yeni politika: Kullanıcılar kendi programlarını VE arkadaşlarının programlarını görebilir
CREATE POLICY "Programs are viewable by owner and friends"
  ON public.programs FOR SELECT
  USING (
    -- Kendi programları
    auth.uid() = owner_id
    OR
    -- Arkadaşlarının programları
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE friendships.user_id = auth.uid()
        AND friendships.friend_id = programs.owner_id
    )
  );

-- INSERT, UPDATE, DELETE politikaları (sadece kendi programları için)
DROP POLICY IF EXISTS "Users can insert own programs" ON public.programs;
DROP POLICY IF EXISTS "Users can update own programs" ON public.programs;
DROP POLICY IF EXISTS "Users can delete own programs" ON public.programs;

CREATE POLICY "Users can insert own programs"
  ON public.programs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own programs"
  ON public.programs FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own programs"
  ON public.programs FOR DELETE
  USING (auth.uid() = owner_id);

-- schedule_instances için de benzer politika ekle
DROP POLICY IF EXISTS "Users can view own schedules" ON public.schedule_instances;
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedule_instances;
DROP POLICY IF EXISTS "Schedules viewable by owner and friends" ON public.schedule_instances;

CREATE POLICY "Schedules viewable by owner and friends"
  ON public.schedule_instances FOR SELECT
  USING (
    -- Kendi schedule'ları (program sahibi)
    EXISTS (
      SELECT 1 FROM public.programs
      WHERE programs.id = schedule_instances.program_id
        AND programs.owner_id = auth.uid()
    )
    OR
    -- Arkadaşlarının schedule'ları
    EXISTS (
      SELECT 1 FROM public.programs p
      JOIN public.friendships f ON f.friend_id = p.owner_id
      WHERE p.id = schedule_instances.program_id
        AND f.user_id = auth.uid()
    )
  );

-- Bilgilendirme
DO $$
BEGIN
  RAISE NOTICE 'Programs ve schedule_instances RLS politikaları güncellendi!';
  RAISE NOTICE 'Artık arkadaşların programları ve antrenman planları görülebilir.';
END $$;

