import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { customerApi } from '@/api/customer.api';

export default function ReferScreen() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const router = useRouter();

  useEffect(() => {
    const handleReferral = async () => {
      if (ref) {
        try {
          // 1. Save locally for when user signs up
          await SecureStore.setItemAsync('REFERRAL_CODE', ref);

          // 2. Log app install in the backend
          await customerApi.logReferralInstall(ref);
        } catch (error) {
          console.log('Failed to log referral install:', error);
        }
      }
      // Redirect to home page
      router.replace('/(tabs)');
    };

    handleReferral();
  }, [ref]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
      <ActivityIndicator size="large" color="#059669" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#334155' }}>Processing...</Text>
    </View>
  );
}
