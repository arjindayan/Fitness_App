import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TRAINING_DAYS } from '@/constants/trainingDays';
import { useCreateProgramMutation } from '@/services/programService';
import { useMovementList } from '@/services/movementService';
import { useProgramBuilderStore } from '@/state/programBuilderStore';
import { BuilderExercise } from '@/types/program';
import { TrainingDay } from '@/types/profile';

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
    defaultValues: { sets: '3', reps: '10', restSeconds: '90', note: '' },
  });

  const handleAddExercise = (day: TrainingDay) => {
    setPickerDay(day);
    setSelectedMovementId(null);
    setSelectedMovementName('');
  };

  const handleSaveExercise = handleSubmit((values) => {
    if (!pickerDay || !selectedMovementId) {
      return;
    }

    const exercise: BuilderExercise = {
      movementId: selectedMovementId,
      movementName: selectedMovementName,
      sets: Number(values.sets),
      reps: values.reps,
      restSeconds: Number(values.restSeconds),
      note: values.note,
    };

    addExercise(pickerDay, exercise);
    setPickerDay(null);
    setSelectedMovementId(null);
    setSelectedMovementName('');
    resetExerciseForm();
  });

  const handleProgramSave = async () => {
    if (!meta.title || trainingDays.length === 0) {
      alert('Program adŽñ ve eŽYitim gÇ¬nleri gerekli');
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
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.stepLabel}>AdŽñm {step} / 2</Text>
        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Program bilgileri</Text>
            <TextInput
              style={styles.input}
              placeholder="Program adŽñ"
              placeholderTextColor="#5b6170"
              value={meta.title}
              onChangeText={(text) => setMeta({ title: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Fokus (Çôr. push/pull/legs)"
              placeholderTextColor="#5b6170"
              value={meta.focus}
              onChangeText={(text) => setMeta({ focus: text })}
            />
            <Text style={styles.sectionSubtitle}>Antrenman gÇ¬nleri</Text>
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
            <Text style={styles.sectionTitle}>Workout planŽñ</Text>
            {trainingDays.length === 0 ? (
              <Text style={styles.helperText}>Ç-nce antrenman gÇ¬nlerini seÇõ</Text>
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
                        <Text style={styles.exerciseTitle}>{exercise.movementName}</Text>
                        <Text style={styles.exerciseMeta}>
                          {exercise.sets} set x {exercise.reps} | Dinlenme {exercise.restSeconds}s
                        </Text>
                        <Pressable onPress={() => removeExercise(day, index)}>
                          <Text style={styles.removeText}>Sil</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                );
              })
            )}
            <Pressable style={styles.primaryButton} onPress={handleProgramSave}>
              <Text style={styles.primaryButtonText}>
                {createProgramMutation.isPending ? 'Kaydediliyor...' : 'ProgramŽñ kaydet'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal visible={pickerDay !== null} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Hareket seÇõ</Text>
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <ScrollView style={{ flex: 1 }}>
                {movements?.map((movement) => (
                  <Pressable
                    key={movement.id}
                    style={styles.movementRow}
                    onPress={() => {
                      setSelectedMovementId(movement.id);
                      setSelectedMovementName(movement.name);
                    }}
                  >
                    <Text style={styles.movementName}>{movement.name}</Text>
                    <Text style={styles.movementMeta}>{movement.equipment ?? 'Ekipman yok'}</Text>
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
                      placeholderTextColor="#5b6170"
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
                      placeholder="Tekrar (Çôrn. 8-10)"
                      placeholderTextColor="#5b6170"
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
                      placeholder="Dinlenme saniye"
                      placeholderTextColor="#5b6170"
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
                      placeholderTextColor="#5b6170"
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
              style={[styles.primaryButton, { backgroundColor: '#1f1f25', marginTop: 12 }]}
              onPress={() => {
                setPickerDay(null);
                setSelectedMovementId(null);
                setSelectedMovementName('');
              }}
            >
              <Text style={styles.primaryButtonText}>Kapat</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030303',
  },
  container: {
    flex: 1,
    backgroundColor: '#030303',
    padding: 16,
  },
  card: {
    backgroundColor: '#0b0f18',
    borderRadius: 16,
    padding: 16,
    borderColor: '#171c2d',
    borderWidth: 1,
    gap: 12,
  },
  stepLabel: {
    color: '#8f94a3',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#c5c9d6',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#11121a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#1f2433',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2433',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dayChipActive: {
    backgroundColor: '#7f5dfa',
    borderColor: '#7f5dfa',
  },
  dayLabel: {
    color: '#9ea3b5',
  },
  dayLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#7f5dfa',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  helperText: {
    color: '#c5c9d6',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  addMovementButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2b2b33',
  },
  addMovementLabel: {
    color: '#9ea3b5',
  },
  exerciseCard: {
    backgroundColor: '#11121a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2433',
    gap: 4,
  },
  exerciseTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  exerciseMeta: {
    color: '#9ea3b5',
  },
  removeText: {
    color: '#ff8c8c',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#030303',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#030303',
    padding: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  movementRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2433',
  },
  movementName: {
    color: '#fff',
  },
  movementMeta: {
    color: '#9ea3b5',
    fontSize: 12,
  },
  exerciseForm: {
    marginTop: 16,
    gap: 8,
  },
});
