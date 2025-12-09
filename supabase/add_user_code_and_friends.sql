-- 1. Profiles tablosuna unique user_code ekle
-- Bu kod arkadaş eklemek için kullanılacak (örn: FIT-ABC123)

-- user_code sütununu ekle
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_code VARCHAR(10) UNIQUE;

-- Mevcut kullanıcılar için user_code üret
-- Rastgele 6 karakterlik alfanumerik kod
UPDATE public.profiles
SET user_code = 'FIT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
WHERE user_code IS NULL;

-- Yeni kullanıcılar için otomatik user_code üretme fonksiyonu
CREATE OR REPLACE FUNCTION generate_user_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code VARCHAR(10);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- FIT- prefix + 6 karakter alfanumerik
    new_code := 'FIT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Benzersiz mi kontrol et
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  NEW.user_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı oluştur (eğer yoksa)
DROP TRIGGER IF EXISTS set_user_code ON public.profiles;
CREATE TRIGGER set_user_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.user_code IS NULL)
  EXECUTE FUNCTION generate_user_code();

-- 2. Arkadaşlık İstekleri Tablosu
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Aynı kişiye birden fazla istek gönderilemesin
  CONSTRAINT unique_friend_request UNIQUE (sender_id, receiver_id),
  -- Kendine istek gönderilemez
  CONSTRAINT no_self_request CHECK (sender_id != receiver_id)
);

-- 3. Arkadaşlıklar Tablosu
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Her arkadaşlık çifti sadece bir kez olsun
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
  -- Kendisiyle arkadaş olamaz
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_code ON public.profiles(user_code);

-- RLS Politikaları
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Friend Requests RLS
CREATE POLICY "Users can view their own friend requests"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update requests they received"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own requests"
  ON public.friend_requests FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Friendships RLS
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "System can insert friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

