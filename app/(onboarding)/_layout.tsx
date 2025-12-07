import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f6f8ff' },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
