import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { PastelBackdrop } from '@/components/PastelBackdrop';
import { signInWithEmail, signUpWithEmail } from '@/services/authService';
import { Theme, useTheme } from '@/theme';

const schema = z.object({
  email: z.string().email('Geçerli bir email girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
});

type FormValues = z.infer<typeof schema>;

export default function EmailLoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
    <SafeAreaView style={styles.safeArea}>
      <PastelBackdrop />
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
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flexGrow: 1,
      padding: 24,
      justifyContent: 'center',
      gap: 24,
    },
    heading: {
      fontSize: 28,
      color: theme.colors.text,
      fontWeight: '800',
    },
    form: {
      gap: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 18,
      shadowColor: '#a2b4d8',
      shadowOpacity: 0.3,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 12 },
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
      shadowColor: '#b8c7ff',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 10 },
    },
    primaryLabel: {
      color: '#1a2a52',
      fontWeight: '700',
      fontSize: 16,
    },
    switcher: {
      marginTop: 8,
      alignItems: 'center',
    },
    switcherLabel: {
      color: theme.colors.muted,
      fontWeight: '700',
    },
    errorText: {
      color: theme.colors.danger,
      marginTop: 4,
      fontSize: 13,
    },
  });
