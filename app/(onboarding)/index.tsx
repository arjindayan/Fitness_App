import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PastelBackdrop } from '@/components/common/PastelBackdrop';
import { signOut } from '@/services/authService';
import { upsertProfile } from '@/services/profileService';
import { useSessionContext } from '@/state/SessionProvider';
import { getDefaultTimezone } from '@/utils/timezone';
import { Theme, useTheme } from '@/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { session, refreshProfile, profile } = useSessionContext();

  const isEditing = profile?.onboarding_complete ?? false;

  const [step, setStep] = useState(isEditing ? 2 : 1);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [heightCm, setHeightCm] = useState(
    profile?.height_cm ? profile.height_cm.toString() : ''
  );
  const [weightKg, setWeightKg] = useState(
    profile?.weight_kg ? profile.weight_kg.toString() : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const animateToNextStep = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNameSubmit = () => {
    if (displayName.trim().length < 2) {
      Alert.alert('Hata', 'İsmin en az 2 karakter olmalı');
      return;
    }
    animateToNextStep(2);
  };

  const handleHeightWeightSubmit = () => {
    if (heightCm.trim()) {
      const height = parseFloat(heightCm);
      if (!height || height < 100 || height > 250) {
        Alert.alert('Hata', 'Boy 100-250 cm arasında olmalı');
        return;
      }
    }

    if (weightKg.trim()) {
      const weight = parseFloat(weightKg);
      if (!weight || weight < 30 || weight > 300) {
        Alert.alert('Hata', 'Kilo 30-300 kg arasında olmalı');
        return;
      }
    }

    handleComplete();
  };

  const handleComplete = async () => {
    if (!session?.user) {
      Alert.alert('Hata', 'Oturum bulunamadı');
      return;
    }

    setIsSubmitting(true);

    try {
      const height = heightCm.trim() ? parseFloat(heightCm) : null;
      const weight = weightKg.trim() ? parseFloat(weightKg) : null;

      await upsertProfile(session.user.id, {
        displayName: displayName.trim() || profile?.display_name || 'Kullanıcı',
        email: session.user.email ?? '',
        timezone: profile?.timezone ?? getDefaultTimezone(),
        trainingDays: profile?.training_days ?? [],
        onboardingComplete: true,
        heightCm: height ? Math.round(height) : null,
        weightKg: weight ? parseFloat(weight.toFixed(2)) : null,
      });

      await refreshProfile();

      if (isEditing) {
        router.replace('/(tabs)/profile');
        return;
      }

      setShowSuccess(true);
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          router.replace('/(tabs)/today');
        }, 1500);
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Profili kaydederken hata oluştu', 'Tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <PastelBackdrop />
        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successContent,
              {
                opacity: successOpacity,
                transform: [{ scale: successScale }],
              },
            ]}
          >
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Hoş geldin, {displayName}!</Text>
            <Text style={styles.successSubtitle}>Antrenman yolculuğun başlıyor...</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <PastelBackdrop />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
          </View>
          <Pressable
            onPress={async () => {
              await signOut();
              router.replace('/(auth)');
            }}
          >
            <Text style={styles.exitText}>Çıkış</Text>
          </Pressable>
        </View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {step === 1 ? (
            <>
              <Text style={styles.stepLabel}>Adım 1/2</Text>
              <Text style={styles.title}>{isEditing ? 'İsmini güncelle' : 'Sana nasıl hitap edelim?'}</Text>
              <Text style={styles.subtitle}>İsmini veya takma adını yaz</Text>

              <View style={styles.inputCard}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Adın"
                  placeholderTextColor={theme.colors.subtle}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoFocus
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={handleNameSubmit}
                />
              </View>

              <Pressable
                style={[styles.primaryButton, displayName.trim().length < 2 && styles.primaryButtonDisabled]}
                onPress={handleNameSubmit}
                disabled={displayName.trim().length < 2}
              >
                <Text style={styles.primaryLabel}>Devam et</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.stepLabel}>Adım 2/2</Text>
              <Text style={styles.title}>{isEditing ? 'Fiziksel bilgilerini güncelle' : 'Fiziksel bilgilerin'}</Text>
              <Text style={styles.subtitle}>Boy ve kilonu gir (isteğe bağlı)</Text>

              <View style={styles.inputCard}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Boy (cm)"
                  placeholderTextColor={theme.colors.subtle}
                  value={heightCm}
                  onChangeText={setHeightCm}
                  keyboardType="numeric"
                  autoFocus
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputCard}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Kilo (kg)"
                  placeholderTextColor={theme.colors.subtle}
                  value={weightKg}
                  onChangeText={setWeightKg}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={handleHeightWeightSubmit}
                />
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.backButton}
                  onPress={() => {
                    if (isEditing) {
                      router.replace('/(tabs)/profile');
                    } else {
                      animateToNextStep(1);
                    }
                  }}
                >
                  <Text style={styles.backLabel}>← Geri</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.primaryButton,
                    styles.completeButton,
                    isSubmitting && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleHeightWeightSubmit}
                  disabled={isSubmitting}
                >
                  <Text style={styles.primaryLabel}>
                    {isSubmitting ? 'Kaydediliyor...' : isEditing ? 'Kaydet' : 'Başlayalım! 🚀'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Animated.View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  exitText: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    gap: 16,
  },
  stepLabel: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 16,
    marginBottom: 20,
  },
  inputCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#a2b4d8',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  nameInput: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#b8c7ff',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  completeButton: {
    flex: 1,
  },
  primaryLabel: {
    color: '#1a2a52',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backLabel: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successContent: {
    alignItems: 'center',
    gap: 16,
  },
  successEmoji: {
    fontSize: 80,
  },
  successTitle: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    color: theme.colors.muted,
    fontSize: 18,
    textAlign: 'center',
  },
});
