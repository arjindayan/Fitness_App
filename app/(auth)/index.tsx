import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PastelBackdrop } from '@/components/PastelBackdrop';
import { signInWithGoogle } from '@/services/authService';
import { Theme, useTheme } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const heroGradient = isDark ? ['#1b2742', '#1d2436', '#141927'] : ['#a8c0ff', '#c5b4e3', '#ffd6e0'];
  const emailGradient = isDark ? ['#5564d6', '#3f4fa8'] : ['#a8c0ff', '#8f94fb'];

  const handleEmailPress = () => {
    router.push('/(auth)/email-login');
  };

  const handleGooglePress = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      Alert.alert('Google girişi başarısız', 'Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <PastelBackdrop />
      <View style={styles.container}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoContainer}
          >
            <View style={styles.logoInner}>
              <Text style={styles.logoEmoji}>💪</Text>
            </View>
          </LinearGradient>
          
          <View style={styles.brandSection}>
            <Text style={styles.brandName}>FitnessXS</Text>
            <Text style={styles.brandTagline}>Dönüşümün başlasın</Text>
          </View>

          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>
              <Text style={styles.heroTitleBold}>Güçlü</Text> hisset,{'\n'}
              <Text style={styles.heroTitleAccent}>Zarif</Text> görün
            </Text>
            <Text style={styles.heroDescription}>
              Kişiselleştirilmiş antrenman programları, akıllı planlama ve arkadaşlarınla birlikte motivasyon
            </Text>
          </View>

          {/* Feature Pills */}
          <View style={styles.featureRow}>
            <View style={styles.featurePill}>
              <Text style={styles.featureIcon}>📅</Text>
              <Text style={styles.featureText}>Haftalık Plan</Text>
            </View>
            <View style={styles.featurePill}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Hedef Odaklı</Text>
            </View>
            <View style={styles.featurePill}>
              <Text style={styles.featureIcon}>🤝</Text>
              <Text style={styles.featureText}>Sosyal</Text>
            </View>
          </View>
        </View>

        {/* Login Section */}
        <View style={styles.loginSection}>
          <Text style={styles.loginTitle}>Hemen Başla</Text>
          <Text style={styles.loginSubtitle}>Hesabınla giriş yap veya yeni hesap oluştur</Text>
          
          <View style={styles.buttonGroup}>
            <Pressable style={styles.emailButton} onPress={handleEmailPress}>
              <LinearGradient
                colors={emailGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.emailIcon}>✉️</Text>
              <Text style={styles.emailButtonText}>Email ile devam et</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]} 
              onPress={handleGooglePress} 
              disabled={isGoogleLoading}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>
                {isGoogleLoading ? 'Bağlanıyor...' : 'Google ile devam et'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.termsText}>
            Devam ederek{' '}
            <Text style={styles.termsLink}>Kullanım Şartları</Text>
            {' '}ve{' '}
            <Text style={styles.termsLink}>Gizlilik Politikası</Text>
            'nı kabul etmiş olursun.
          </Text>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  // Hero Section
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8f94fb',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  logoInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 40,
  },
  brandSection: {
    alignItems: 'center',
    gap: 2,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: -1,
  },
  brandTagline: {
    fontSize: 14,
    color: theme.colors.muted,
    fontWeight: '500',
  },
  heroTextBlock: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  heroTitle: {
    fontSize: 24,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 32,
  },
  heroTitleBold: {
    fontWeight: '800',
    color: '#4a5568',
  },
  heroTitleAccent: {
    fontWeight: '800',
    color: '#8f94fb',
  },
  heroDescription: {
    fontSize: 13,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureIcon: {
    fontSize: 12,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
  },
  // Login Section
  loginSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#7b8dbd',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: -6,
  },
  buttonGroup: {
    gap: 10,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#8f94fb',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  emailIcon: {
    fontSize: 16,
  },
  emailButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  termsText: {
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#8f94fb',
    fontWeight: '600',
  },
});
