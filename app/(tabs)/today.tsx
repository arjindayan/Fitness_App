import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonthlyCalendarModal } from '@/components/MonthlyCalendarModal';
import { PastelBackdrop } from '@/components/PastelBackdrop';
import { WeeklyStreak } from '@/components/WeeklyStreak';
import { WorkoutLogModal } from '@/components/WorkoutLogModal';
import { TRAINING_DAYS } from '@/constants/trainingDays';
import { fromDayIndex } from '@/services/programService';
import { useTodayPlan, useUpdateScheduleStatus, useWeeklyWorkoutHistory, useSkipAndShiftWorkouts } from '@/services/scheduleService';
import { useSessionContext } from '@/state/SessionProvider';
import { fetchTodayStepsWithPermission } from '@/services/healthService';
import { ScheduleInstance } from '@/types/program';
import { theme } from '@/theme';

export default function TodayScreen() {
  const router = useRouter();
  const { profile } = useSessionContext();
  const { data, isLoading } = useTodayPlan();
  const { data: weeklyHistory = [] } = useWeeklyWorkoutHistory();
  const updateStatus = useUpdateScheduleStatus();
  const skipAndShift = useSkipAndShiftWorkouts();
  const [steps, setSteps] = useState<number | null>(null);
  const [stepsError, setStepsError] = useState<string | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<ScheduleInstance | null>(null);

  const handleCompleteWorkout = (item: ScheduleInstance) => {
    setSelectedWorkout(item);
    setLogModalVisible(true);
  };

  const handleLogComplete = () => {
    if (selectedWorkout) {
      updateStatus.mutate({ scheduleId: selectedWorkout.id, status: 'done' });
    }
    setLogModalVisible(false);
    setSelectedWorkout(null);
  };

  const handleSkipWorkout = (item: ScheduleInstance) => {
    Alert.alert(
      'Antrenmanı Atla',
      'Bu antrenmanı atlamak istediğine emin misin?',
      [
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
        {
          text: 'Sadece Atla',
          onPress: () => {
            updateStatus.mutate({ scheduleId: item.id, status: 'skipped' });
          },
        },
        {
          text: 'Atla ve Kaydır',
          style: 'default',
          onPress: () => {
            const today = format(new Date(), 'yyyy-MM-dd');
            skipAndShift.mutate(
              {
                scheduleId: item.id,
                programId: item.program_id,
                currentDate: today,
              },
              {
                onSuccess: () => {
                  Alert.alert(
                    'Antrenmanlar Kaydırıldı',
                    'Bu antrenman atlandı ve gelecek antrenmanların bir gün ileri kaydırıldı.'
                  );
                },
                onError: () => {
                  Alert.alert('Hata', 'Antrenmanlar kaydırılamadı.');
                },
              }
            );
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    fetchTodayStepsWithPermission().then((res) => {
      setSteps(res.steps);
      if (res.error) {
        setStepsError(res.error);
      }
    });
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>Plan yükleniyor...</Text>
          <Text style={styles.copy}>Bugünkü antrenmanlarını hazırlıyoruz.</Text>
        </View>
      );
    }

    if (!data || data.length === 0) {
      return (
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>Bugün için plan yok</Text>
          <Text style={styles.copy}>Program oluşturup günlerine ata, biz sana hatırlatalım.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/programs')}>
            <Text style={styles.primaryLabel}>Program oluştur</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.listContent}>
        {data.map((item) => {
          const dayLabel = TRAINING_DAYS.find((day) => day.key === fromDayIndex(item.program_workouts?.day_of_week ?? 0))?.label;
          return (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.programs?.title ?? 'Antrenman'}</Text>
            <Text style={styles.cardMeta}>
              {dayLabel} {item.status === 'done' ? '• Tamamlandı ✓' : '• Bekliyor'}
            </Text>
            <View style={styles.cardActions}>
              <Pressable
                style={[styles.statusButton, styles.doneButton]}
                onPress={() => handleCompleteWorkout(item)}
              >
                <Text style={styles.statusLabel}>Tamamla + Kaydet</Text>
              </Pressable>
              <Pressable
                style={[styles.statusButton, styles.skipButton]}
                onPress={() => handleSkipWorkout(item)}
              >
                <Text style={styles.statusLabel}>Atla</Text>
              </Pressable>
            </View>
          </View>
        );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <PastelBackdrop />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Merhaba {profile?.display_name ?? 'sporsever'} ✦</Text>
          <Text style={styles.subtitle}>Bugünkü planını hazırladık.</Text>
        </View>

        {/* Haftalık Streak */}
        <WeeklyStreak 
          workoutDays={weeklyHistory} 
          onPress={() => setCalendarVisible(true)} 
        />

        {/* Adım Sayacı */}
        <View style={styles.stepsCard}>
          <Text style={styles.sectionTitle}>Bugünkü adımlar</Text>
          <Text style={styles.stepsValue}>
            {steps !== null ? steps.toLocaleString('tr-TR') : Platform.OS === 'ios' ? '—' : 'iOS gerekli'}
          </Text>
          {stepsError ? <Text style={styles.stepsError}>{stepsError}</Text> : null}
        </View>

        {/* Bugünkü Plan */}
        {renderContent()}
      </ScrollView>

      {/* Aylık Takvim Modal */}
      <MonthlyCalendarModal 
        visible={calendarVisible} 
        onClose={() => setCalendarVisible(false)} 
      />

      {/* Antrenman Kayıt Modal */}
      <WorkoutLogModal
        visible={logModalVisible}
        workoutId={selectedWorkout?.workout_id ?? null}
        scheduleInstanceId={selectedWorkout?.id ?? null}
        workoutTitle={selectedWorkout?.program_workouts?.title ?? 'Antrenman'}
        onClose={() => {
          setLogModalVisible(false);
          setSelectedWorkout(null);
        }}
        onComplete={handleLogComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 18,
    paddingBottom: 100,
  },
  header: {
    gap: 6,
  },
  greeting: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
  },
  glassCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
    shadowColor: '#9eb2db',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  stepsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#9eb2db',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    gap: 6,
  },
  stepsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
  },
  stepsError: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  copy: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#b8c7ff',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryLabel: {
    color: '#1a2a52',
    fontWeight: '700',
  },
  listContent: {
    gap: 14,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
    shadowColor: '#a2b4d8',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  cardMeta: {
    color: theme.colors.muted,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statusButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusLabel: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  doneButton: {
    backgroundColor: '#e0f6f0',
    borderColor: '#c7e8db',
  },
  skipButton: {
    backgroundColor: '#ffecef',
    borderColor: '#ffd4db',
  },
});
