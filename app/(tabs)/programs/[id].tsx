import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  FlatList,
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
import { TRAINING_DAYS } from '@/constants/trainingDays';
import { fromDayIndex } from '@/services/programService';

import { PastelBackdrop } from '@/components/PastelBackdrop';
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
    defaultValues: { sets: '3', reps: '10', restSeconds: '', note: '' },
  });

  const handleAddExercise = handleSubmit(async (values) => {
    if (!selectedWorkoutId || !selectedMovement) return;
    await addExercise.mutateAsync({
      workoutId: selectedWorkoutId,
      movementId: selectedMovement.id,
      sets: Number(values.sets),
      reps: values.reps,
      restSeconds: values.restSeconds ? Number(values.restSeconds) : null,
      note: values.note?.trim() || null,
    });
    reset();
    setSelectedMovement(null);
    setSelectedWorkoutId(null);
  });

  if (!programId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <PastelBackdrop />
        <View style={styles.container}>
          <Text style={styles.title}>Program bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <PastelBackdrop />
        <View style={styles.container}>
          <ActivityIndicator color={theme.colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  const workouts = data.program_workouts ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <PastelBackdrop />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backLabel}>← Geri</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 120 }}>
          {/* Program Bilgisi */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fokus</Text>
              <Text style={styles.infoValue}>{data.focus || 'Belirtilmedi'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Antrenman Günleri</Text>
              <Text style={styles.infoValue}>{workouts.length} gün</Text>
            </View>
          </View>

          {/* Her Gün İçin Antrenman Kartı */}
          {workouts.map((item) => {
            const exercises = (item.workout_blocks?.flatMap((block) => block.workout_exercises) ?? []).sort(
              (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
            );
            const dayLabel = TRAINING_DAYS.find((d) => d.key === fromDayIndex(item.day_of_week))?.label ?? 'Gün';

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.dayLabel}>{dayLabel}</Text>
                    <Text style={styles.cardMeta}>{exercises.length} hareket</Text>
                  </View>
                  <Pressable
                    style={styles.addButton}
                    onPress={() => {
                      setSelectedWorkoutId(item.id);
                      setSelectedMovement(null);
                    }}
                  >
                    <Text style={styles.addButtonText}>+ Hareket</Text>
                  </Pressable>
                </View>

                {exercises.length === 0 ? (
                  <Text style={styles.muted}>Henüz hareket eklenmedi</Text>
                ) : (
                  <View style={styles.exerciseList}>
                    {exercises.map((exercise, idx) => (
                      <View key={`${exercise.id}-${idx}`} style={styles.exerciseRow}>
                        {exercise.movements?.image_url ? (
                          <Image source={{ uri: exercise.movements.image_url }} style={styles.exerciseImage} />
                        ) : (
                          <View style={styles.exerciseImagePlaceholder}>
                            <Text style={styles.exerciseImagePlaceholderText}>💪</Text>
                          </View>
                        )}
                        <View style={styles.exerciseInfo}>
                          <Text style={styles.exerciseName}>
                            {exercise.movements?.name ?? 'Bilinmeyen Hareket'}
                          </Text>
                          <Text style={styles.exerciseMeta}>
                            {exercise.sets} set × {exercise.reps} tekrar
                            {exercise.rest_seconds ? ` • ${exercise.rest_seconds}s dinlenme` : ''}
                          </Text>
                          {exercise.movements?.equipment && (
                            <Text style={styles.exerciseEquipment}>{exercise.movements.equipment}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        <Modal visible={Boolean(selectedWorkoutId)} animationType="slide">
          <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
            <PastelBackdrop />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Hareket seç</Text>
                  <Pressable
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setSelectedWorkoutId(null);
                      setSelectedMovement(null);
                      reset();
                    }}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </Pressable>
                </View>
                <TextInput
                  style={styles.search}
                  placeholder="Ara"
                  placeholderTextColor={theme.colors.subtle}
                  value={search}
                  onChangeText={setSearch}
                />
                {isMovementsLoading ? (
                  <ActivityIndicator color={theme.colors.text} />
                ) : (
                  <FlatList
                    data={movements ?? []}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
                    keyboardShouldPersistTaps="handled"
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
                          placeholder="Dinlenme (sn) - opsiyonel"
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

              </View>
            </KeyboardAvoidingView>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '800',
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    shadowColor: '#9eb2db',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  backLabel: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  infoValue: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
    shadowColor: '#a2b4d8',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabel: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  cardMeta: {
    color: theme.colors.muted,
    marginTop: 2,
  },
  muted: {
    color: theme.colors.muted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#b8c7ff',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  addButtonText: {
    color: '#1a2a52',
    fontWeight: '700',
  },
  exerciseList: {
    gap: 10,
  },
  exerciseRow: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  exerciseImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exerciseImagePlaceholderText: {
    fontSize: 24,
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  exerciseMeta: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  exerciseEquipment: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalContainer: {
    flex: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalCloseText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
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
    backgroundColor: theme.colors.primarySoft,
  },
  movementName: {
    color: theme.colors.text,
    fontWeight: '700',
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
    shadowColor: '#b8c7ff',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  saveButtonText: {
    color: '#1a2a52',
    fontWeight: '700',
  },
});
