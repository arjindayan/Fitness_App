-- =====================================================
-- PROGRAM_WORKOUTS, WORKOUT_BLOCKS VE WORKOUT_EXERCISES RLS DÜZELTMESİ
-- =====================================================
-- Bu script kullanıcıların kendi programlarına hareket
-- ekleyip çıkarabilmesi için gerekli RLS politikalarını ekler
-- =====================================================

-- RLS'yi etkinleştir (eğer zaten açık değilse)
ALTER TABLE IF EXISTS public.program_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workout_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- ÖNEMLİ: Eğer "policy already exists" hatası alırsanız,
-- önce aşağıdaki komutları çalıştırarak tüm politikaları manuel olarak silin:
-- DROP POLICY IF EXISTS "Program workouts are viewable by program owner and friends" ON public.program_workouts;
-- DROP POLICY IF EXISTS "Program workouts are insertable by program owner" ON public.program_workouts;
-- DROP POLICY IF EXISTS "Program workouts are updatable by program owner" ON public.program_workouts;
-- DROP POLICY IF EXISTS "Program workouts are deletable by program owner" ON public.program_workouts;
-- DROP POLICY IF EXISTS "Workout blocks are viewable by program owner" ON public.workout_blocks;
-- DROP POLICY IF EXISTS "Workout blocks are insertable by program owner" ON public.workout_blocks;
-- DROP POLICY IF EXISTS "Workout blocks are updatable by program owner" ON public.workout_blocks;
-- DROP POLICY IF EXISTS "Workout blocks are deletable by program owner" ON public.workout_blocks;
-- DROP POLICY IF EXISTS "Workout exercises are viewable by program owner" ON public.workout_exercises;
-- DROP POLICY IF EXISTS "Workout exercises are insertable by program owner" ON public.workout_exercises;
-- DROP POLICY IF EXISTS "Workout exercises are updatable by program owner" ON public.workout_exercises;
-- DROP POLICY IF EXISTS "Workout exercises are deletable by program owner" ON public.workout_exercises;

-- PROGRAM_WORKOUTS için RLS politikaları
-- Önce mevcut politikaları temizle (tüm olası isimleri kapsayacak şekilde)
DROP POLICY IF EXISTS "Users can view own program workouts" ON public.program_workouts;
DROP POLICY IF EXISTS "Users can insert own program workouts" ON public.program_workouts;
DROP POLICY IF EXISTS "Users can update own program workouts" ON public.program_workouts;
DROP POLICY IF EXISTS "Users can delete own program workouts" ON public.program_workouts;
DROP POLICY IF EXISTS "Program workouts are viewable by program owner" ON public.program_workouts;
DROP POLICY IF EXISTS "Program workouts are manageable by program owner" ON public.program_workouts;
DROP POLICY IF EXISTS "Program workouts are viewable by program owner and friends" ON public.program_workouts;
DROP POLICY IF EXISTS "Program workouts are insertable by program owner" ON public.program_workouts;
DROP POLICY IF EXISTS "Program workouts are updatable by program owner" ON public.program_workouts;
DROP POLICY IF EXISTS "Program workouts are deletable by program owner" ON public.program_workouts;

-- SELECT: Program sahibi kendi programının workout'larını görebilir (ve arkadaşlar)
-- NOT: Bu politika INSERT/UPDATE/DELETE politikalarında da kullanılır
-- NOT: RLS politikaları içinde kullanıldığında da çalışması için geniş tutulmalı
CREATE POLICY "Program workouts are viewable by program owner and friends"
  ON public.program_workouts FOR SELECT
  USING (
    -- Kendi programları
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_workouts.program_id
        AND p.owner_id = auth.uid()
    )
    OR
    -- Arkadaşlarının programları
    EXISTS (
      SELECT 1 FROM public.programs p
      JOIN public.friendships f ON f.friend_id = p.owner_id
      WHERE p.id = program_workouts.program_id
        AND f.user_id = auth.uid()
    )
  );

-- INSERT: Program sahibi kendi programına workout ekleyebilir
CREATE POLICY "Program workouts are insertable by program owner"
  ON public.program_workouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_workouts.program_id
        AND p.owner_id = auth.uid()
    )
  );

-- UPDATE: Program sahibi kendi programının workout'larını güncelleyebilir
CREATE POLICY "Program workouts are updatable by program owner"
  ON public.program_workouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_workouts.program_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_workouts.program_id
        AND p.owner_id = auth.uid()
    )
  );

-- DELETE: Program sahibi kendi programının workout'larını silebilir
CREATE POLICY "Program workouts are deletable by program owner"
  ON public.program_workouts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_workouts.program_id
        AND p.owner_id = auth.uid()
    )
  );

-- WORKOUT_BLOCKS için RLS politikaları
-- Önce mevcut politikaları temizle (tüm olası isimleri kapsayacak şekilde)
DROP POLICY IF EXISTS "Users can view own workout blocks" ON public.workout_blocks;
DROP POLICY IF EXISTS "Users can insert own workout blocks" ON public.workout_blocks;
DROP POLICY IF EXISTS "Users can update own workout blocks" ON public.workout_blocks;
DROP POLICY IF EXISTS "Users can delete own workout blocks" ON public.workout_blocks;
DROP POLICY IF EXISTS "Workout blocks are viewable by program owner" ON public.workout_blocks;
DROP POLICY IF EXISTS "Workout blocks are manageable by program owner" ON public.workout_blocks;
DROP POLICY IF EXISTS "Workout blocks are insertable by program owner" ON public.workout_blocks;
DROP POLICY IF EXISTS "Workout blocks are updatable by program owner" ON public.workout_blocks;
DROP POLICY IF EXISTS "Workout blocks are deletable by program owner" ON public.workout_blocks;

