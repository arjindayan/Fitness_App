import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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

import { PastelBackdrop } from '@/components/PastelBackdrop';
import { TRAINING_DAYS } from '@/constants/trainingDays';
import { useCreateProgramMutation } from '@/services/programService';
import { useMovementList } from '@/services/movementService';
import { useProgramBuilderStore } from '@/state/programBuilderStore';
import { BuilderExercise } from '@/types/program';
import { TrainingDay } from '@/types/profile';
import { theme } from '@/theme';

type ExerciseForm = {
  sets: string;
  reps: string;
  restSeconds: string;
  note: string;
};

export default function ProgramBuilderScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [pickerDay, setPickerDay] = useState<TrainingDay | null>(null);
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  const [selectedMovementName, setSelectedMovementName] = useState<string>('');
  const [selectedMovementImage, setSelectedMovementImage] = useState<string | null>(null);

  const movementParams = useMemo(
    () => ({
      search: '',
      categoryId: null,
      equipment: null,
    }),
    []
  );

  const { data: movements, isLoading } = useMovementList(movementParams);
  const createProgramMutation = useCreateProgramMutation();

  const { meta, trainingDays, workouts, setMeta, toggleTrainingDay, addExercise, removeExercise, reset } =
    useProgramBuilderStore();

  const {
    control,
    handleSubmit,
    reset: resetExerciseForm,
  } = useForm<ExerciseForm>({
    defaultValues: { sets: '3', reps: '10', restSeconds: '', note: '' },
  });

  const handleAddExercise = (day: TrainingDay) => {
    setPickerDay(day);
    setSelectedMovementId(null);
    setSelectedMovementName('');
    setSelectedMovementImage(null);
  };

  const handleSaveExercise = handleSubmit((values) => {
    if (!pickerDay || !selectedMovementId) {
      return;
    }

    const exercise: BuilderExercise = {
      movementId: selectedMovementId,
      movementName: selectedMovementName,
      movementImage: selectedMovementImage,
      sets: Number(values.sets),
      reps: values.reps,
      restSeconds: values.restSeconds ? Number(values.restSeconds) : null,
      note: values.note?.trim() || null,
    };

    addExercise(pickerDay, exercise);
    setPickerDay(null);
    setSelectedMovementId(null);
    setSelectedMovementName('');
    setSelectedMovementImage(null);
    resetExerciseForm();
  });

  const handleProgramSave = async () => {
    if (!meta.title || trainingDays.length === 0) {
      alert('Program adı ve antrenman günleri gerekli');
      return;
    }

    if (!workouts.some((workout) => workout.exercises.length > 0)) {
      alert('En az bir egzersiz ekleyin');
      return;
    }

    try {
      await createProgramMutation.mutateAsync({
        title: meta.title,
        focus: meta.focus,
        trainingDays,
        workouts,
      });

      reset();
      router.back();
    } catch (err: any) {
      console.error('Program kaydedilemedi', err);
      alert(err?.message ?? 'Program kaydedilemedi');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <PastelBackdrop />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Program Oluştur</Text>
          <Text style={styles.stepLabel}>Adım {step} / 2</Text>
        </View>

        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Program bilgileri</Text>
            <TextInput
              style={styles.input}
              placeholder="Program adı"
              placeholderTextColor={theme.colors.subtle}
              value={meta.title}
              onChangeText={(text) => setMeta({ title: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Fokus (örn. push/pull/legs)"
              placeholderTextColor={theme.colors.subtle}
              value={meta.focus}
              onChangeText={(text) => setMeta({ focus: text })}
            />
            <Text style={styles.sectionSubtitle}>Antrenman günleri</Text>
            <View style={styles.daysGrid}>
              {TRAINING_DAYS.map((day) => {
                const active = trainingDays.includes(day.key);
                return (
                  <Pressable
                    key={day.key}
                    style={[styles.dayChip, active && styles.dayChipActive]}
                    onPress={() => toggleTrainingDay(day.key)}
                  >
                    <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{day.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.primaryButton} onPress={() => setStep(2)}>
              <Text style={styles.primaryButtonText}>Devam et</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Workout planı</Text>
            {trainingDays.length === 0 ? (
              <Text style={styles.helperText}>Önce antrenman günlerini seç</Text>
            ) : (
              trainingDays.map((day) => {
                const workout = workouts.find((w) => w.day === day);
                return (
                  <View key={day} style={styles.workoutBlock}>
                    <View style={styles.workoutHeader}>
                      <Text style={styles.workoutTitle}>{TRAINING_DAYS.find((d) => d.key === day)?.label}</Text>
                      <Pressable style={styles.addMovementButton} onPress={() => handleAddExercise(day)}>
                        <Text style={styles.addMovementLabel}>Hareket ekle</Text>
                      </Pressable>
                    </View>

                    {(workout?.exercises ?? []).map((exercise, index) => (
                      <View key={`${exercise.movementId}-${index}`} style={styles.exerciseCard}>
                        <View style={styles.exerciseCardContent}>
                          {exercise.movementImage ? (
                            <Image source={{ uri: exercise.movementImage }} style={styles.exerciseImage} />
                          ) : (
                            <View style={styles.exerciseImagePlaceholder}>
                              <Text style={styles.exerciseImagePlaceholderText}>💪</Text>
                            </View>
                          )}
                          <View style={styles.exerciseInfo}>
                            <Text style={styles.exerciseTitle}>{exercise.movementName}</Text>
                            <Text style={styles.exerciseMeta}>
                              {exercise.sets} set x {exercise.reps} {exercise.restSeconds ? `| ${exercise.restSeconds}s dinlenme` : ''}
                            </Text>
                          </View>
                        </View>
                        <Pressable style={styles.removeButton} onPress={() => removeExercise(day, index)}>
                          <Text style={styles.removeText}>✕</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                );
              })
            )}
            <Pressable style={styles.primaryButton} onPress={handleProgramSave}>
              <Text style={styles.primaryButtonText}>
                {createProgramMutation.isPending ? 'Kaydediliyor...' : 'Programı kaydet'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal visible={pickerDay !== null} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={styles.modalSafeArea}>
            <PastelBackdrop />
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Hareket seç</Text>
              {isLoading ? (
                <ActivityIndicator color={theme.colors.text} />
              ) : (
                <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
                  {movements?.map((movement) => (
                    <Pressable
                      key={movement.id}
                      style={[
                        styles.movementRow,
                        selectedMovementId === movement.id && styles.movementRowSelected,
                      ]}
                      onPress={() => {
                        setSelectedMovementId(movement.id);
                        setSelectedMovementName(movement.name);
                        setSelectedMovementImage(movement.image_url);
                      }}
                    >
                      <View style={styles.movementRowContent}>
                        {movement.image_url ? (
                          <Image source={{ uri: movement.image_url }} style={styles.movementImage} />
                        ) : (
                          <View style={styles.movementImagePlaceholder}>
                            <Text style={styles.movementImagePlaceholderText}>💪</Text>
                          </View>
                        )}
                        <View style={styles.movementInfo}>
                          <Text style={styles.movementName}>{movement.name}</Text>
                          <Text style={styles.movementMeta}>{movement.equipment ?? 'Ekipman yok'}</Text>
                        </View>
                      </View>
                      {selectedMovementId === movement.id && (
                        <Text style={styles.selectedBadge}>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              {selectedMovementId ? (
                <View style={styles.exerciseForm}>
                  <Text style={styles.sectionSubtitle}>Set / tekrar</Text>
                  <Controller
                    control={control}
                    name="sets"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Set"
                        placeholderTextColor={theme.colors.subtle}
                        value={value}
                        onChangeText={onChange}
                        keyboardType="numeric"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="reps"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Tekrar (örn. 8-10)"
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
                      placeholder="Dinlenme saniye (opsiyonel)"
                      placeholderTextColor={theme.colors.subtle}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="numeric"
                    />
                  )}
                />
                  <Controller
                    control={control}
                    name="note"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.input, { height: 80 }]}
                        placeholder="Not"
                        placeholderTextColor={theme.colors.subtle}
                        value={value}
                        onChangeText={onChange}
                        multiline
                      />
                    )}
                  />
                  <Pressable style={styles.primaryButton} onPress={handleSaveExercise}>
                    <Text style={styles.primaryButtonText}>Ekle</Text>
                  </Pressable>
                </View>
              ) : null}

              <Pressable
                style={[styles.primaryButton, { backgroundColor: theme.colors.surfaceAlt, marginTop: 12 }]}
                onPress={() => {
                  setPickerDay(null);
                  setSelectedMovementId(null);
                  setSelectedMovementName('');
                  setSelectedMovementImage(null);
                }}
              >
                <Text style={[styles.primaryButtonText, { color: theme.colors.text }]}>Kapat</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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
  },
  content: {
    padding: 16,
    paddingBottom: 140,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  stepLabel: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 16,
    borderColor: theme.colors.border,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#a2b4d8',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: theme.colors.muted,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surfaceAlt,
  },
  dayChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayLabel: {
    color: theme.colors.muted,
  },
  dayLabelActive: {
    color: '#1a2a52',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
    shadowColor: '#b8c7ff',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryButtonText: {
    color: '#1a2a52',
    fontWeight: '700',
  },
  helperText: {
    color: theme.colors.muted,
  },
  workoutBlock: {
    marginTop: 12,
    gap: 8,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  addMovementButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
    shadowColor: '#9eb2db',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  addMovementLabel: {
    color: theme.colors.text,
  },
  exerciseCard: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 12,
  },
  exerciseImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exerciseImagePlaceholderText: {
    fontSize: 24,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  exerciseMeta: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  removeText: {
    color: theme.colors.danger,
    fontWeight: '700',
    fontSize: 16,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  movementRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  movementRowSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 12,
    marginVertical: 2,
  },
  movementRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  movementImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  movementImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  movementImagePlaceholderText: {
    fontSize: 20,
  },
  movementInfo: {
    flex: 1,
  },
  movementName: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  movementMeta: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  selectedBadge: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  exerciseForm: {
    marginTop: 16,
    gap: 8,
  },
});
