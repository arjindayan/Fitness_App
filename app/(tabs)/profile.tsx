import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/services/authService';
import { useSessionContext } from '@/state/SessionProvider';

export default function ProfileScreen() {
  const { profile } = useSessionContext();
  const router = useRouter();

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
      <View style={styles.container}>
        <Text style={styles.title}>{profile?.display_name ?? 'Profil'}</Text>
        <Text style={styles.label}>Hedef</Text>
        <Text style={styles.value}>{profile?.goal ?? '-'}</Text>
        <Text style={styles.label}>Saat dilimi</Text>
        <Text style={styles.value}>{profile?.timezone ?? '-'}</Text>

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030303',
  },
  container: {
    flex: 1,
    backgroundColor: '#030303',
    padding: 24,
    gap: 12,
  },
  title: {
    color: '#f8f8f8',
    fontSize: 28,
    fontWeight: '700',
  },
  label: {
    color: '#808499',
    fontSize: 13,
    textTransform: 'uppercase',
    marginTop: 16,
  },
  value: {
    color: '#f5f5f7',
    fontSize: 18,
    fontWeight: '500',
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2433',
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryLabel: {
    color: '#f5f5f5',
    fontWeight: '600',
  },
  dangerButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff8c8c',
    paddingVertical: 16,
    alignItems: 'center',
  },
  dangerLabel: {
    color: '#ff8c8c',
    fontWeight: '600',
  },
});
