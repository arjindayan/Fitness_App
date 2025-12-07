import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAddExerciseMutation, useProgramDetail } from '@/services/programService';
import { useMovementList } from '@/services/movementService';
import { theme } from '@/theme';

type ExerciseFormValues = {
  sets: string;
  reps: string;
  restSeconds: string;
  note: string;
};

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const programId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);
  const { data, isLoading } = useProgramDetail(programId);
  const addExercise = useAddExerciseMutation(programId ?? '');

  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');
  const movementParams = useMemo(
    () => ({
      search,
      categoryId: null,
      equipment: null,
    }),
    [search]
  );
  const { data: movements, isLoading: isMovementsLoading } = useMovementList(movementParams);

  const { control, handleSubmit, reset } = useForm<ExerciseFormValues>({
    defaultValues: { sets: '3', reps: '10', restSeconds: '90', note: '' },
  });

  const handleAddExercise = handleSubmit(async (values) => {
    if (!selectedWorkoutId || !selectedMovement) return;
    await addExercise.mutateAsync({
      workoutId: selectedWorkoutId,
      movementId: selectedMovement.id,
      sets: Number(values.sets),
      reps: values.reps,
      restSeconds: Number(values.restSeconds) || null,
      note: values.note || null,
    });
    reset();
    setSelectedMovement(null);
    setSelectedWorkoutId(null);
  });

  if (!programId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Program bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  const workouts = data.program_workouts ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backLabel}>← Geri</Text>
          </Pressable>
        </View>

        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 14, paddingBottom: 120 }}
          renderItem={({ item }) => {
            const exercises = (item.workout_blocks?.flatMap((block) => block.workout_exercises) ?? []).sort(
              (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
            );

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardMeta}>Gün sırası: {item.order_index ?? 0}</Text>
                  </View>
                  <Pressable
                    style={styles.addButton}
                    onPress={() => {
                      setSelectedWorkoutId(item.id);
                      setSelectedMovement(null);
                    }}
                  >
                    <Text style={styles.addButtonText}>Hareket ekle</Text>
                  </Pressable>
                </View>

                {exercises.length === 0 ? (
                  <Text style={styles.muted}>Henüz hareket yok</Text>
                ) : (
                  exercises.map((exercise, idx) => (
                    <View key={`${exercise.id}-${idx}`} style={styles.exerciseRow}>
                      <Text style={styles.exerciseName}>{exercise.reps} tekrar • {exercise.sets} set</Text>
                      <Text style={styles.exerciseMeta}>
                        Dinlenme {exercise.rest_seconds ?? 0}s {exercise.note ? `• ${exercise.note}` : ''}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            );
          }}
        />

        <Modal visible={Boolean(selectedWorkoutId)} animationType="slide">
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Hareket seç</Text>
              <TextInput
                style={styles.search}
                placeholder="Ara"
                placeholderTextColor={theme.colors.subtle}
                value={search}
                onChangeText={setSearch}
              />
              {isMovementsLoading ? (
                <ActivityIndicator />
              ) : (
                <FlatList
                  data={movements ?? []}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ gap: 8 }}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.movementRow, selectedMovement?.id === item.id && styles.movementRowSelected]}
                      onPress={() => setSelectedMovement({ id: item.id, name: item.name })}
                    >
                      <Text style={styles.movementName}>{item.name}</Text>
                      <Text style={styles.movementMeta}>{item.equipment ?? 'Ekipman yok'}</Text>
                    </Pressable>
                  )}
                />
              )}

              {selectedMovement ? (
                <View style={styles.form}>
                  <Controller
                    control={control}
                    name="sets"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Set"
                        placeholderTextColor={theme.colors.subtle}
                        keyboardType="numeric"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="reps"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Tekrar"
                        placeholderTextColor={theme.colors.subtle}
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="restSeconds"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Dinlenme (sn)"
                        placeholderTextColor={theme.colors.subtle}
                        keyboardType="numeric"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="note"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.input, { height: 64 }]}
                        placeholder="Not"
                        placeholderTextColor={theme.colors.subtle}
                        value={value}
                        onChangeText={onChange}
                        multiline
                      />
                    )}
                  />
                  <Pressable style={styles.saveButton} onPress={handleAddExercise}>
                    <Text style={styles.saveButtonText}>{addExercise.isPending ? 'Ekleniyor...' : 'Kaydet'}</Text>
                  </Pressable>
                </View>
              ) : null}

              <Pressable
                style={[styles.saveButton, { backgroundColor: theme.colors.surfaceAlt, marginTop: 12 }]}
                onPress={() => {
                  setSelectedWorkoutId(null);
                  setSelectedMovement(null);
                  reset();
                }}
              >
                <Text style={styles.saveButtonText}>Kapat</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Modal>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  backLabel: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  cardMeta: {
    color: theme.colors.muted,
  },
  muted: {
    color: theme.colors.muted,
  },
  addButton: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addButtonText: {
    color: theme.colors.text,
  },
  exerciseRow: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radii.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  exerciseName: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  exerciseMeta: {
    color: theme.colors.muted,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  search: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radii.md,
    padding: 10,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  movementRow: {
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surface,
  },
  movementRowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceAlt,
  },
  movementName: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  movementMeta: {
    color: theme.colors.muted,
  },
  form: {
    marginTop: 16,
    gap: 8,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radii.md,
    padding: 10,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
});
