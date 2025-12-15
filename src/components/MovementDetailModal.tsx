import { useMemo, useState } from 'react';
import {
  Alert,
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

import { MovementProgressChart } from '@/components/MovementProgressChart';
import { PastelBackdrop } from '@/components/PastelBackdrop';
import { useCreateExerciseLogMutation } from '@/services/exerciseLogService';
import { Movement } from '@/types/movement';
import { Theme, useTheme } from '@/theme';

type Props = {
  visible: boolean;
  movement: Movement | null;
  scheduleInstanceId?: string | null;
  onClose: () => void;
  onLogSaved?: () => void;
};

export function MovementDetailModal({ visible, movement, scheduleInstanceId, onClose, onLogSaved }: Props) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const createLogMutation = useCreateExerciseLogMutation();

  const resetForm = () => {
    setSets('3');
    setReps('10');
    setWeight('');
    setNote('');
    setDifficulty(null);
    setShowLogForm(false);
  };

  const handleSaveLog = async () => {
    if (!movement) return;

    try {
      await createLogMutation.mutateAsync({
        movementId: movement.id,
        scheduleInstanceId,
        setsCompleted: parseInt(sets) || 0,
        repsCompleted: reps,
        weightKg: weight ? parseFloat(weight) : null,
        note: note.trim() || null,
        difficultyRating: difficulty,
      });

      Alert.alert('Başarılı', 'Egzersiz kaydedildi!');
      resetForm();
      onLogSaved?.();
    } catch (error) {
      console.error('Log kaydedilemedi:', error);
      Alert.alert('Hata', 'Kayıt yapılamadı. Lütfen tekrar deneyin.');
    }
  };

  if (!movement) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeArea}>
          <PastelBackdrop />
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={onClose}>
                <Text style={styles.closeButton}>← Geri</Text>
              </Pressable>
            </View>

            {/* Hareket Bilgisi */}
            <View style={styles.movementInfo}>
              {movement.image_url ? (
                <Image source={{ uri: movement.image_url }} style={styles.movementImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>💪</Text>
                </View>
              )}
              <Text style={styles.movementName}>{movement.name}</Text>
              <View style={styles.tagsRow}>
                {movement.equipment && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{movement.equipment}</Text>
                  </View>
                )}
                {movement.difficulty && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{movement.difficulty}</Text>
                  </View>
                )}
                {movement.category_id && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{movement.category_id}</Text>
                  </View>
                )}
              </View>
              {movement.instructions && (
                <Text style={styles.instructions}>{movement.instructions}</Text>
              )}
            </View>

            {/* İlerleme Grafiği */}
            <MovementProgressChart movementId={movement.id} movementName="İlerleme Grafiği" />

            {/* Log Kaydet Butonu / Formu */}
            {!showLogForm ? (
              <Pressable style={styles.logButton} onPress={() => setShowLogForm(true)}>
                <Text style={styles.logButtonText}>📝 Antrenman Kaydı Ekle</Text>
              </Pressable>
            ) : (
              <View style={styles.logForm}>
                <Text style={styles.formTitle}>Yeni Kayıt</Text>
                
                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Set</Text>
                    <TextInput
                      style={styles.input}
                      value={sets}
                      onChangeText={setSets}
                      keyboardType="numeric"
                      placeholder="3"
                      placeholderTextColor={theme.colors.subtle}
                    />
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Tekrar</Text>
                    <TextInput
                      style={styles.input}
                      value={reps}
                      onChangeText={setReps}
                      placeholder="10"
                      placeholderTextColor={theme.colors.subtle}
                    />
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Ağırlık (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={theme.colors.subtle}
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Zorluk (1-5)</Text>
                  <View style={styles.difficultyRow}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Pressable
                        key={num}
                        style={[styles.difficultyButton, difficulty === num && styles.difficultyButtonActive]}
                        onPress={() => setDifficulty(num)}
                      >
                        <Text style={[styles.difficultyText, difficulty === num && styles.difficultyTextActive]}>
                          {num}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Not (opsiyonel)</Text>
                  <TextInput
                    style={[styles.input, styles.noteInput]}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Bugün nasıl hissettim..."
                    placeholderTextColor={theme.colors.subtle}
                    multiline
                  />
                </View>

                <View style={styles.formActions}>
                  <Pressable style={styles.cancelButton} onPress={resetForm}>
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.saveButton, createLogMutation.isPending && styles.saveButtonDisabled]}
                    onPress={handleSaveLog}
                    disabled={createLogMutation.isPending}
                  >
                    <Text style={styles.saveButtonText}>
                      {createLogMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    paddingVertical: 8,
  },
  closeButton: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  movementInfo: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  movementImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
  },
  movementName: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 12,
  },
  tagText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  instructions: {
    color: theme.colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  logButton: {
    backgroundColor: theme.colors.success,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logForm: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  formTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
    gap: 6,
  },
  formLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  difficultyButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  difficultyText: {
    color: theme.colors.muted,
    fontSize: 16,
    fontWeight: '700',
  },
  difficultyTextActive: {
    color: theme.colors.text,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
