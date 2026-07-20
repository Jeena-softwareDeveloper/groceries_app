import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store/hooks';

export default function Index() {
  const { districtId } = useAppSelector((s) => s.location);

  const { accessToken } = useAppSelector((s) => s.auth);

  if (!districtId) return <Redirect href="/location" />;
  if (!accessToken) return <Redirect href="/(auth)/login" />;
  
  return <Redirect href="/(tabs)" />;
}
