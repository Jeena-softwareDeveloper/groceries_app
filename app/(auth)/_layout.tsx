import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'transparentModal', contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="login" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
