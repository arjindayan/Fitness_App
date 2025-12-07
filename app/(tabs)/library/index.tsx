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

import { MOVEMENT_CATEGORIES, MOVEMENT_EQUIPMENTS } from '@/constants/movements';
import { useCreateMovementMutation, useMovementList } from '@/services/movementService';

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
      <View style={styles.container}>
        <Text style={styles.title}>Hareket kütüphanesi</Text>
        <TextInput
          style={styles.search}
          placeholder="Hareket ara"
          placeholderTextColor="#5b6170"
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterRow}>
          <FlatList
            data={[{ id: null, name: 'Tümü' }, ...MOVEMENT_CATEGORIES]}
            horizontal
            keyExtractor={(item) => item.id ?? 'all'}
            contentContainerStyle={{ gap: 8 }}
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
            <ActivityIndicator />
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
                    placeholderTextColor="#5b6170"
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
                    placeholderTextColor="#5b6170"
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
                    placeholderTextColor="#5b6170"
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
                    placeholderTextColor="#5b6170"
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
                    placeholderTextColor="#5b6170"
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
    backgroundColor: '#030303',
  },
  container: {
    flex: 1,
    backgroundColor: '#030303',
    padding: 16,
  },
  title: {
    color: '#f8f8f8',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  search: {
    backgroundColor: '#11121a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2433',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: '#7f5dfa',
    borderColor: '#7f5dfa',
  },
  filterText: {
    color: '#9ea3b5',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  addButton: {
    marginBottom: 16,
    backgroundColor: '#14141a',
    padding: 14,
    borderRadius: 12,
    borderColor: '#2b2b33',
    borderWidth: 1,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fefefe',
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#0b0f18',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#171c2d',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cardMeta: {
    color: '#8f94a3',
    marginTop: 4,
  },
  cardNote: {
    color: '#c5c9d6',
    marginTop: 8,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#050505',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#11121a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#1f2433',
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
    color: '#8f94a3',
  },
  modalSave: {
    backgroundColor: '#7f5dfa',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#ff8c8c',
    marginBottom: 8,
  },
});
