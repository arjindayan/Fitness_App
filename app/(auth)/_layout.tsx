import { Redirect, Stack } from 'expo-router';

import { useSessionContext } from '@/state/SessionProvider';

export default function AuthLayout() {
  const { session, isLoading } = useSessionContext();

  // Prevent authenticated users from ever seeing the auth stack (avoids bouncing back after login races)
  if (!isLoading && session) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f6f8ff' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="email-login" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
