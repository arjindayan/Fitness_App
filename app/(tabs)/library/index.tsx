import { zodResolver } from '@hookform/resolvers/zod';
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
import { z } from 'zod';

import { PastelBackdrop } from '@/components/PastelBackdrop';
import { MOVEMENT_CATEGORIES, MOVEMENT_EQUIPMENTS } from '@/constants/movements';
import { useCreateMovementMutation, useMovementList } from '@/services/movementService';
import { theme } from '@/theme';

const movementSchema = z.object({
  name: z.string().min(2, 'İsim gir'),
  categoryId: z.string().optional(),
  equipment: z.string().optional(),
  difficulty: z.string().optional(),
  instructions: z.string().optional(),
});

export default function LibraryScreen() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  const movementParams = useMemo(
    () => ({
      search,
      categoryId,
      equipment,
    }),
    [search, categoryId, equipment]
  );

  const { data, isLoading } = useMovementList(movementParams);
  const createMovementMutation = useCreateMovementMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      equipment: '',
      difficulty: '',
      instructions: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await createMovementMutation.mutateAsync({
      name: values.name,
      categoryId: values.categoryId || null,
      equipment: values.equipment || null,
      difficulty: values.difficulty || null,
      instructions: values.instructions || null,
    });
    reset();
    setModalVisible(false);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <PastelBackdrop />
      <View style={styles.container}>
        <Text style={styles.title}>Hareket kütüphanesi</Text>
        <TextInput
          style={styles.search}
          placeholder="Hareket ara"
          placeholderTextColor={theme.colors.subtle}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterRow}>
          <FlatList
            data={[{ id: null, name: 'Tümü' }, ...MOVEMENT_CATEGORIES]}
            horizontal
            keyExtractor={(item) => item.id ?? 'all'}
            contentContainerStyle={{ gap: 8 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const isActive = categoryId === item.id;
              return (
                <Pressable
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setCategoryId(isActive ? null : item.id)}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{item.name}</Text>
                </Pressable>
              );
            }}
          />
        </View>

        <View style={styles.filterRow}>
          <FlatList
            data={[{ value: null, label: 'Ekipman' }, ...MOVEMENT_EQUIPMENTS]}
            horizontal
            keyExtractor={(item) => item.value ?? 'equipment'}
            contentContainerStyle={{ gap: 8 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const isActive = equipment === item.value;
              return (
                <Pressable
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setEquipment(isActive ? null : item.value)}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{item.label}</Text>
                </Pressable>
              );
            }}
          />
        </View>

        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>Özel hareket ekle</Text>
        </Pressable>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={theme.colors.text} />
          </View>
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12, paddingBottom: 120 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  {item.equipment ?? 'Ekipman yok'} • {item.difficulty ?? 'Seviye belirtilmedi'}
                </Text>
                {item.instructions ? <Text style={styles.cardNote}>{item.instructions}</Text> : null}
              </View>
            )}
          />
        )}

        <Modal visible={isModalVisible} animationType="slide" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Yeni hareket</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.modalInput}
                    placeholder="İsim"
                    placeholderTextColor={theme.colors.subtle}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name.message}</Text> : null}

              <Controller
                control={control}
                name="categoryId"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Kategori ID (opsiyonel)"
                    placeholderTextColor={theme.colors.subtle}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              <Controller
                control={control}
                name="equipment"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ekipman (barbell/dumbbell...)"
                    placeholderTextColor={theme.colors.subtle}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              <Controller
                control={control}
                name="difficulty"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Seviye (beginner/intermediate/advanced)"
                    placeholderTextColor={theme.colors.subtle}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              <Controller
                control={control}
                name="instructions"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.modalInput, styles.modalMultiline]}
                    placeholder="Notlar"
                    placeholderTextColor={theme.colors.subtle}
                    value={value}
                    onChangeText={onChange}
                    multiline
                  />
                )}
              />

              <View style={styles.modalActions}>
                <Pressable style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Vazgeç</Text>
                </Pressable>
                <Pressable style={styles.modalSave} onPress={onSubmit}>
                  <Text style={styles.modalSaveText}>
                    {createMovementMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
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
    gap: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  search: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: 14,
    padding: 12,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterRow: {
    marginBottom: 4,
  },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    color: theme.colors.muted,
  },
  filterTextActive: {
    color: '#1a2a52',
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 14,
    borderColor: theme.colors.border,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#a2b4d8',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  addButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#a2b4d8',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  cardMeta: {
    color: theme.colors.muted,
    marginTop: 4,
  },
  cardNote: {
    color: theme.colors.text,
    marginTop: 8,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
    shadowColor: '#8da6d6',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  modalMultiline: {
    textAlignVertical: 'top',
    height: 80,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: theme.colors.muted,
    fontWeight: '700',
  },
  modalSave: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#b8c7ff',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  modalSaveText: {
    color: '#1a2a52',
    fontWeight: '700',
  },
  errorText: {
    color: theme.colors.danger,
    marginBottom: 8,
  },
});
