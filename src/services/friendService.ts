import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { supabase } from '@/lib/supabase';
import { FriendRequest, Friendship, Profile } from '@/types/profile';

const FRIEND_REQUESTS_KEY = ['friend-requests'];
const FRIENDSHIPS_KEY = ['friendships'];

// Kullanıcıyı user_code ile ara
export async function searchUserByCode(userCode: string): Promise<Profile | null> {
  const searchCode = userCode.toUpperCase().trim();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, user_code, avatar_url, goal')
    .eq('user_code', searchCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

// Arkadaşlık isteği gönder
export async function sendFriendRequest(receiverId: string): Promise<FriendRequest> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Oturum açılmamış');
  }

  // Kendine istek gönderemez
  if (user.id === receiverId) {
    throw new Error('Kendinize arkadaşlık isteği gönderemezsiniz');
  }

  // Alıcı kullanıcı var mı kontrol et
  const { data: receiverProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', receiverId)
    .maybeSingle();

  if (profileError || !receiverProfile) {
    throw new Error('Kullanıcı bulunamadı');
  }

  // Zaten arkadaş mı kontrol et
  const { data: existingFriendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id', user.id)
    .eq('friend_id', receiverId)
    .maybeSingle();

  if (existingFriendship) {
    throw new Error('Bu kişi zaten arkadaşınız');
  }

  // Bekleyen istek var mı kontrol et (her iki yönde)
  const { data: existingRequest } = await supabase
    .from('friend_requests')
    .select('id, status, sender_id')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingRequest) {
    if (existingRequest.sender_id === receiverId) {
      throw new Error('Bu kişi size zaten istek göndermiş! İstekler sekmesinden kabul edebilirsiniz.');
    }
    throw new Error('Bu kişiye zaten istek gönderdiniz');
  }

  const { data, error } = await supabase
    .from('friend_requests')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Bu kişiye zaten istek gönderilmiş');
    }
    throw error;
  }

  return data;
}

// Gelen arkadaşlık isteklerini getir
export async function fetchIncomingRequests(): Promise<FriendRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Oturum açılmamış');
  }

  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const requests = data ?? [];
  const enrichedRequests: FriendRequest[] = [];

  for (const request of requests) {
    // Ekstra güvenlik kontrolü
    if (request.receiver_id !== user.id) continue;

    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('id, display_name, user_code, avatar_url')
      .eq('id', request.sender_id)
      .single();

    enrichedRequests.push({
      ...request,
      sender: senderProfile ?? undefined,
    });
  }

  return enrichedRequests;
}

// Gönderilen arkadaşlık isteklerini getir
export async function fetchOutgoingRequests(): Promise<FriendRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Oturum açılmamış');
  }

  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('sender_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const requests = data ?? [];
  const enrichedRequests: FriendRequest[] = [];

  for (const request of requests) {
    // Ekstra güvenlik kontrolü
    if (request.sender_id !== user.id) continue;

    const { data: receiverProfile } = await supabase
      .from('profiles')
      .select('id, display_name, user_code, avatar_url')
      .eq('id', request.receiver_id)
      .single();

    enrichedRequests.push({
      ...request,
      receiver: receiverProfile ?? undefined,
    });
  }

  return enrichedRequests;
}

// Arkadaşlık isteğini kabul et
export async function acceptFriendRequest(requestId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Oturum açılmamış');
  }

  // İsteği bul ve kontrol et
  const { data: request, error: fetchError } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    throw new Error('İstek bulunamadı');
  }

  // Sadece alıcı kabul edebilir
  if (request.receiver_id !== user.id) {
    throw new Error('Bu isteği kabul etme yetkiniz yok');
  }

  // Zaten işlenmiş mi?
  if (request.status !== 'pending') {
    throw new Error('Bu istek zaten işlenmiş');
  }

  // Zaten arkadaş mı kontrol et
  const { data: existingFriendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id', user.id)
    .eq('friend_id', request.sender_id)
    .maybeSingle();

  if (existingFriendship) {
    // Zaten arkadaşsa sadece isteği güncelle
    await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    return;
  }

  // İsteği kabul et
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (updateError) {
    throw updateError;
  }

  // İki yönlü arkadaşlık oluştur - önce alıcı tarafı (mevcut kullanıcı)
  const { error: friendship1Error } = await supabase
    .from('friendships')
    .insert({ user_id: user.id, friend_id: request.sender_id });

  if (friendship1Error && friendship1Error.code !== '23505') {
    // 23505 = unique violation (zaten var demek, sorun değil)
    throw friendship1Error;
  }

  // Sonra gönderen tarafı
  const { error: friendship2Error } = await supabase
    .from('friendships')
    .insert({ user_id: request.sender_id, friend_id: user.id });

  if (friendship2Error && friendship2Error.code !== '23505') {
    throw friendship2Error;
  }
}

