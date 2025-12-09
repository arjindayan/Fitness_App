import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PastelBackdrop } from '@/components/PastelBackdrop';
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
      // Session oluşunca app/_layout.tsx otomatik yönlendirecek
    } catch (error) {
      console.error(error);
      Alert.alert('Google girişi başarısız', 'Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <PastelBackdrop />
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.badge}>FitnessXS</Text>
            <Text style={styles.titleLineOne}>Güçlü hisset</Text>
            <Text style={styles.titleLineTwo}>Zarif görün</Text>
            <Text style={styles.copy}>
              Kişiselleştirilmiş program, haftalık planlama, kaçırdığın günler için akıllı kaydırma.
            </Text>
          </View>
          <LinearGradient colors={['#c0e1ff', '#f6d9ff']} style={styles.placeholderCircle}>
            <View style={styles.placeholderBar} />
          </LinearGradient>
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
              <Text style={styles.chipIcon}>🎯</Text>
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
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'space-between',
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#7b8dbd',
    shadowOpacity: 0.25,
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
    backgroundColor: theme.colors.primarySoft,
    color: '#1a2a52',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titleLineOne: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  titleLineTwo: {
    color: '#1a2a52',
    fontSize: 28,
    fontWeight: '800',
  },
  copy: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  placeholderCircle: {
    width: 120,
    height: 120,
    borderRadius: 120,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  placeholderBar: {
    width: 50,
    height: 8,
    borderRadius: 12,
    backgroundColor: '#d5d8e6',
  },
  sectionCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  actionRow: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    shadowColor: '#7b8dbd',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryLabel: {
    color: '#1a2a52',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.colors.inputBg,
    paddingVertical: 16,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryLabel: {
    color: theme.colors.text,
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipIcon: {
    fontSize: 15,
  },
  chipText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  helper: {
    color: theme.colors.muted,
    textAlign: 'center',
  },
  link: {
    color: '#1a2a52',
    fontWeight: '800',
  },
});