-- SELECT: Program sahibi kendi programının workout block'larını görebilir
CREATE POLICY "Workout blocks are viewable by program owner"
  ON public.workout_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.program_workouts pw
      JOIN public.programs p ON p.id = pw.program_id
      WHERE pw.id = workout_blocks.workout_id
        AND p.owner_id = auth.uid()
    )
  );

-- INSERT: Program sahibi kendi programına workout block ekleyebilir
-- NOT: WITH CHECK içinde yeni satırın değerlerini kullanırız
-- NOT: Bu politika program_workouts tablosunu sorguladığı için,
--      program_workouts için SELECT politikası da gereklidir
-- NOT: SECURITY DEFINER kullanarak bu politikayı bypass edebiliriz ama
--      daha güvenli olması için program_workouts SELECT politikasını kullanıyoruz
CREATE POLICY "Workout blocks are insertable by program owner"
  ON public.workout_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.program_workouts pw
      INNER JOIN public.programs p ON p.id = pw.program_id
      WHERE pw.id = workout_blocks.workout_id
        AND p.owner_id = auth.uid()
    )
  );

-- UPDATE: Program sahibi kendi programının workout block'larını güncelleyebilir
CREATE POLICY "Workout blocks are updatable by program owner"
  ON public.workout_blocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.program_workouts pw
      JOIN public.programs p ON p.id = pw.program_id
      WHERE pw.id = workout_blocks.workout_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_workouts pw
      JOIN public.programs p ON p.id = pw.program_id
      WHERE pw.id = workout_blocks.workout_id
        AND p.owner_id = auth.uid()
    )
  );

-- DELETE: Program sahibi kendi programının workout block'larını silebilir
CREATE POLICY "Workout blocks are deletable by program owner"
  ON public.workout_blocks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.program_workouts pw
      JOIN public.programs p ON p.id = pw.program_id
      WHERE pw.id = workout_blocks.workout_id
        AND p.owner_id = auth.uid()
    )
  );

-- WORKOUT_EXERCISES için RLS politikaları
-- Önce mevcut politikaları temizle (tüm olası isimleri kapsayacak şekilde)
DROP POLICY IF EXISTS "Users can view own workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can insert own workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can update own workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can delete own workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Workout exercises are viewable by program owner" ON public.workout_exercises;
DROP POLICY IF EXISTS "Workout exercises are manageable by program owner" ON public.workout_exercises;
DROP POLICY IF EXISTS "Workout exercises are insertable by program owner" ON public.workout_exercises;
DROP POLICY IF EXISTS "Workout exercises are updatable by program owner" ON public.workout_exercises;
DROP POLICY IF EXISTS "Workout exercises are deletable by program owner" ON public.workout_exercises;

-- SELECT: Program sahibi kendi programının workout exercise'lerini görebilir
CREATE POLICY "Workout exercises are viewable by program owner"
  ON public.workout_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_blocks wb
      JOIN public.program_workouts pw ON pw.id = wb.workout_id
      JOIN public.programs p ON p.id = pw.program_id
      WHERE wb.id = workout_exercises.block_id
        AND p.owner_id = auth.uid()
    )
  );

-- INSERT: Program sahibi kendi programına workout exercise ekleyebilir
CREATE POLICY "Workout exercises are insertable by program owner"
  ON public.workout_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_blocks wb
      JOIN public.program_workouts pw ON pw.id = wb.workout_id
      JOIN public.programs p ON p.id = pw.program_id
      WHERE wb.id = workout_exercises.block_id
        AND p.owner_id = auth.uid()
    )
  );

-- UPDATE: Program sahibi kendi programının workout exercise'lerini güncelleyebilir
CREATE POLICY "Workout exercises are updatable by program owner"
  ON public.workout_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_blocks wb
      JOIN public.program_workouts pw ON pw.id = wb.workout_id
      JOIN public.programs p ON p.id = pw.program_id
      WHERE wb.id = workout_exercises.block_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_blocks wb
      JOIN public.program_workouts pw ON pw.id = wb.workout_id
      JOIN public.programs p ON p.id = pw.program_id
      WHERE wb.id = workout_exercises.block_id
        AND p.owner_id = auth.uid()
    )
  );

-- DELETE: Program sahibi kendi programının workout exercise'lerini silebilir
CREATE POLICY "Workout exercises are deletable by program owner"
  ON public.workout_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_blocks wb
      JOIN public.program_workouts pw ON pw.id = wb.workout_id
      JOIN public.programs p ON p.id = pw.program_id
      WHERE wb.id = workout_exercises.block_id
        AND p.owner_id = auth.uid()
    )
  );

-- Bilgilendirme
DO $$
BEGIN
  RAISE NOTICE 'Program workouts, workout blocks ve workout exercises RLS politikaları eklendi!';
  RAISE NOTICE 'Artık kullanıcılar kendi programlarına hareket ekleyip çıkarabilir.';
  RAISE NOTICE '';
  RAISE NOTICE 'ÖNEMLİ: Eğer hala "row-level security policy" hatası alıyorsanız:';
  RAISE NOTICE '1. Bu SQL dosyasını Supabase SQL Editor''da çalıştırdığınızdan emin olun';
  RAISE NOTICE '2. Tüm politikaların başarıyla oluşturulduğunu kontrol edin';
  RAISE NOTICE '3. program_workouts, workout_blocks ve workout_exercises tablolarında RLS''nin açık olduğunu kontrol edin';
END $$;
