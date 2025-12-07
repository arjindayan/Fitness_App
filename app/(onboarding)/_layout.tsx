import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#030304' },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
