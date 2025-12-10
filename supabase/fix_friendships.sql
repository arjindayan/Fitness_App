-- =====================================================
-- ARKADAŞLIK SİSTEMİ DÜZELTME SCRİPTİ
-- =====================================================
-- Bu script:
-- 1. user_code benzersizliğini garanti eder
-- 2. Tutarsız verileri temizler
-- 3. RLS politikalarını günceller
-- =====================================================

-- 0. ÖNCE: user_code benzersizliğini kontrol et ve düzelt
-- Aynı user_code'a sahip birden fazla kullanıcı varsa, yeni kod ata
DO $$
DECLARE
  duplicate_record RECORD;
  new_code VARCHAR(10);
  code_exists BOOLEAN;
BEGIN
  FOR duplicate_record IN 
    SELECT id, user_code
    FROM public.profiles
    WHERE user_code IN (
      SELECT user_code 
      FROM public.profiles 
      GROUP BY user_code 
      HAVING COUNT(*) > 1
    )
    ORDER BY created_at DESC
    OFFSET 1 -- İlk kaydı koru, diğerlerine yeni kod ata
  LOOP
    -- Yeni benzersiz kod oluştur
    LOOP
      new_code := 'FIT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    UPDATE public.profiles SET user_code = new_code WHERE id = duplicate_record.id;
    RAISE NOTICE 'Duplicate user_code düzeltildi: % -> %', duplicate_record.user_code, new_code;
  END LOOP;
END $$;

-- user_code NULL olanlar için kod oluştur
UPDATE public.profiles
SET user_code = 'FIT-' || UPPER(SUBSTRING(MD5(id::TEXT || RANDOM()::TEXT) FROM 1 FOR 6))
WHERE user_code IS NULL;

-- user_code UNIQUE constraint ekle (yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_code_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_code_key UNIQUE (user_code);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'user_code unique constraint zaten var veya eklenemedi: %', SQLERRM;
END $$;

-- 1. Önce tutarsız verileri temizle
-- Tek taraflı arkadaşlıkları temizle (karşı tarafta kaydı olmayan)
DELETE FROM public.friendships f1
WHERE NOT EXISTS (
  SELECT 1 FROM public.friendships f2
  WHERE f2.user_id = f1.friend_id
    AND f2.friend_id = f1.user_id
);

-- Kendisiyle arkadaş olan kayıtları temizle
DELETE FROM public.friendships
WHERE user_id = friend_id;

-- Kendine istek gönderen kayıtları temizle
DELETE FROM public.friend_requests
WHERE sender_id = receiver_id;

-- Kabul edilmiş istekler için karşılıklı arkadaşlık yoksa isteği pending'e çevir
UPDATE public.friend_requests fr
SET status = 'pending'
WHERE status = 'accepted'
AND NOT EXISTS (
  SELECT 1 FROM public.friendships f
  WHERE (f.user_id = fr.sender_id AND f.friend_id = fr.receiver_id)
    AND EXISTS (
      SELECT 1 FROM public.friendships f2
      WHERE f2.user_id = fr.receiver_id AND f2.friend_id = fr.sender_id
    )
);

-- 2. Eski RLS politikalarını kaldır
DROP POLICY IF EXISTS "Users can view their own friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update requests they received" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Sender can delete their requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "System can insert friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can insert friendships for accepted requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can insert their own friendships" ON public.friendships;

-- 3. RLS'in aktif olduğundan emin ol
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 4. Yeni RLS politikaları

-- Friend Requests RLS
-- Kendi isteklerini görebilir (gönderen veya alıcı olduğu)
CREATE POLICY "Users can view their own friend requests"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Sadece kendisi adına istek gönderebilir
CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id 
    AND sender_id != receiver_id
  );

-- Sadece kendine gelen isteği güncelleyebilir
CREATE POLICY "Users can update requests they received"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Gönderdiği veya aldığı isteği silebilir
CREATE POLICY "Users can delete their own requests"
  ON public.friend_requests FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Friendships RLS
-- Sadece kendi arkadaşlıklarını görebilir (user_id kendisi olan)
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id);

-- Kendi arkadaşlığını ekleyebilir
CREATE POLICY "Users can insert their own friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND user_id != friend_id
  );

-- Kendi arkadaşlığını silebilir
CREATE POLICY "Users can delete their own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Orphan kayıtları temizle (var olmayan kullanıcılara ait)
DELETE FROM public.friendships f
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = f.user_id)
   OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = f.friend_id);

DELETE FROM public.friend_requests fr
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = fr.sender_id)
   OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = fr.receiver_id);

-- 6. Arkadaşlık silindiğinde karşı tarafı da silen trigger
-- Önce eski trigger'ı kaldır
DROP TRIGGER IF EXISTS delete_reverse_friendship ON public.friendships;
DROP FUNCTION IF EXISTS delete_reverse_friendship_fn();

-- Fonksiyon oluştur
CREATE OR REPLACE FUNCTION delete_reverse_friendship_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Karşı taraftaki arkadaşlığı sil (eğer varsa)
  DELETE FROM public.friendships
  WHERE user_id = OLD.friend_id
    AND friend_id = OLD.user_id;
  
  RETURN OLD;
END;
$$;

-- Trigger oluştur
CREATE TRIGGER delete_reverse_friendship
  AFTER DELETE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION delete_reverse_friendship_fn();

-- Bilgilendirme
DO $$
BEGIN
  RAISE NOTICE 'Arkadaşlık sistemi düzeltmeleri tamamlandı!';
  RAISE NOTICE '- Tutarsız veriler temizlendi';
  RAISE NOTICE '- RLS politikaları güncellendi';
  RAISE NOTICE '- Karşılıklı silme trigger''ı eklendi';
END $$;
