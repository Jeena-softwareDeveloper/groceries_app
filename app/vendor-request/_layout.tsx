import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function VendorRequestLayout() {
  const router = useRouter();
  
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Join as Vendor',
          headerLeft: () => (
            <Pressable onPress={() => router.replace('/(tabs)')} style={{ marginLeft: 8, marginRight: 16 }}>
              <Feather name="arrow-left" size={24} color={colors.primary} />
            </Pressable>
          )
        }} 
      />
      <Stack.Screen name="form" options={{ title: 'Vendor Application', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
