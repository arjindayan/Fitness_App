import { Stack } from 'expo-router';

export default function AuthLayout() {
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
