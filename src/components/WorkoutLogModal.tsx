import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PastelBackdrop } from './PastelBackdrop';
import { useCreateExerciseLogMutation } from '@/services/exerciseLogService';
import { useWorkoutExercises, WorkoutExerciseWithMovement } from '@/services/scheduleService';
import { theme } from '@/theme';

type SetEntry = {
  reps: string;
  weight: string;
};

type ExerciseLogEntry = {
  movementId: string;
  movementName: string;
  sets: SetEntry[];
};

type WorkoutLogModalProps = {
  visible: boolean;
  workoutId: string | null;
  scheduleInstanceId: string | null;
  workoutTitle: string;
  onClose: () => void;
  onComplete: () => void;
};

export function WorkoutLogModal({
  visible,
  workoutId,
  scheduleInstanceId,
  workoutTitle,
  onClose,
  onComplete,
}: WorkoutLogModalProps) {
  const { data: exercises, isLoading } = useWorkoutExercises(workoutId);
  const createLogMutation = useCreateExerciseLogMutation();
  const [logEntries, setLogEntries] = useState<Map<string, ExerciseLogEntry>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Egzersizler yüklendiğinde entries'i initialize et
  useEffect(() => {
    if (exercises && exercises.length > 0 && logEntries.size === 0) {
      const newMap = new Map<string, ExerciseLogEntry>();
      for (const exercise of exercises) {
        const defaultReps = exercise.reps.split('-')[0] || '10';
        const setsArray: SetEntry[] = Array.from({ length: exercise.sets }, () => ({
          reps: defaultReps,
          weight: '',
        }));
        newMap.set(exercise.id, {
          movementId: exercise.movements.id,
          movementName: exercise.movements.name,
          sets: setsArray,
        });
      }
      setLogEntries(newMap);
    }
  }, [exercises]);

  // Modal kapandığında reset
  useEffect(() => {
    if (!visible) {
      setLogEntries(new Map());
    }
  }, [visible]);

  const getEntry = (exerciseId: string): ExerciseLogEntry | undefined => {
    return logEntries.get(exerciseId);
  };

  const updateSetEntry = (exerciseId: string, setIndex: number, field: keyof SetEntry, value: string) => {
    setLogEntries((prev) => {
      const newMap = new Map(prev);
      const entry = newMap.get(exerciseId);
      if (!entry) return prev;

      const newSets = [...entry.sets];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      newMap.set(exerciseId, { ...entry, sets: newSets });
      return newMap;
    });
  };

  const addSet = (exerciseId: string) => {
    setLogEntries((prev) => {
      const newMap = new Map(prev);
      const entry = newMap.get(exerciseId);
      if (!entry) return prev;

      const lastSet = entry.sets[entry.sets.length - 1];
      const newSet: SetEntry = {
        reps: lastSet?.reps || '10',
        weight: lastSet?.weight || '',
      };
      newMap.set(exerciseId, { ...entry, sets: [...entry.sets, newSet] });
      return newMap;
    });
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setLogEntries((prev) => {
      const newMap = new Map(prev);
      const entry = newMap.get(exerciseId);
      if (!entry || entry.sets.length <= 1) return prev;

      const newSets = entry.sets.filter((_, i) => i !== setIndex);
      newMap.set(exerciseId, { ...entry, sets: newSets });
      return newMap;
    });
  };

  const handleSave = async () => {
    if (!exercises || exercises.length === 0) return;

    setIsSaving(true);

    try {
      // Her egzersiz için log oluştur
      for (const exercise of exercises) {
        const entry = logEntries.get(exercise.id);
        if (!entry) continue;

        // Her seti virgülle ayrılmış string olarak kaydet
        const repsArray = entry.sets.map((s) => s.reps || '0');
        const weightsArray = entry.sets.map((s) => s.weight || '0');
        const avgWeight = entry.sets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0) / entry.sets.length;

        await createLogMutation.mutateAsync({
          movementId: exercise.movements.id,
          scheduleInstanceId,
          setsCompleted: entry.sets.length,
          repsCompleted: repsArray.join(','),
          weightKg: avgWeight || null,
          note: `Setler: ${entry.sets.map((s, i) => `Set ${i + 1}: ${s.weight || 0}kg × ${s.reps}`).join(' | ')}`,
          difficultyRating: null,
        });
      }

      onComplete();
    } catch (error) {
      console.error('Egzersiz kaydı hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <PastelBackdrop />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{workoutTitle}</Text>
            <Text style={styles.subtitle}>Her egzersiz için kullandığın ağırlıkları gir</Text>
          </View>

          {isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={theme.colors.text} />
              <Text style={styles.loaderText}>Egzersizler yükleniyor...</Text>
            </View>
          ) : exercises && exercises.length > 0 ? (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              {exercises.map((exercise) => {
                const entry = getEntry(exercise.id);
                if (!entry) return null;
                
                return (
                  <View key={exercise.id} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      {exercise.movements.image_url ? (
                        <Image
                          source={{ uri: exercise.movements.image_url }}
                          style={styles.exerciseImage}
                        />
                      ) : (
                        <View style={styles.exerciseImagePlaceholder}>
                          <Text style={styles.exerciseImagePlaceholderText}>💪</Text>
                        </View>
                      )}
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.movements.name}</Text>
                        <Text style={styles.exerciseMeta}>
                          Hedef: {exercise.sets} set × {exercise.reps}
                        </Text>
                      </View>
                    </View>

                    {/* Her set için ayrı giriş */}
                    <View style={styles.setsContainer}>
                      <View style={styles.setsHeader}>
                        <Text style={styles.setsTitle}>Setler</Text>
                        <Pressable style={styles.addSetButton} onPress={() => addSet(exercise.id)}>
                          <Text style={styles.addSetButtonText}>+ Set Ekle</Text>
                        </Pressable>
                      </View>

                      {entry.sets.map((setEntry, setIndex) => (
                        <View key={setIndex} style={styles.setRow}>
                          <View style={styles.setNumber}>
                            <Text style={styles.setNumberText}>{setIndex + 1}</Text>
                          </View>

                          <View style={styles.setInputGroup}>
                            <Text style={styles.setInputLabel}>Ağırlık</Text>
                            <TextInput
                              style={[styles.setInput, styles.weightInput]}
                              value={setEntry.weight}
                              onChangeText={(v) => updateSetEntry(exercise.id, setIndex, 'weight', v)}
                              keyboardType="decimal-pad"
                              placeholder="kg"
                              placeholderTextColor={theme.colors.subtle}
                            />
                          </View>

                          <Text style={styles.setMultiply}>×</Text>

                          <View style={styles.setInputGroup}>
                            <Text style={styles.setInputLabel}>Tekrar</Text>
                            <TextInput
                              style={styles.setInput}
                              value={setEntry.reps}
                              onChangeText={(v) => updateSetEntry(exercise.id, setIndex, 'reps', v)}
                              keyboardType="number-pad"
                              placeholder="10"
                              placeholderTextColor={theme.colors.subtle}
                            />
                          </View>

                          {entry.sets.length > 1 && (
                            <Pressable
                              style={styles.removeSetButton}
                              onPress={() => removeSet(exercise.id, setIndex)}
                            >
                              <Text style={styles.removeSetButtonText}>✕</Text>
                            </Pressable>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Bu antrenman için egzersiz bulunamadı</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Pressable
              style={[styles.saveButton, isSaving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Kaydediliyor...' : 'Antrenmanı Tamamla'}
              </Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={onClose} disabled={isSaving}>
              <Text style={styles.cancelButtonText}>İptal</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.muted,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    color: theme.colors.muted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  exerciseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 14,
    shadowColor: '#a2b4d8',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  exerciseImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exerciseImagePlaceholderText: {
    fontSize: 22,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  exerciseMeta: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  setsContainer: {
    gap: 10,
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  addSetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 8,
  },
  addSetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2a52',
  },
  setInputGroup: {
    flex: 1,
    gap: 2,
  },
  setInputLabel: {
    fontSize: 10,
    color: theme.colors.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  setInput: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
  setMultiply: {
    fontSize: 16,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  weightInput: {
    backgroundColor: '#e8f4ff',
    borderColor: '#c0d8f0',
  },
  removeSetButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeSetButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.colors.muted,
  },
  footer: {
    padding: 16,
    gap: 10,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#b8c7ff',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  saveButtonText: {
    color: '#1a2a52',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

