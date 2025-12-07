import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { PastelBackdrop } from '@/components/PastelBackdrop';
import { TRAINING_DAYS } from '@/constants/trainingDays';
import { signOut } from '@/services/authService';
import { upsertProfile } from '@/services/profileService';
import { useSessionContext } from '@/state/SessionProvider';
import { TrainingDay } from '@/types/profile';
import { getDefaultTimezone } from '@/utils/timezone';
import { theme } from '@/theme';

const trainingDayEnum = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as [TrainingDay, ...TrainingDay[]]);

const schema = z.object({
  displayName: z.string().min(2, 'İsmin en az 2 karakter olmalı'),
  goal: z.string().min(2, 'Hedefini yaz'),
  goalDescription: z.string().optional(),
  timezone: z.string().min(2, 'Saat dilimini gir'),
  trainingDays: z.array(trainingDayEnum).min(1, 'En az 1 gün seç'),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingScreen() {
  const router = useRouter();
  const { session, profile, refreshProfile } = useSessionContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = useMemo<FormValues>(
    () => ({
      displayName: profile?.display_name ?? '',
      goal: profile?.goal ?? '',
      goalDescription: profile?.goal_description ?? '',
      timezone: profile?.timezone ?? getDefaultTimezone(),
      trainingDays: profile?.training_days ?? [],
    }),
    [profile]
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const selectedDays = watch('trainingDays');

  const toggleDay = (day: TrainingDay) => {
    setValue(
      'trainingDays',
      selectedDays.includes(day) ? selectedDays.filter((d) => d !== day) : [...selectedDays, day]
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!session?.user) {
      Alert.alert('Oturum bulunamadı', 'Lütfen tekrar giriş yap.');
      return;
    }

    if (!session.user.email) {
      Alert.alert('Email bulunamadı', 'Hesabında kayıtlı bir email adresi yok.');
      return;
    }

    setIsSubmitting(true);

    try {
      await upsertProfile(session.user.id, {
        displayName: values.displayName.trim(),
        email: session.user.email,
        goal: values.goal.trim(),
        goalDescription: values.goalDescription?.trim(),
        timezone: values.timezone,
        trainingDays: values.trainingDays,
        onboardingComplete: true,
      });

      await refreshProfile();
      router.replace('/(tabs)/today');
    } catch (error) {
      console.error(error);
      Alert.alert('Profili kaydederken hata oluştu', 'Tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <PastelBackdrop />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Hedeflerini tanımla</Text>
          <Pressable
            onPress={async () => {
              await signOut();
              router.replace('/(auth)');
            }}
          >
            <Text style={styles.exitText}>Çıkış yap</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Programlarını sana göre optimize edelim.</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onBlur, onChange, value } }) => (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Adın"
                  placeholderTextColor={theme.colors.subtle}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                {errors.displayName ? <Text style={styles.errorText}>{errors.displayName.message}</Text> : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="goal"
            render={({ field: { onBlur, onChange, value } }) => (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Hedef (örn. güçlenmek, yağ yakmak)"
                  placeholderTextColor={theme.colors.subtle}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                {errors.goal ? <Text style={styles.errorText}>{errors.goal.message}</Text> : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="goalDescription"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Kısa açıklama (opsiyonel)"
                placeholderTextColor={theme.colors.subtle}
                multiline
                numberOfLines={3}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            name="timezone"
            render={({ field: { onBlur, onChange, value } }) => (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Saat dilimi (örn. Europe/Istanbul)"
                  placeholderTextColor={theme.colors.subtle}
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                {errors.timezone ? <Text style={styles.errorText}>{errors.timezone.message}</Text> : null}
              </View>
            )}
          />

          <View>
            <Text style={styles.label}>Haftalık idman günlerin</Text>
            <View style={styles.daysWrap}>
              {TRAINING_DAYS.map((day) => {
                const isActive = selectedDays.includes(day.key);
                return (
                  <Pressable
                    key={day.key}
                    onPress={() => toggleDay(day.key)}
                    style={[styles.dayChip, isActive && styles.dayChipActive]}
                  >
                    <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>{day.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.trainingDays ? <Text style={styles.errorText}>{errors.trainingDays.message}</Text> : null}
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={isSubmitting}>
          <Text style={styles.primaryLabel}>{isSubmitting ? 'Kaydediliyor...' : 'Devam et'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: 24,
    gap: 24,
    paddingBottom: 40,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 16,
    marginBottom: 12,
  },
  form: {
    gap: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#a2b4d8',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
  },
  label: {
    color: theme.colors.text,
    marginBottom: 8,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  multiline: {
    textAlignVertical: 'top',
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  dayChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayLabel: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  dayLabelActive: {
    color: '#1a2a52',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#b8c7ff',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryLabel: {
    color: '#1a2a52',
    fontSize: 16,
    fontWeight: '700',
  },
  exitText: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    marginTop: 4,
  },
});
