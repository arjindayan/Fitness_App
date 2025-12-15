import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  isSameDay,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PastelBackdrop } from '@/components/PastelBackdrop';
import { useMonthlyWorkoutHistory, WorkoutDay } from '@/services/scheduleService';
import { Theme, useTheme } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export function MonthlyCalendarModal({ visible, onClose }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const { data: workoutDays = [], isLoading } = useMonthlyWorkoutHistory(year, month);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Takvim günlerini oluştur
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays: Array<{
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    workout: WorkoutDay | null;
  }> = [];

  let day = calendarStart;
  while (day <= calendarEnd) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const workout = workoutDays.find((w) => w.date === dateStr) ?? null;
    
    calendarDays.push({
      date: new Date(day),
      isCurrentMonth: isSameMonth(day, currentDate),
      isToday: isToday(day),
      workout,
    });
    day = addDays(day, 1);
  }

  // Haftalara böl
  const weeks: typeof calendarDays[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // İstatistikler
  const completedCount = workoutDays.filter((w) => w.status === 'done').length;
  const skippedCount = workoutDays.filter((w) => w.status === 'skipped').length;
  const totalCount = workoutDays.length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.safeArea}>
        <PastelBackdrop />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose}>
              <Text style={styles.closeButton}>Kapat</Text>
            </Pressable>
            <Text style={styles.headerTitle}>
              {MONTHS[month]} {year}
            </Text>
            <Pressable onPress={goToToday}>
              <Text style={styles.todayButton}>Bugün</Text>
            </Pressable>
          </View>

          {/* Month Navigation */}
          <View style={styles.navRow}>
            <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
              <Text style={styles.navButtonText}>← Önceki</Text>
            </Pressable>
            <Pressable onPress={goToNextMonth} style={styles.navButton}>
              <Text style={styles.navButtonText}>Sonraki →</Text>
            </Pressable>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>{completedCount}</Text>
              <Text style={styles.statLabel}>Tamamlandı</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.danger }]}>{skippedCount}</Text>
              <Text style={styles.statLabel}>Atlandı</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalCount}</Text>
              <Text style={styles.statLabel}>Toplam</Text>
            </View>
          </View>

          {/* Calendar */}
          <View style={styles.calendar}>
            {/* Weekday Headers */}
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((day) => (
                <View key={day} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.weekRow}>
                  {week.map((day, dayIndex) => (
                    <View
                      key={dayIndex}
                      style={[
                        styles.dayCell,
                        day.isToday && styles.dayCellToday,
                        day.workout?.status === 'done' && styles.dayCellDone,
                        day.workout?.status === 'skipped' && styles.dayCellSkipped,
                        day.workout?.status === 'pending' && styles.dayCellPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !day.isCurrentMonth && styles.dayTextOtherMonth,
                          day.isToday && styles.dayTextToday,
                          day.workout?.status === 'done' && styles.dayTextDone,
                        ]}
                      >
                        {format(day.date, 'd')}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
              <Text style={styles.legendText}>Tamamlandı</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
              <Text style={styles.legendText}>Bekliyor</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.danger }]} />
              <Text style={styles.legendText}>Atlandı</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  closeButton: {
    color: theme.colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  todayButton: {
    color: theme.colors.success,
    fontSize: 16,
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  calendar: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  dayCellDone: {
    backgroundColor: theme.colors.success,
  },
  dayCellSkipped: {
    backgroundColor: theme.colors.danger + '40',
  },
  dayCellPending: {
    backgroundColor: theme.colors.warning + '40',
  },
  dayText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextOtherMonth: {
    color: theme.colors.subtle,
  },
  dayTextToday: {
    fontWeight: '800',
  },
  dayTextDone: {
    color: '#fff',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: theme.colors.muted,
    fontSize: 12,
  },
});
