import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextStyle, View, Linking, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import { CustomSplashScreen } from '@/components/CustomSplashScreen';
import Toast from 'react-native-toast-message';
import LoginScreen from '@/app/(auth)/login';
import LocationScreen from '@/app/location';
import { setShowLoginModal } from '@/store/authSlice';
import { setShowLocationModal } from '@/store/locationSlice';
import { customerApi } from '@/api';

// ── Version helpers ─────────────────────────────────────────────────────────
function parseVer(v: string) {
  return (v || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
}
function isOutdated(current: string, min: string) {
  const [cMaj, cMin, cPatch] = parseVer(current);
  const [mMaj, mMin, mPatch] = parseVer(min);
  if (cMaj !== mMaj) return cMaj < mMaj;
  if (cMin !== mMin) return cMin < mMin;
  return cPatch < mPatch;
}

function ForceUpdateScreen({ playStoreUrl }: { playStoreUrl: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Text style={{ fontSize: 48 }}>🔄</Text>
      </View>
      <Text style={{ fontSize: 24, fontFamily: 'Roboto_700Bold', color: '#14532d', textAlign: 'center', marginBottom: 12 }}>
        Update Required
      </Text>
      <Text style={{ fontSize: 15, color: '#374151', textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
        A new version of All Time Market is available. Please update the app to continue.
      </Text>
      <TouchableOpacity
        onPress={() => Linking.openURL(playStoreUrl)}
        style={{ backgroundColor: '#16a34a', paddingHorizontal: 36, paddingVertical: 16, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <Text style={{ color: '#fff', fontSize: 17, fontFamily: 'Roboto_700Bold' }}>Update on Play Store</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 20 }}>
        Current version: {Constants.expoConfig?.version ?? '—'}
      </Text>
    </View>
  );
}

// Keep the native splash screen visible until we are ready to replace it
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

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
  const { districtId, locationResolved, latitude } = useAppSelector((s) => s.location);
  const dispatch = useAppDispatch();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  // After splash exits: open location modal only if neither manual nor GPS location is set
  useEffect(() => {
    const hasLocation = !!districtId || !!latitude;
    if (!isSplashVisible && locationResolved && !hasLocation) {
      dispatch(setShowLocationModal(true));
    }
  }, [isSplashVisible, locationResolved, districtId, latitude, dispatch]);

  useEffect(() => {
    if (!ready) return;

    const inAuth = segments[0] === '(auth)';
    const onLocation = segments[0] === 'location';

    // If logged in and on auth screen, redirect out
    if (accessToken && inAuth) {
      const hasLoc = !!districtId || !!latitude;
      if (!hasLoc) {
        router.replace('/location');
      } else {
        router.replace(user?.role === 'VENDOR' ? '/(vendor)' : '/(tabs)');
      }
      return;
    }

    // Role-based routing enforcement for authenticated users
    if (accessToken) {
      const inVendorApp = segments[0] === '(vendor)' || segments[0] === 'vendor-notifications';
      if (user?.role === 'VENDOR' && !inVendorApp && !onLocation) {
        router.replace('/(vendor)');
        return;
      }
      if (user?.role === 'CUSTOMER' && inVendorApp) {
        router.replace('/(tabs)');
        return;
      }
    }
  }, [ready, accessToken, districtId, segments, router, user]);

  if (isSplashVisible) {
    return <CustomSplashScreen ready={ready} onFinish={() => setIsSplashVisible(false)} />;
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
      <StatusBar style="dark" backgroundColor="#dcfce7" translucent={false} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }} />
        <Stack.Screen name="(vendor)" />
        <Stack.Screen name="location" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="shop/[id]" options={{ headerShown: true, title: 'Shop' }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: true, title: 'Product' }} />
        <Stack.Screen name="wishlist" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-notifications" options={{ headerShown: true, title: 'Notifications', headerBackTitle: '' }} />
        <Stack.Screen name="wallet" options={{ headerShown: false }} />
        <Stack.Screen name="support" options={{ headerShown: false }} />
        <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: 'Order' }} />
        <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
      </Stack>
    </NavigationGuard>
  );
}

function GlobalAuthOverlay() {
  const { showLoginModal } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  if (!showLoginModal) return null;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      <LoginScreen isModalComponent={true} onClose={() => dispatch(setShowLoginModal(false))} />
    </View>
  );
}

function GlobalLocationOverlay() {
  const { showLocationModal } = useAppSelector((s) => s.location);
  const dispatch = useAppDispatch();
  if (!showLocationModal) return null;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}>
      <LocationScreen isModalComponent={true} onClose={() => dispatch(setShowLocationModal(false))} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });
  const [updateInfo, setUpdateInfo] = useState<{ playStoreUrl: string } | null>(null);

  useEffect(() => {
    const currentVersion = Constants.expoConfig?.version ?? '0.1.0';
    customerApi.fetchAppVersion().then(({ minVersion, playStoreUrl }) => {
      if (isOutdated(currentVersion, minVersion)) {
        setUpdateInfo({ playStoreUrl });
      }
    }).catch(() => {}); // Fail silently — don't block app on network error
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  if (updateInfo) {
    return <ForceUpdateScreen playStoreUrl={updateInfo.playStoreUrl} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <SafeAreaProvider>
          <GlobalLocationOverlay />
          <GlobalAuthOverlay />
          <RootNavigator />
          <Toast />
        </SafeAreaProvider>
      </Provider>
    </QueryClientProvider>
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
