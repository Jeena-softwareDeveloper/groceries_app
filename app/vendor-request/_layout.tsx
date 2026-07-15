import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function VendorRequestLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Join as Vendor' }} />
      <Stack.Screen name="form" options={{ title: 'Vendor Application', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
