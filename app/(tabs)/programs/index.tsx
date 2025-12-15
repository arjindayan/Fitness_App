import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable } from 'react-native-gesture-handler';

import { PastelBackdrop } from '@/components/PastelBackdrop';
import { useProgramList, fromDayIndex, useDeleteProgramMutation } from '@/services/programService';
import { TRAINING_DAYS } from '@/constants/trainingDays';
import { Theme, useTheme } from '@/theme';

export default function ProgramsScreen() {
  const router = useRouter();
  const { data, isLoading } = useProgramList();
  const deleteMutation = useDeleteProgramMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleDelete = async (programId: string) => {
    Alert.alert(
      'Programı Sil',
      'Bu programı silmek istediğine emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(programId);
            try {
              await deleteMutation.mutateAsync(programId);
              // Swipeable'ı kapat
              swipeableRefs.current.get(programId)?.close();
            } catch (error) {
              console.error('Program silme hatası:', error);
              Alert.alert('Hata', 'Program silinemedi. Lütfen tekrar deneyin.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <PastelBackdrop />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Programların</Text>
            <Text style={styles.subtitle}>Zarif, dengeli ve senin için tasarlandı</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => router.push('/program-builder')}>
            <LinearGradient colors={['#c0e1ff', '#f6d9ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addButtonGradient} />
            <Text style={styles.addButtonText}>Yeni Program</Text>
          </Pressable>
        </View>
        {isLoading ? (
          <Text style={styles.copy}>Programlar yükleniyor...</Text>
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const dayLabels = item.workouts
                .map((workout) => TRAINING_DAYS.find((day) => day.key === fromDayIndex(workout.day_of_week))?.label)
                .filter(Boolean)
                .join(' • ');

              const isDeleting = deletingId === item.id;

              const renderRightActions = () => (
                <Pressable
                  style={[styles.deleteAction, isDeleting && styles.deleteActionLoading]}
                  onPress={() => handleDelete(item.id)}
                  disabled={isDeleting}
                >
                  <Text style={styles.deleteText}>{isDeleting ? 'Siliniyor...' : 'Sil'}</Text>
                </Pressable>
              );

              return (
                <Swipeable
                  ref={(ref) => swipeableRefs.current.set(item.id, ref)}
                  renderRightActions={renderRightActions}
                  overshootRight={false}
                >
                  <Pressable
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    onPress={() => router.push(`/(tabs)/programs/${item.id}`)}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.78)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <View style={styles.focusPill}>
                        <Text style={styles.focusPillText}>{item.focus ?? 'Genel'}</Text>
                      </View>
                    </View>
                    <View style={styles.cardMetaRow}>
                      <Text style={styles.cardMeta}>{item.workouts.length} workout</Text>
                      <View style={styles.metaDot} />
                      <Text style={styles.cardMeta}>{dayLabels}</Text>
                    </View>
                  </Pressable>
                </Swipeable>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
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
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: theme.colors.muted,
    marginTop: 6,
    fontSize: 14,
  },
  copy: {
    color: theme.colors.muted,
    fontSize: 16,
  },
  addButton: {
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: '#7b8dbd',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  addButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  addButtonText: {
    color: '#1a2a52',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    gap: 14,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#a2b4d8',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    overflow: 'hidden',
    gap: 10,
  },
  cardPressed: {
    transform: [{ translateY: 2 }],
    shadowOpacity: 0.25,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    // Açık renkli gradient üzerinde her iki temada da okunaklı sabit koyu renk
    color: '#1a2a52',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.1,
    maxWidth: '70%',
  },
  focusPill: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  focusPillText: {
    color: '#3b4a6b',
    fontWeight: '700',
    fontSize: 12,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardMeta: {
    color: '#4c5b82',
    fontWeight: '500',
  },
  metaDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#b4c7ee',
  },
  deleteAction: {
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff9fa5',
    borderRadius: 18,
    marginLeft: 8,
    shadowColor: '#ff9fa5',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  deleteActionLoading: {
    opacity: 0.6,
  },
  deleteText: {
    color: '#1a0a11',
    fontWeight: '800',
  },
});