// Arkadaşlık isteğini reddet
export async function rejectFriendRequest(requestId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Oturum açılmamış');
  }

  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('receiver_id', user.id);

  if (error) {
    throw error;
  }
}

// Arkadaşlık isteğini iptal et (gönderen tarafından)
export async function cancelFriendRequest(requestId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Oturum açılmamış');
  }

  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId)
    .eq('sender_id', user.id);

  if (error) {
    throw error;
  }
}

// Arkadaşları getir
export async function fetchFriendships(): Promise<Friendship[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Oturum açılmamış');
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Friend bilgilerini ayrı çek
  const friendships = data ?? [];
  const enrichedFriendships: Friendship[] = [];

  for (const friendship of friendships) {
    const { data: friendProfile } = await supabase
      .from('profiles')
      .select('id, display_name, user_code, avatar_url, goal')
      .eq('id', friendship.friend_id)
      .single();

    enrichedFriendships.push({
      ...friendship,
      friend: friendProfile ?? undefined,
    });
  }

  return enrichedFriendships;
}

// Arkadaşlığı sonlandır
// NOT: Veritabanı trigger'ı karşı tarafın arkadaşlığını otomatik siler
export async function removeFriend(friendshipId: string, friendId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Oturum açılmamış');
  }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', user.id)
    .eq('friend_id', friendId);

  if (error) {
    throw new Error('Arkadaşlık sonlandırılamadı');
  }
}

// React Query Hooks

export function useSearchUserByCode() {
  return useMutation({
    mutationFn: searchUserByCode,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_KEY });
    },
  });
}

export function useIncomingRequests(userId?: string) {
  return useQuery({
    queryKey: [...FRIEND_REQUESTS_KEY, 'incoming', userId],
    queryFn: fetchIncomingRequests,
    enabled: !!userId, // userId yoksa sorgu çalışmasın
  });
}

export function useOutgoingRequests(userId?: string) {
  return useQuery({
    queryKey: [...FRIEND_REQUESTS_KEY, 'outgoing', userId],
    queryFn: fetchOutgoingRequests,
    enabled: !!userId, // userId yoksa sorgu çalışmasın
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_KEY });
      queryClient.invalidateQueries({ queryKey: FRIENDSHIPS_KEY });
    },
  });
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_KEY });
    },
  });
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_KEY });
    },
  });
}

export function useFriendships(userId?: string) {
  return useQuery({
    queryKey: [...FRIENDSHIPS_KEY, userId],
    queryFn: fetchFriendships,
    enabled: !!userId, // userId yoksa sorgu çalışmasın
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ friendshipId, friendId }: { friendshipId: string; friendId: string }) =>
      removeFriend(friendshipId, friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIENDSHIPS_KEY });
    },
  });
}

// =====================================================
// BUGÜN ANTRENMAN YAPACAK ARKADAŞLAR
// =====================================================

const FRIENDS_TODAY_KEY = ['friends-today-workouts'];
const WORKOUT_INVITES_KEY = ['workout-invites'];

export type FriendTodayWorkout = {
  friendId: string;
  friendName: string;
  friendCode: string;
  friendAvatar: string | null;
  workoutTitle: string;
  programTitle: string;
  status: 'pending' | 'done' | 'skipped';
  scheduleId: string;
};

