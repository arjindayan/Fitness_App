import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';

import { LoadingScreen } from '@/components/LoadingScreen';
import { AppProvider } from '@/providers/AppProvider';
import { useSessionContext } from '@/state/SessionProvider';

function RootLayoutNav() {
  const { session, profile, isLoading } = useSessionContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!session) {
      // Session yoksa ve auth'ta değilsek, auth'a git
      if (!inAuthGroup) {
        router.replace('/(auth)');
      }
    } else if (!profile) {
      // Session var ama profile henüz yüklenmemiş, bekle
      return;
    } else if (!profile.onboarding_complete) {
      // Session var, profile var ama onboarding tamamlanmamış
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)');
      }
    } else {
      // Session var ve onboarding tamamlanmış
      if (inAuthGroup || inOnboardingGroup || segments[0] === 'index' || segments.length === 0) {
        router.replace('/(tabs)/today');
      }
    }
  }, [session, profile, isLoading, segments]);

  // İlk yükleme sırasında loading göster
  if (isLoading) {
    return <LoadingScreen message="FitnessXS hazırlanıyor..." />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="program-builder"
        options={{ presentation: 'modal', headerShown: true, title: 'Yeni Program' }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}
