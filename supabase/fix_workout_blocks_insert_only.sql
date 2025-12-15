-- =====================================================
-- WORKOUT_BLOCKS INSERT POLİTİKASI - BASİT VERSİYON
-- =====================================================
-- Bu script sadece workout_blocks INSERT politikasını oluşturur
-- Eğer diğer politikalar zaten varsa, sadece bu INSERT politikasını ekleyin
-- =====================================================

-- Önce mevcut INSERT politikasını sil
DROP POLICY IF EXISTS "Workout blocks are insertable by program owner" ON public.workout_blocks;

-- RLS'yi etkinleştir
ALTER TABLE IF EXISTS public.workout_blocks ENABLE ROW LEVEL SECURITY;

-- INSERT: Program sahibi kendi programına workout block ekleyebilir
-- Bu politika program_workouts tablosunu sorgular
-- program_workouts için SELECT politikası da gereklidir
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

-- Bilgilendirme
DO $$
BEGIN
  RAISE NOTICE 'Workout blocks INSERT politikası oluşturuldu!';
  RAISE NOTICE 'NOT: program_workouts tablosu için SELECT politikası da gereklidir.';
END $$;
