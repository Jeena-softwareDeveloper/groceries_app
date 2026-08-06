import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store/hooks';
import { useBootstrap } from '@/hooks/useBootstrap';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { ready } = useBootstrap();
  const { districtId } = useAppSelector((s) => s.location);
  const { accessToken, user } = useAppSelector((s) => s.auth);

  // Wait for hydration — NavigationGuard (splash) already covers the UI
  // but this prevents premature redirects with stale pre-hydration state
  if (!ready) return null;

  if (!districtId) return <Redirect href="/location" />;
  if (accessToken && user?.role === 'VENDOR') return <Redirect href="/(vendor)" />;
  return <Redirect href="/(tabs)" />;
}
