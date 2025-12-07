import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TRAINING_DAYS } from '@/constants/trainingDays';
import { fromDayIndex } from '@/services/programService';
import { useTodayPlan, useUpdateScheduleStatus } from '@/services/scheduleService';
import { useSessionContext } from '@/state/SessionProvider';
import { theme } from '@/theme';

export default function TodayScreen() {
  const router = useRouter();
  const { profile } = useSessionContext();
  const { data, isLoading } = useTodayPlan();
  const updateStatus = useUpdateScheduleStatus();

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Plan yükleniyor...</Text>
        </View>
      );
    }

    if (!data || data.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Bugün için plan yok</Text>
          <Text style={styles.emptyCopy}>Aktif bir program oluşturup günlere ata.</Text>
          <Pressable style={styles.cta} onPress={() => router.push('/(tabs)/programs')}>
            <Text style={styles.ctaLabel}>Program oluştur</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 16, paddingBottom: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.program_workouts?.title ?? 'Antrenman'}</Text>
            <Text style={styles.cardMeta}>
              {
                TRAINING_DAYS.find((day) => day.key === fromDayIndex(item.program_workouts?.day_of_week ?? 0))?.label ??
                'Belirsiz gün'
              }
            </Text>
            <Text style={styles.cardMeta}>Durum: {item.status === 'done' ? 'Tamamlandı' : 'Bekliyor'}</Text>
            <View style={styles.cardActions}>
              <Pressable
                style={[styles.statusButton, styles.doneButton]}
                onPress={() => updateStatus.mutate({ scheduleId: item.id, status: 'done' })}
              >
                <Text style={styles.statusLabel}>Tamamlandı</Text>
              </Pressable>
              <Pressable
                style={[styles.statusButton, styles.skipButton]}
                onPress={() => updateStatus.mutate({ scheduleId: item.id, status: 'skipped' })}
              >
                <Text style={styles.statusLabel}>Atla</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Merhaba {profile?.display_name ?? 'sporsever'} 👋</Text>
          <Text style={styles.subtitle}>Bugünkü planını hazırladık.</Text>
        </View>
        {renderContent()}
      </View>
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
    backgroundColor: theme.colors.background,
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 6,
  },
  greeting: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.muted,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  emptyCopy: {
    color: theme.colors.muted,
  },
  cta: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaLabel: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderColor: theme.colors.border,
    borderWidth: 1,
    gap: 6,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  cardMeta: {
    color: theme.colors.muted,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statusButton: {
    flex: 1,
    borderRadius: theme.radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statusLabel: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: theme.colors.success,
  },
  skipButton: {
    backgroundColor: theme.colors.danger,
  },
});
