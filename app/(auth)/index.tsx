import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { signInWithGoogle } from '@/services/authService';
import { theme } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleEmailPress = () => {
    router.push('/(auth)/email-login');
  };

  const handleGooglePress = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
      router.replace('/');
    } catch (error) {
      console.error(error);
      Alert.alert('Google girişi başarısız', 'Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#e9e5ff', '#d7e8ff', '#f7e6ff']} style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.badge}>FitnessXS</Text>
            <Text style={styles.titleLineOne}>Make your body</Text>
            <Text style={styles.titleLineTwo}>Healthy & Fit</Text>
            <Text style={styles.copy}>
              Kişiselleştirilmiş program, haftalık planlama, kaçırdığın günler otomatik kaydırma.
            </Text>
          </View>
          <View style={styles.placeholderCircle}>
            <View style={styles.placeholderBar} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Başla</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.primaryButton} onPress={handleEmailPress}>
              <Text style={styles.primaryLabel}>Email ile devam et</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleGooglePress} disabled={isGoogleLoading}>
              <Text style={styles.secondaryLabel}>
                {isGoogleLoading ? 'Google bağlanıyor...' : 'Google ile devam et'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipIcon}>📅</Text>
              <Text style={styles.chipText}>Haftalık plan</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipIcon}>🔥</Text>
              <Text style={styles.chipText}>Hedef odaklı</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipIcon}>🤝</Text>
              <Text style={styles.chipText}>Arkadaşlarla</Text>
            </View>
          </View>
        </View>

        <Text style={styles.helper}>
          Hesabın yok mu?{' '}
          <Link href="/(auth)/email-login" style={styles.link}>
            Hemen oluştur
          </Link>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'space-between',
  },
  heroCard: {
    backgroundColor: '#ffffffdd',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e5f0',
    shadowColor: '#7b6bff',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
  },
  heroTextBlock: {
    flex: 1,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: '#f2f2ff',
    color: '#7b6bff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titleLineOne: {
    color: '#2b2d42',
    fontSize: 24,
    fontWeight: '700',
  },
  titleLineTwo: {
    color: '#7b6bff',
    fontSize: 28,
    fontWeight: '800',
  },
  copy: {
    color: '#5b6170',
    fontSize: 15,
    lineHeight: 22,
  },
  placeholderCircle: {
    width: 120,
    height: 120,
    borderRadius: 120,
    backgroundColor: '#f4f4ff',
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e6e8f2',
  },
  placeholderBar: {
    width: 50,
    height: 8,
    borderRadius: 12,
    backgroundColor: '#d5d8e6',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e3e6f0',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  sectionTitle: {
    color: '#2b2d42',
    fontSize: 18,
    fontWeight: '700',
  },
  actionRow: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#7b6bff',
    paddingVertical: 16,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    shadowColor: '#7b6bff',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#f5f6fc',
    paddingVertical: 16,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d9dded',
  },
  secondaryLabel: {
    color: '#2b2d42',
    fontSize: 16,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f7f7ff',
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: '#e5e8f3',
  },
  chipIcon: {
    fontSize: 15,
  },
  chipText: {
    color: '#4a4f63',
    fontWeight: '600',
    fontSize: 13,
  },
  helper: {
    color: '#6f758c',
    textAlign: 'center',
  },
  link: {
    color: '#7b6bff',
    fontWeight: '700',
  },
});
