import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMovementChartData } from '@/services/exerciseLogService';
import { Theme, useTheme } from '@/theme';

type Props = {
  movementId: string;
  movementName: string;
};

type MetricType = 'weight' | 'sets' | 'volume';

const METRICS: { key: MetricType; label: string; unit: string }[] = [
  { key: 'weight', label: 'Ağırlık', unit: 'kg' },
  { key: 'sets', label: 'Set', unit: 'set' },
  { key: 'volume', label: 'Hacim', unit: 'kg' },
];

const BAR_HEIGHT = 120;

export function MovementProgressChart({ movementId, movementName }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const { data: chartData = [], isLoading } = useMovementChartData(movementId, selectedMetric);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{movementName}</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (chartData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{movementName}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Henüz kayıt yok</Text>
          <Text style={styles.emptyHint}>Antrenman tamamladıkça burada ilerleme grafiğin görünecek</Text>
        </View>
      </View>
    );
  }

  // Grafik hesaplamaları
  const values = chartData.map((d) => d.value);
  const maxValue = Math.max(...values) || 1;

  const currentMetric = METRICS.find((m) => m.key === selectedMetric)!;
  const latestValue = chartData[chartData.length - 1]?.value ?? 0;
  const firstValue = chartData[0]?.value ?? 0;
  const change = latestValue - firstValue;
  const changePercent = firstValue > 0 ? ((change / firstValue) * 100).toFixed(1) : '0';

  // Son 10 veriyi al
  const displayData = chartData.slice(-10);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{movementName}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{latestValue.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{currentMetric.unit}</Text>
          </View>
          <View style={[styles.changeBadge, change >= 0 ? styles.changePositive : styles.changeNegative]}>
            <Text style={styles.changeText}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)} ({changePercent}%)
            </Text>
          </View>
        </View>
      </View>

      {/* Metrik Seçici */}
      <View style={styles.metricSelector}>
        {METRICS.map((metric) => (
          <Pressable
            key={metric.key}
            style={[styles.metricButton, selectedMetric === metric.key && styles.metricButtonActive]}
            onPress={() => setSelectedMetric(metric.key)}
          >
            <Text style={[styles.metricButtonText, selectedMetric === metric.key && styles.metricButtonTextActive]}>
              {metric.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.barsRow}>
          {displayData.map((data, i) => {
            const barHeight = (data.value / maxValue) * BAR_HEIGHT;
            const isLast = i === displayData.length - 1;
            
            return (
              <View key={i} style={styles.barColumn}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      { height: barHeight },
                      isLast && styles.barLatest,
                    ]}
                  />
                </View>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {data.label.split(' ')[0]}
                </Text>
              </View>
            );
          })}
        </View>
        
        {/* Y ekseni göstergeleri */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{maxValue.toFixed(0)}</Text>
          <Text style={styles.yAxisLabel}>{(maxValue / 2).toFixed(0)}</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>
      </View>

      {/* Son kayıtlar */}
      <View style={styles.recentLogs}>
        <Text style={styles.recentTitle}>Son Kayıtlar</Text>
        {chartData.slice(-5).reverse().map((log, i) => (
          <View key={i} style={styles.logItem}>
            <Text style={styles.logDate}>{log.label}</Text>
            <Text style={styles.logValue}>{log.value.toFixed(1)} {currentMetric.unit}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  changeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changePositive: {
    backgroundColor: theme.colors.success + '20',
  },
  changeNegative: {
    backgroundColor: theme.colors.danger + '20',
  },
  changeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  metricSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metricButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  metricButtonText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  metricButtonTextActive: {
    color: theme.colors.text,
  },
  chartContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_HEIGHT + 30,
    gap: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    height: BAR_HEIGHT,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    backgroundColor: theme.colors.success + '80',
    borderRadius: 6,
    minHeight: 4,
  },
  barLatest: {
    backgroundColor: theme.colors.success,
  },
  barLabel: {
    color: theme.colors.muted,
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
  },
  yAxis: {
    width: 30,
    height: BAR_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  yAxisLabel: {
    color: theme.colors.subtle,
    fontSize: 10,
  },
  loadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.muted,
  },
  emptyContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyHint: {
    color: theme.colors.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  recentLogs: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  recentTitle: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  logDate: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  logValue: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
