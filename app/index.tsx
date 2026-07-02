import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store/hooks';

export default function Index() {
  const { accessToken } = useAppSelector((s) => s.auth);
  const { districtId } = useAppSelector((s) => s.location);

  if (!accessToken) return <Redirect href="/(auth)/login" />;
  if (!districtId) return <Redirect href="/location" />;
  return <Redirect href="/(tabs)" />;
}
