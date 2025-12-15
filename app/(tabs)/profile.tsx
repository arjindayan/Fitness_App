import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PastelBackdrop } from '@/components/PastelBackdrop';
import { signOut } from '@/services/authService';
import { useSessionContext } from '@/state/SessionProvider';
import { Theme, useTheme } from '@/theme';

export default function ProfileScreen() {
  const { profile } = useSessionContext();
  const router = useRouter();
  const { theme, mode, toggleMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)');
    } catch (error) {
      console.error(error);
      Alert.alert('Çıkış yapılamadı', 'Lütfen tekrar dene.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <PastelBackdrop />
      <View style={styles.container}>
        <Text style={styles.title}>{profile?.display_name ?? 'Profil'}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Hedef</Text>
          <Text style={styles.value}>{profile?.goal ?? '-'}</Text>
          <Text style={styles.label}>Saat dilimi</Text>
          <Text style={styles.value}>{profile?.timezone ?? '-'}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.preferenceRow}>
            <View>
              <Text style={styles.label}>Tema</Text>
              <Text style={styles.value}>{mode === 'dark' ? 'Koyu tema' : 'Acik tema'}</Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleMode}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={mode === 'dark' ? '#0f1d3d' : '#ffffff'}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/(onboarding)')}>
            <Text style={styles.secondaryLabel}>Profilini düzenle</Text>
          </Pressable>

          <Pressable style={styles.dangerButton} onPress={handleSignOut}>
            <Text style={styles.dangerLabel}>Çıkış yap</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#9eb2db',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  label: {
    color: theme.colors.muted,
    fontSize: 13,
    textTransform: 'uppercase',
    marginTop: 8,
    letterSpacing: 0.4,
  },
  value: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actions: {
    marginTop: 12,
    gap: 12,
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    shadowColor: '#9eb2db',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  secondaryLabel: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  dangerButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#ffecef',
  },
  dangerLabel: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
});
