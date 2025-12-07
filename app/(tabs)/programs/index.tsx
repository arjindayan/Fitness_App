import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useProgramList, fromDayIndex } from '@/services/programService';
import { TRAINING_DAYS } from '@/constants/trainingDays';

export default function ProgramsScreen() {
  const router = useRouter();
  const { data, isLoading } = useProgramList();

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#fdf7ff', '#eef4ff', '#f6fdff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(255, 194, 222, 0.42)', 'transparent']}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={styles.pinkGlow}
      />
      <LinearGradient
        colors={['rgba(183, 214, 255, 0.45)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={styles.blueGlow}
      />
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

              return (
                <Pressable
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  onPress={() => router.push(`/(tabs)/programs/${item.id}`)}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
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
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdf7ff',
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
    color: '#0f1d3d',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: '#60709a',
    marginTop: 6,
    fontSize: 14,
  },
  copy: {
    color: '#60709a',
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
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
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
    color: '#0f1d3d',
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
  pinkGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -80,
    left: -40,
  },
  blueGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: -60,
    right: -40,
  },
});
