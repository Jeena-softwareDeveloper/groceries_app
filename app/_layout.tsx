import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { fetchCart } from '@/api/customer';
import { colors } from '@/constants/theme';
import { useBootstrap } from '@/hooks/useBootstrap';
import { store } from '@/store';
import { setItemCount } from '@/store/cartSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { ready } = useBootstrap();
  const { accessToken } = useAppSelector((s) => s.auth);
  const { districtId } = useAppSelector((s) => s.location);

  useEffect(() => {
    if (!ready) return;

    const inAuth = segments[0] === '(auth)';
    const onLocation = segments[0] === 'location';

    if (!accessToken && !inAuth) {
      router.replace('/(auth)/login');
      return;
    }

    if (accessToken && inAuth) {
      if (!districtId) {
        router.replace('/location');
      } else {
        router.replace('/(tabs)');
      }
      return;
    }

    if (accessToken && !districtId && !onLocation && !inAuth) {
      router.replace('/location');
    }
  }, [ready, accessToken, districtId, segments, router]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

function CartBadgeSync() {  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);
  const { data } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: !!accessToken,
  });

  useEffect(() => {
    const count = data?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
    dispatch(setItemCount(count));
  }, [data, dispatch]);

  return null;
}

function RootNavigator() {
  return (
    <NavigationGuard>
      <CartBadgeSync />
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="location" options={{ presentation: 'modal', headerShown: true, title: 'Choose location' }} />
        <Stack.Screen name="shop/[id]" options={{ headerShown: true, title: 'Shop' }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: true, title: 'Product' }} />
        <Stack.Screen name="wishlist" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="wallet" options={{ headerShown: false }} />
        <Stack.Screen name="support" options={{ headerShown: false }} />
        <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: 'Order' }} />
        <Stack.Screen name="index" />
      </Stack>
    </NavigationGuard>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
