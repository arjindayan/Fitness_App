import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { signInWithEmail, signUpWithEmail } from '@/services/authService';
import { theme } from '@/theme';

const schema = z.object({
  email: z.string().email('Geçerli bir email girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
});

type FormValues = z.infer<typeof schema>;

export default function EmailLoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(values);
        router.replace('/(onboarding)/');
      } else {
        await signUpWithEmail(values);
        Alert.alert('Hesap oluşturuldu', 'Emailine gelen bağlantıyı onayladıktan sonra giriş yapabilirsin.');
        setMode('login');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('İşlem başarısız', error?.message ?? 'Bilgilerini kontrol ederek tekrar dene.');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{mode === 'login' ? 'Tekrar hoş geldin' : 'Yeni hesap oluştur'}</Text>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Şifre"
                placeholderTextColor={theme.colors.subtle}
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}
            </View>
          )}
        />

        <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={isSubmitting}>
          <Text style={styles.primaryLabel}>
            {isSubmitting ? 'Gönderiliyor...' : mode === 'login' ? 'Giriş yap' : 'Kaydol'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => setMode((curr) => (curr === 'login' ? 'signup' : 'login'))}
        style={styles.switcher}
      >
        <Text style={styles.switcherLabel}>
          {mode === 'login' ? 'Hesabın yok mu? Kaydol' : 'Zaten hesabın var mı? Giriş yap'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
    justifyContent: 'center',
    gap: 24,
  },
  heading: {
    fontSize: 28,
    color: theme.colors.text,
    fontWeight: '700',
  },
  form: {
    gap: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryLabel: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  switcher: {
    marginTop: 8,
    alignItems: 'center',
  },
  switcherLabel: {
    color: theme.colors.muted,
  },
  errorText: {
    color: theme.colors.danger,
    marginTop: 4,
    fontSize: 13,
  },
});