// Arkadaşların bugünkü antrenmanlarını getir
export async function fetchFriendsTodayWorkouts(): Promise<FriendTodayWorkout[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Oturum açılmamış');
  }

  // Önce arkadaşları al
  const { data: friendships, error: friendError } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', user.id);

  if (friendError) {
    throw friendError;
  }

  if (!friendships || friendships.length === 0) {
    return [];
  }

  const friendIds = friendships.map(f => f.friend_id);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Arkadaşların bugünkü antrenmanlarını al
  const { data: schedules, error: scheduleError } = await supabase
    .from('schedule_instances')
    .select(`
      id,
      status,
      program_id,
      workout_id,
      programs(title, owner_id),
      program_workouts(title)
    `)
    .eq('scheduled_date', today)
    .in('programs.owner_id', friendIds);

  if (scheduleError) {
    throw scheduleError;
  }

  // Arkadaş profillerini al
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, user_code, avatar_url')
    .in('id', friendIds);

  if (profileError) {
    throw profileError;
  }

  const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);

  // Sonuçları birleştir
  const results: FriendTodayWorkout[] = [];
  
  for (const schedule of schedules ?? []) {
    const ownerId = (schedule.programs as any)?.owner_id;
    if (!ownerId || !friendIds.includes(ownerId)) continue;
    
    const profile = profileMap.get(ownerId);
    if (!profile) continue;

    results.push({
      friendId: ownerId,
      friendName: profile.display_name ?? 'Kullanıcı',
      friendCode: profile.user_code ?? '',
      friendAvatar: profile.avatar_url,
      workoutTitle: (schedule.program_workouts as any)?.title ?? 'Antrenman',
      programTitle: (schedule.programs as any)?.title ?? 'Program',
      status: schedule.status as 'pending' | 'done' | 'skipped',
      scheduleId: schedule.id,
    });
  }

  return results;
}

export function useFriendsTodayWorkouts(userId?: string) {
  return useQuery({
    queryKey: [...FRIENDS_TODAY_KEY, userId],
    queryFn: fetchFriendsTodayWorkouts,
    enabled: !!userId,
  });
}

// =====================================================
// BERABER İDMAN DAVETLERİ
// =====================================================

export type WorkoutInvite = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  invite_date: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender?: {
    display_name: string | null;
    user_code: string | null;
    avatar_url: string | null;
  };
};

// Beraber idman daveti gönder
export async function sendWorkoutInvite(receiverId: string, message?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Oturum açılmamış');
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  const { error } = await supabase
    .from('workout_invites')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      message: message ?? null,
      invite_date: today,
      status: 'pending',
    });

  if (error) {
    throw error;
  }
}

// Gelen idman davetlerini getir
export async function fetchIncomingWorkoutInvites(): Promise<WorkoutInvite[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Oturum açılmamış');
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('workout_invites')
    .select('*')
    .eq('receiver_id', user.id)
    .eq('invite_date', today)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Sender bilgilerini al
  const invites = data ?? [];
  const enrichedInvites: WorkoutInvite[] = [];

  for (const invite of invites) {
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name, user_code, avatar_url')
      .eq('id', invite.sender_id)
      .single();

    enrichedInvites.push({
      ...invite,
      sender: senderProfile ?? undefined,
    });
  }

  return enrichedInvites;
}

// Davet durumunu güncelle
export async function respondToWorkoutInvite(inviteId: string, status: 'accepted' | 'rejected'): Promise<void> {
  const { error } = await supabase
    .from('workout_invites')
    .update({ status })
    .eq('id', inviteId);

  if (error) {
    throw error;
  }
}

export function useSendWorkoutInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ receiverId, message }: { receiverId: string; message?: string }) =>
      sendWorkoutInvite(receiverId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_INVITES_KEY });
    },
  });
}

export function useIncomingWorkoutInvites(userId?: string) {
  return useQuery({
    queryKey: [...WORKOUT_INVITES_KEY, 'incoming', userId],
    queryFn: fetchIncomingWorkoutInvites,
    enabled: !!userId,
  });
}

export function useRespondToWorkoutInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inviteId, status }: { inviteId: string; status: 'accepted' | 'rejected' }) =>
      respondToWorkoutInvite(inviteId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_INVITES_KEY });
    },
  });
}

