-- =====================================================
-- BUGÜNKÜ İDMAN GRUPLARI
-- =====================================================
-- Akış:
-- 1) workout_invites kabul edilince bugün için bir grup oluşur (2 kişi).
-- 2) Gruba yeni biri katılmak isterse, gruptaki tüm üyelere toplu istek gider.
-- 3) Tüm üyeler kabul ederse kişi gruba eklenir, biri reddederse istek reddedilir.

-- 1) Grup tablosu
CREATE TABLE IF NOT EXISTS public.workout_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_groups_date ON public.workout_groups(workout_date);

-- 2) Grup üyeleri
CREATE TABLE IF NOT EXISTS public.workout_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.workout_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_group_member UNIQUE (group_id, user_id),
  CONSTRAINT unique_daily_group_membership UNIQUE (workout_date, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workout_group_members_user ON public.workout_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_group_members_group ON public.workout_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_workout_group_members_date ON public.workout_group_members(workout_date);

-- 3) Gruba katılma istekleri
CREATE TABLE IF NOT EXISTS public.workout_group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.workout_groups(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_group_join_request UNIQUE (group_id, requester_id, workout_date),
  CONSTRAINT no_self_join_request CHECK (requester_id != target_user_id)
);

CREATE INDEX IF NOT EXISTS idx_workout_group_join_requests_group ON public.workout_group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_workout_group_join_requests_requester ON public.workout_group_join_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_workout_group_join_requests_target ON public.workout_group_join_requests(target_user_id);
CREATE INDEX IF NOT EXISTS idx_workout_group_join_requests_date ON public.workout_group_join_requests(workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_group_join_requests_status ON public.workout_group_join_requests(status);

-- 4) Üye onayları (her üye bir oy verir)
CREATE TABLE IF NOT EXISTS public.workout_group_join_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.workout_group_join_requests(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_join_vote UNIQUE (request_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_workout_group_join_votes_request ON public.workout_group_join_votes(request_id);
CREATE INDEX IF NOT EXISTS idx_workout_group_join_votes_voter ON public.workout_group_join_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_workout_group_join_votes_status ON public.workout_group_join_votes(status);

-- RLS
ALTER TABLE public.workout_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_group_join_votes ENABLE ROW LEVEL SECURITY;

-- SELECT: kullanıcı sadece üyesi olduğu grupları görsün
DROP POLICY IF EXISTS "Users can view their own workout groups" ON public.workout_groups;
CREATE POLICY "Users can view their own workout groups"
  ON public.workout_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.workout_group_members m
      WHERE m.group_id = workout_groups.id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view their own group memberships" ON public.workout_group_members;
CREATE POLICY "Users can view their own group memberships"
  ON public.workout_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.workout_group_members m
      WHERE m.group_id = workout_group_members.group_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view join requests they are part of" ON public.workout_group_join_requests;
CREATE POLICY "Users can view join requests they are part of"
  ON public.workout_group_join_requests FOR SELECT
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.workout_group_members m
      WHERE m.group_id = workout_group_join_requests.group_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view their own join votes" ON public.workout_group_join_votes;
CREATE POLICY "Users can view their own join votes"
  ON public.workout_group_join_votes FOR SELECT
  USING (voter_id = auth.uid());

-- =====================================================
-- RPC Fonksiyonları (SECURITY DEFINER)
-- =====================================================

-- Helper: bir kullanıcının bugünkü grubunu bul
CREATE OR REPLACE FUNCTION public.get_today_workout_group_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.group_id
  FROM public.workout_group_members m
  WHERE m.user_id = p_user_id
    AND m.workout_date = CURRENT_DATE
  LIMIT 1;
$$;

-- Daveti yanıtla: kabul edilirse bugünkü grup oluştur
CREATE OR REPLACE FUNCTION public.respond_to_workout_invite(p_invite_id UUID, p_new_status TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender UUID;
  v_receiver UUID;
  v_invite_date DATE;
  v_group_id UUID;
BEGIN
  IF p_new_status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT sender_id, receiver_id, invite_date
    INTO v_sender, v_receiver, v_invite_date
  FROM public.workout_invites
  WHERE id = p_invite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF v_receiver != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_invite_date != CURRENT_DATE THEN
    RAISE EXCEPTION 'Invite is not for today';
  END IF;

  UPDATE public.workout_invites
  SET status = p_new_status,
      updated_at = NOW()
  WHERE id = p_invite_id
    AND receiver_id = auth.uid();

  IF p_new_status != 'accepted' THEN
    RETURN NULL;
  END IF;

  -- Bugün bir gruptalarsa direkt grup oluşturma (daveti zaten RPC ile engelliyoruz)
  IF public.get_today_workout_group_id(v_sender) IS NOT NULL OR public.get_today_workout_group_id(v_receiver) IS NOT NULL THEN
    RAISE EXCEPTION 'One of the users is already in a workout group today';
  END IF;

  INSERT INTO public.workout_groups (workout_date, created_by)
  VALUES (CURRENT_DATE, auth.uid())
  RETURNING id INTO v_group_id;

  INSERT INTO public.workout_group_members (group_id, user_id, workout_date)
  VALUES
    (v_group_id, v_sender, CURRENT_DATE),
    (v_group_id, v_receiver, CURRENT_DATE);

  RETURN v_group_id;
END;
$$;

-- Davet gönder: hedef veya gönderen gruptaysa "toplu katılım isteği" oluştur, değilse normal invite at
CREATE OR REPLACE FUNCTION public.send_workout_invite_or_group_request(p_receiver_id UUID, p_message TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID;
  v_sender_group UUID;
  v_receiver_group UUID;
  v_group_id UUID;
  v_invite_id UUID;
  v_request_id UUID;
  v_member RECORD;
BEGIN
  v_sender_id := auth.uid();
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_receiver_id = v_sender_id THEN
    RAISE EXCEPTION 'Cannot invite yourself';
  END IF;

  v_sender_group := public.get_today_workout_group_id(v_sender_id);
  v_receiver_group := public.get_today_workout_group_id(p_receiver_id);

  -- İkisi de gruptaysa
  IF v_sender_group IS NOT NULL AND v_receiver_group IS NOT NULL THEN
    IF v_sender_group = v_receiver_group THEN
      RAISE EXCEPTION 'Already in the same workout group';
    END IF;
    RAISE EXCEPTION 'Users are in different workout groups';
  END IF;

  -- Grup yoksa normal invite
  IF v_sender_group IS NULL AND v_receiver_group IS NULL THEN
    INSERT INTO public.workout_invites (sender_id, receiver_id, message, status, invite_date)
    VALUES (v_sender_id, p_receiver_id, p_message, 'pending', CURRENT_DATE)
    ON CONFLICT (sender_id, receiver_id, invite_date)
    DO UPDATE SET
      message = EXCLUDED.message,
      status = 'pending',
      updated_at = NOW()
    RETURNING id INTO v_invite_id;

    RETURN jsonb_build_object('type', 'invite', 'id', v_invite_id);
  END IF;

  -- Grup varsa: katılım isteği (tüm üyelere oy oluştur)
  v_group_id := COALESCE(v_sender_group, v_receiver_group);

  INSERT INTO public.workout_group_join_requests (group_id, requester_id, target_user_id, message, workout_date, status, updated_at)
  VALUES (v_group_id, v_sender_id, p_receiver_id, p_message, CURRENT_DATE, 'pending', NOW())
  ON CONFLICT (group_id, requester_id, workout_date)
  DO UPDATE SET
    target_user_id = EXCLUDED.target_user_id,
    message = EXCLUDED.message,
    status = 'pending',
    updated_at = NOW()
  RETURNING id INTO v_request_id;

  -- Mevcut oyları tekrar pending'e çek
  FOR v_member IN
    SELECT user_id FROM public.workout_group_members WHERE group_id = v_group_id
  LOOP
    INSERT INTO public.workout_group_join_votes (request_id, voter_id, status, updated_at)
    VALUES (v_request_id, v_member.user_id, 'pending', NOW())
    ON CONFLICT (request_id, voter_id)
    DO UPDATE SET status = 'pending', updated_at = NOW();
  END LOOP;

  RETURN jsonb_build_object('type', 'group_request', 'id', v_request_id);
END;
$$;

-- Gruba katılım isteğine oy ver: herkes kabul ederse requester gruba eklenir
CREATE OR REPLACE FUNCTION public.respond_to_workout_group_join_request(p_request_id UUID, p_new_status TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voter_id UUID;
  v_group_id UUID;
  v_requester_id UUID;
  v_total_votes INT;
  v_accepted_votes INT;
  v_rejected_votes INT;
BEGIN
  v_voter_id := auth.uid();
  IF v_voter_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_new_status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT group_id, requester_id
    INTO v_group_id, v_requester_id
  FROM public.workout_group_join_requests
  WHERE id = p_request_id
    AND workout_date = CURRENT_DATE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Voter bu istekte oy kullanabiliyor mu?
  IF NOT EXISTS (
    SELECT 1 FROM public.workout_group_join_votes
    WHERE request_id = p_request_id AND voter_id = v_voter_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.workout_group_join_votes
  SET status = p_new_status,
      updated_at = NOW()
  WHERE request_id = p_request_id
    AND voter_id = v_voter_id;

  SELECT
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE status = 'accepted')::INT,
    COUNT(*) FILTER (WHERE status = 'rejected')::INT
  INTO v_total_votes, v_accepted_votes, v_rejected_votes
  FROM public.workout_group_join_votes
  WHERE request_id = p_request_id;

  IF v_rejected_votes > 0 THEN
    UPDATE public.workout_group_join_requests
    SET status = 'rejected', updated_at = NOW()
    WHERE id = p_request_id;
    RETURN 'rejected';
  END IF;

  IF v_total_votes > 0 AND v_accepted_votes = v_total_votes THEN
    -- requester zaten başka bir gruptaysa engelle (unique_daily_group_membership ile)
    INSERT INTO public.workout_group_members (group_id, user_id, workout_date)
    VALUES (v_group_id, v_requester_id, CURRENT_DATE);

    UPDATE public.workout_group_join_requests
    SET status = 'accepted', updated_at = NOW()
    WHERE id = p_request_id;

    RETURN 'accepted';
  END IF;

  RETURN 'pending';
END;
$$;

