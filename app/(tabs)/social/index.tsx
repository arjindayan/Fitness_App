import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { PastelBackdrop } from '@/components/PastelBackdrop';
import {
  useSearchUserByCode,
  useSendFriendRequest,
  useIncomingRequests,
  useOutgoingRequests,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useCancelFriendRequest,
  useFriendships,
  useRemoveFriend,
  useFriendsTodayWorkouts,
  useSendWorkoutInvite,
  useIncomingWorkoutInvites,
  useRespondToWorkoutInvite,
} from '@/services/friendService';
import { useSessionContext } from '@/state/SessionProvider';
import { theme } from '@/theme';

type TabType = 'today' | 'friends' | 'requests';

export default function SocialScreen() {
  const { profile } = useSessionContext();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchCode, setSearchCode] = useState('');

  // Hooks
  const searchUser = useSearchUserByCode();
  const sendRequest = useSendFriendRequest();
  const { data: incomingRequests = [], isLoading: loadingIncoming } = useIncomingRequests();
  const { data: outgoingRequests = [], isLoading: loadingOutgoing } = useOutgoingRequests();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const { data: friendships = [], isLoading: loadingFriends } = useFriendships();
  const removeFriend = useRemoveFriend();
  
  // Bugün antrenman yapacak arkadaşlar
  const { data: friendsTodayWorkouts = [], isLoading: loadingTodayWorkouts } = useFriendsTodayWorkouts();
  const sendWorkoutInvite = useSendWorkoutInvite();
  const { data: workoutInvites = [], isLoading: loadingInvites } = useIncomingWorkoutInvites();
  const respondInvite = useRespondToWorkoutInvite();

  const handleCopyCode = async () => {
    if (profile?.user_code) {
      await Clipboard.setStringAsync(profile.user_code);
      Alert.alert('Kopyalandı!', 'Arkadaş kodun panoya kopyalandı.');
    }
  };

  const handleShareCode = async () => {
    if (profile?.user_code) {
      await Share.share({
        message: `FitnessXS'te beraber antrenman yapalım! Arkadaş kodum: ${profile.user_code}`,
      });
    }
  };

  const handleSearch = async () => {
    if (!searchCode.trim()) {
      Alert.alert('Hata', 'Lütfen bir arkadaş kodu gir');
      return;
    }

    if (searchCode.toUpperCase().trim() === profile?.user_code) {
      Alert.alert('Hata', 'Kendinizi arkadaş olarak ekleyemezsiniz');
      return;
    }

    try {
      const user = await searchUser.mutateAsync(searchCode);
      
      if (!user) {
        Alert.alert('Bulunamadı', 'Bu kodla eşleşen kullanıcı bulunamadı');
        return;
      }

      Alert.alert(
        'Kullanıcı Bulundu',
        `${user.display_name ?? 'Kullanıcı'} kişisine arkadaşlık isteği göndermek ister misin?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'İstek Gönder',
            onPress: async () => {
              try {
                await sendRequest.mutateAsync(user.id);
                Alert.alert('Başarılı', 'Arkadaşlık isteği gönderildi!');
                setSearchCode('');
                setSearchModalVisible(false);
              } catch (error: any) {
                Alert.alert('Hata', error.message ?? 'İstek gönderilemedi');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Hata', error.message ?? 'Arama yapılamadı');
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    Alert.alert('Onayla', 'Bu arkadaşlık isteğini kabul etmek istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kabul Et',
        onPress: async () => {
          try {
            await acceptRequest.mutateAsync(requestId);
            Alert.alert('Başarılı', 'Artık arkadaşsınız!');
          } catch (error: any) {
            Alert.alert('Hata', error.message ?? 'İstek kabul edilemedi');
          }
        },
      },
    ]);
  };

  const handleRejectRequest = (requestId: string) => {
    Alert.alert('Reddet', 'Bu arkadaşlık isteğini reddetmek istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectRequest.mutateAsync(requestId);
          } catch (error: any) {
            Alert.alert('Hata', error.message ?? 'İstek reddedilemedi');
          }
        },
      },
    ]);
  };

  const handleCancelRequest = (requestId: string) => {
    Alert.alert('İptal', 'Gönderdiğin isteği iptal etmek istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelRequest.mutateAsync(requestId);
          } catch (error: any) {
            Alert.alert('Hata', error.message ?? 'İstek iptal edilemedi');
          }
        },
      },
    ]);
  };

  const handleRemoveFriend = (friendshipId: string, friendId: string, friendName: string) => {
    Alert.alert(
      'Arkadaşlığı Sonlandır',
      `${friendName} ile arkadaşlığını sonlandırmak istiyor musun?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sonlandır',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend.mutateAsync({ friendshipId, friendId });
            } catch (error: any) {
              Alert.alert('Hata', error.message ?? 'Arkadaşlık sonlandırılamadı');
            }
          },
        },
      ]
    );
  };

  const handleSendWorkoutInvite = (friendId: string, friendName: string) => {
    Alert.alert(
      'İdman Daveti',
      `${friendName} kişisine bugün beraber idman yapalım mı daveti göndermek ister misin?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Davet Gönder',
          onPress: async () => {
            try {
              await sendWorkoutInvite.mutateAsync({ receiverId: friendId, message: 'Bugün beraber idman yapalım mı?' });
              Alert.alert('Başarılı', 'İdman daveti gönderildi! 💪');
            } catch (error: any) {
              Alert.alert('Hata', error.message ?? 'Davet gönderilemedi');
            }
          },
        },
      ]
    );
  };

  const handleRespondInvite = (inviteId: string, status: 'accepted' | 'rejected', senderName: string) => {
    const message = status === 'accepted' 
      ? `${senderName} ile bugün beraber idman yapacaksın! 🎉`
      : 'Davet reddedildi.';
    
    respondInvite.mutate({ inviteId, status }, {
      onSuccess: () => {
        if (status === 'accepted') {
          Alert.alert('Harika!', message);
        }
      },
      onError: (error: any) => {
        Alert.alert('Hata', error.message ?? 'İşlem yapılamadı');
      },
    });
  };

  const pendingRequestsCount = incomingRequests.length;
  const pendingInvitesCount = workoutInvites.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <PastelBackdrop />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sosyal</Text>
          <Pressable style={styles.addButton} onPress={() => setSearchModalVisible(true)}>
            <Text style={styles.addButtonText}>+ Arkadaş Ekle</Text>
          </Pressable>
        </View>

        {/* Kendi Kodun */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Senin Arkadaş Kodun</Text>
          {profile?.user_code ? (
            <>
              <Text style={styles.codeValue}>{profile.user_code}</Text>
              <View style={styles.codeActions}>
                <Pressable style={styles.codeButton} onPress={handleCopyCode}>
                  <Text style={styles.codeButtonText}>📋 Kopyala</Text>
                </Pressable>
                <Pressable style={styles.codeButton} onPress={handleShareCode}>
                  <Text style={styles.codeButtonText}>📤 Paylaş</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.codeLoading}>
              <ActivityIndicator color={theme.colors.primary} size="small" />
              <Text style={styles.codeLoadingText}>Kodun oluşturuluyor...</Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'today' && styles.tabActive]}
            onPress={() => setActiveTab('today')}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
              Bugün
            </Text>
            {pendingInvitesCount > 0 && <View style={styles.badge} />}
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
              Arkadaşlar ({friendships.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
              İstekler {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
            </Text>
            {pendingRequestsCount > 0 && <View style={styles.badge} />}
          </Pressable>
        </View>

        {/* Content */}
        {activeTab === 'today' ? (
          <ScrollView style={styles.requestsScroll} showsVerticalScrollIndicator={false}>
            {/* Gelen İdman Davetleri */}
            {workoutInvites.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>🔔 İdman Davetleri</Text>
                {workoutInvites.map((invite) => (
                  <View key={invite.id} style={styles.inviteCard}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {invite.sender?.display_name?.charAt(0).toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <View style={styles.inviteInfo}>
                      <Text style={styles.inviteName}>
                        {invite.sender?.display_name ?? 'Kullanıcı'}
                      </Text>
                      <Text style={styles.inviteMessage}>
                        {invite.message ?? 'Bugün beraber idman yapalım mı?'}
                      </Text>
                    </View>
                    <View style={styles.requestActions}>
                      <Pressable
                        style={styles.acceptButton}
                        onPress={() => handleRespondInvite(invite.id, 'accepted', invite.sender?.display_name ?? 'Arkadaşın')}
                      >
                        <Text style={styles.acceptText}>✓</Text>
                      </Pressable>
                      <Pressable
                        style={styles.rejectButton}
                        onPress={() => handleRespondInvite(invite.id, 'rejected', '')}
                      >
                        <Text style={styles.rejectText}>✕</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Bugün Antrenman Yapacak Arkadaşlar */}
            <Text style={[styles.sectionTitle, workoutInvites.length > 0 && { marginTop: 20 }]}>
              💪 Bugün Antrenman Yapacak Arkadaşlar
            </Text>
            {loadingTodayWorkouts ? (
              <ActivityIndicator color={theme.colors.text} style={{ marginTop: 20 }} />
            ) : friendsTodayWorkouts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🏋️</Text>
                <Text style={styles.emptyTitle}>Bugün idman yapan arkadaş yok</Text>
                <Text style={styles.emptyText}>
                  Arkadaşların bugün için antrenman planlamadı.
                </Text>
              </View>
            ) : (
              friendsTodayWorkouts.map((item, index) => (
                <View key={`${item.friendId}-${index}`} style={styles.todayWorkoutCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.friendName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.todayWorkoutInfo}>
                    <Text style={styles.todayWorkoutName}>{item.friendName}</Text>
                    <Text style={styles.todayWorkoutProgram}>{item.programTitle}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={[
                        styles.statusText,
                        item.status === 'done' && styles.statusDone,
                        item.status === 'pending' && styles.statusPending,
                      ]}>
                        {item.status === 'done' ? '✓ Tamamladı' : item.status === 'skipped' ? 'Atladı' : 'Bekliyor'}
                      </Text>
                    </View>
                  </View>
                  {item.status === 'pending' && (
                    <Pressable
                      style={styles.inviteButton}
                      onPress={() => handleSendWorkoutInvite(item.friendId, item.friendName)}
                    >
                      <Text style={styles.inviteButtonText}>Davet Et</Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        ) : activeTab === 'friends' ? (
          loadingFriends ? (
            <ActivityIndicator color={theme.colors.text} style={styles.loader} />
          ) : friendships.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>Henüz arkadaşın yok</Text>
              <Text style={styles.emptyText}>
                Arkadaşlarını ekle, birlikte antrenman yolculuğuna çık!
              </Text>
            </View>
          ) : (
            <FlatList
              data={friendships}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.friendCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.friend?.display_name?.charAt(0).toUpperCase() ?? '?'}
                    </Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{item.friend?.display_name ?? 'Kullanıcı'}</Text>
                    <Text style={styles.friendCode}>{item.friend?.user_code}</Text>
                    {item.friend?.goal && (
                      <Text style={styles.friendGoal}>🎯 {item.friend.goal}</Text>
                    )}
                  </View>
                  <Pressable
                    style={styles.removeButton}
                    onPress={() =>
                      handleRemoveFriend(
                        item.id,
                        item.friend_id,
                        item.friend?.display_name ?? 'Kullanıcı'
                      )
                    }
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </Pressable>
                </View>
              )}
            />
          )
        ) : (
          <ScrollView style={styles.requestsScroll}>
            {/* Gelen İstekler */}
            <Text style={styles.sectionTitle}>Gelen İstekler</Text>
            {loadingIncoming ? (
              <ActivityIndicator color={theme.colors.text} />
            ) : incomingRequests.length === 0 ? (
              <Text style={styles.emptyText}>Bekleyen istek yok</Text>
            ) : (
              incomingRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {request.sender?.display_name?.charAt(0).toUpperCase() ?? '?'}
                    </Text>
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {request.sender?.display_name ?? 'Kullanıcı'}
                    </Text>
                    <Text style={styles.requestCode}>{request.sender?.user_code}</Text>
                  </View>
                  <View style={styles.requestActions}>
                    <Pressable
                      style={styles.acceptButton}
                      onPress={() => handleAcceptRequest(request.id)}
                    >
                      <Text style={styles.acceptText}>✓</Text>
                    </Pressable>
                    <Pressable
                      style={styles.rejectButton}
                      onPress={() => handleRejectRequest(request.id)}
                    >
                      <Text style={styles.rejectText}>✕</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}

            {/* Gönderilen İstekler */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Gönderilen İstekler</Text>
            {loadingOutgoing ? (
              <ActivityIndicator color={theme.colors.text} />
            ) : outgoingRequests.length === 0 ? (
              <Text style={styles.emptyText}>Gönderilmiş istek yok</Text>
            ) : (
              outgoingRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {request.receiver?.display_name?.charAt(0).toUpperCase() ?? '?'}
                    </Text>
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {request.receiver?.display_name ?? 'Kullanıcı'}
                    </Text>
                    <Text style={styles.requestCode}>{request.receiver?.user_code}</Text>
                  </View>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => handleCancelRequest(request.id)}
                  >
                    <Text style={styles.cancelText}>İptal</Text>
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Arkadaş Arama Modal */}
      <Modal visible={searchModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setSearchModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Arkadaş Ekle</Text>
              <Pressable onPress={() => setSearchModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Arkadaşının kodunu gir (örn: FIT-ABC123)
            </Text>
            <TextInput
              style={styles.searchInput}
              placeholder="FIT-XXXXXX"
              placeholderTextColor={theme.colors.subtle}
              value={searchCode}
              onChangeText={setSearchCode}
              autoCapitalize="characters"
              autoFocus
            />
            <Pressable
              style={[styles.searchButton, searchUser.isPending && styles.buttonDisabled]}
              onPress={handleSearch}
              disabled={searchUser.isPending}
            >
              <Text style={styles.searchButtonText}>
                {searchUser.isPending ? 'Aranıyor...' : 'Ara ve Ekle'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#b8c7ff',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  addButtonText: {
    color: '#1a2a52',
    fontWeight: '700',
  },
  codeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#a2b4d8',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  codeLabel: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  codeValue: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  codeLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  codeLoadingText: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  codeButton: {
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  codeButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: theme.colors.surface,
    shadowColor: '#a2b4d8',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  tabText: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.danger,
  },
  loader: {
    marginTop: 40,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    gap: 12,
    paddingBottom: 20,
  },
  friendCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#1a2a52',
    fontSize: 20,
    fontWeight: '800',
  },
  friendInfo: {
    flex: 1,
    gap: 2,
  },
  friendName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  friendCode: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  friendGoal: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  removeButtonText: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  requestsScroll: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  requestInfo: {
    flex: 1,
    gap: 2,
  },
  requestName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  requestCode: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f6f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c7e8db',
  },
  acceptText: {
    color: '#2d8a5f',
    fontSize: 18,
    fontWeight: '700',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffecef',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffd4db',
  },
  rejectText: {
    color: theme.colors.danger,
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelText: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  modalClose: {
    color: theme.colors.muted,
    fontSize: 24,
    padding: 4,
  },
  modalSubtitle: {
    color: theme.colors.muted,
  },
  searchInput: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#b8c7ff',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#1a2a52',
    fontSize: 16,
    fontWeight: '700',
  },
  // Bugün Antrenman Yapacaklar
  todayWorkoutCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  todayWorkoutInfo: {
    flex: 1,
    gap: 2,
  },
  todayWorkoutName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  todayWorkoutProgram: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  statusBadge: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  statusDone: {
    color: '#2d8a5f',
  },
  statusPending: {
    color: theme.colors.accent,
  },
  inviteButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  inviteButtonText: {
    color: '#1a2a52',
    fontWeight: '700',
    fontSize: 13,
  },
  // Davet kartı
  inviteCard: {
    backgroundColor: '#e8f4e8',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#c7e8db',
    marginBottom: 10,
  },
  inviteInfo: {
    flex: 1,
    gap: 2,
  },
  inviteName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  inviteMessage: {
    color: theme.colors.muted,
    fontSize: 13,
  },
});
