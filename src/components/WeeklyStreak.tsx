import { format, startOfWeek, addDays, isToday, isBefore, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WorkoutDay } from '@/services/scheduleService';
import { theme } from '@/theme';

type Props = {
  workoutDays: WorkoutDay[];
  onPress?: () => void;
};

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function WeeklyStreak({ workoutDays, onPress }: Props) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  // Hafta günlerini oluştur
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const workout = workoutDays.find((w) => w.date === dateStr);
    
    return {
      date,
      dateStr,
      dayNumber: format(date, 'd'),
      dayName: WEEKDAYS[i],
      isToday: isToday(date),
      isPast: isBefore(date, today) && !isToday(date),
      status: workout?.status ?? null,
      workoutCount: workout?.workoutCount ?? 0,
    };
  });

  // Tamamlanan antrenman sayısı
  const completedCount = days.filter((d) => d.status === 'done').length;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>Bu Hafta</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            <Text style={styles.statsHighlight}>{completedCount}</Text> antrenman tamamlandı
          </Text>
          {onPress && <Text style={styles.expandHint}>Takvimi gör →</Text>}
        </View>
      </View>
      
      <View style={styles.daysRow}>
        {days.map((day) => (
          <View key={day.dateStr} style={styles.dayColumn}>
            <Text style={[styles.dayName, day.isToday && styles.dayNameToday]}>
              {day.dayName}
            </Text>
            <View
              style={[
                styles.dayCircle,
                day.isToday && styles.dayCircleToday,
                day.status === 'done' && styles.dayCircleDone,
                day.status === 'skipped' && styles.dayCircleSkipped,
                day.status === 'pending' && styles.dayCirclePending,
              ]}
            >
              <Text
                style={[
                  styles.dayNumber,
                  day.isToday && styles.dayNumberToday,
                  day.status === 'done' && styles.dayNumberDone,
                ]}
              >
                {day.dayNumber}
              </Text>
            </View>
            {day.status === 'done' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#9eb2db',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  statsHighlight: {
    color: theme.colors.success,
    fontWeight: '700',
  },
  expandHint: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayName: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayNameToday: {
    color: theme.colors.primary,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dayCircleToday: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  dayCircleDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  dayCircleSkipped: {
    backgroundColor: theme.colors.danger + '30',
    borderColor: theme.colors.danger,
  },
  dayCirclePending: {
    backgroundColor: theme.colors.warning + '30',
    borderColor: theme.colors.warning,
  },
  dayNumber: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dayNumberToday: {
    fontWeight: '800',
  },
  dayNumberDone: {
    color: '#fff',
  },
  checkmark: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '700',
    position: 'absolute',
    bottom: -2,
  },
});

