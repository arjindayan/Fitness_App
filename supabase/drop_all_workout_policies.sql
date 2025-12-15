-- =====================================================
-- TÜM WORKOUT POLİTİKALARINI SİL
-- =====================================================
-- Bu script tüm workout ile ilgili politikaları siler
-- Dikkat: Bu dosyayı çalıştırdıktan sonra fix_workout_blocks_exercises_rls.sql dosyasını çalıştırın
-- =====================================================

-- PROGRAM_WORKOUTS için tüm politikaları sil
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'program_workouts' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.program_workouts';
    END LOOP;
END $$;

-- WORKOUT_BLOCKS için tüm politikaları sil
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'workout_blocks' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.workout_blocks';
    END LOOP;
END $$;

-- WORKOUT_EXERCISES için tüm politikaları sil
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'workout_exercises' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.workout_exercises';
    END LOOP;
END $$;

-- Bilgilendirme
DO $$
BEGIN
  RAISE NOTICE 'Tüm workout politikaları silindi!';
  RAISE NOTICE 'Şimdi fix_workout_blocks_exercises_rls.sql dosyasını çalıştırabilirsiniz.';
END $$;
