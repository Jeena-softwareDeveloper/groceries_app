import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, View } from 'react-native';
import { Provider } from 'react-redux';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  useFonts,
} from '@expo-google-fonts/roboto';
import { cartApi } from '@/api';
import { colors } from '@/constants/theme';
import { useBootstrap } from '@/hooks/useBootstrap';
import { store } from '@/store';
import { setItemCount } from '@/store/cartSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

// Apply Roboto globally as default font
const defaultFontFamily = 'Roboto_400Regular';
(Text as unknown as { defaultProps?: { style?: TextStyle } }).defaultProps = {
  style: { fontFamily: defaultFontFamily },
};
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { ready } = useBootstrap();
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const { districtId } = useAppSelector((s) => s.location);
  const { appSettings } = useAppSelector((s) => s.config);

  useEffect(() => {
    if (!ready) return;

    const inAuth = segments[0] === '(auth)';
    const onLocation = segments[0] === 'location';

    // If logged in and on auth screen, redirect out
    if (accessToken && inAuth) {
      if (!districtId) {
        router.replace('/location');
      } else {
        const role = user?.role || 'GUEST';
        const defaultRoute = appSettings?.roles[role]?.defaultRoute || '/(tabs)';
        router.replace(defaultRoute as any);
      }
      return;
    }

    // If logged in but no location selected
    if (accessToken && !districtId && !onLocation && !inAuth) {
      router.replace('/location');
      return;
    }

    // If NOT logged in, enforce redirect to auth (unless already on location or auth)
    if (!accessToken && !inAuth && !onLocation) {
      // Per requirements, even Home is protected. Unauthenticated users must go to Location then Login.
      if (!districtId) {
        router.replace('/location');
      } else {
        router.replace('/(auth)/login');
      }
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
    queryFn: cartApi.fetchCart,
    enabled: !!accessToken,
    retry: false,
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
        <Stack.Screen name="(vendor)" />
        <Stack.Screen name="location" options={{ presentation: 'modal', headerShown: false }} />
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
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
