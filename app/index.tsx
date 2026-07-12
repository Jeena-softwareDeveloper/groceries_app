import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store/hooks';

export default function Index() {
  const { districtId } = useAppSelector((s) => s.location);

  // Always land on home — login is only required for checkout/profile
  if (!districtId) return <Redirect href="/location" />;
  return <Redirect href="/(tabs)" />;
}
