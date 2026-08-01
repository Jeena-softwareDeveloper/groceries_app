import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store/hooks';

export default function Index() {
  const { districtId } = useAppSelector((s) => s.location);

  const { accessToken, user } = useAppSelector((s) => s.auth);

  if (!districtId) return <Redirect href="/location" />;
  if (accessToken && user?.role === 'VENDOR') return <Redirect href="/(vendor)" />;
  return <Redirect href="/(tabs)" />;
}
