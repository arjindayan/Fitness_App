import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';

import { AppProvider } from '@/providers/AppProvider';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
    }
  }, []);

  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="program-builder"
          options={{ presentation: 'modal', headerShown: true, title: 'Yeni Program' }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AppProvider>
  );
}
