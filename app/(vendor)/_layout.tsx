import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, fonts } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, Pressable, Text, View, ActivityIndicator } from 'react-native';
import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { authApi } from '@/api';
import { persistAuth } from '@/hooks/useBootstrap';
import { setTokens, setUser } from '@/store/authSlice';
import { showLoader, hideLoader } from '@/store/uiSlice';

function CustomerPortalButton() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { refreshToken } = useAppSelector((s) => s.auth);

  const isSwitchingRef = useRef(false);
  const [isSwitching, setIsSwitching] = useState(false);

  async function handleSwitchToCustomer() {
    if (isSwitchingRef.current) return;
    isSwitchingRef.current = true;
    setIsSwitching(true);
    try {
      const tokens = await authApi.switchToCustomer();
      await persistAuth(tokens.accessToken, tokens.refreshToken);
      dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
      const me = await authApi.getMe();
      // dispatching setUser changes role to CUSTOMER, triggering NavigationGuard's redirect to /(tabs)
      dispatch(setUser(me));
    } catch (e) {
      // fallback — just navigate
      isSwitchingRef.current = false;
      setIsSwitching(false);
      router.replace('/(tabs)');
    }
  }

  return (
    <Pressable onPress={isSwitching ? undefined : handleSwitchToCustomer} style={styles.customerBtn} disabled={isSwitching}>
      {isSwitching ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          <Feather name="arrow-left" size={16} color={colors.primary} />
          <Text style={styles.customerBtnText}>Customer</Text>
        </>
      )}
    </Pressable>
  );
}

export default function VendorTabLayout() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(10, insets.bottom);
  const tabHeight = 64 + paddingBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: tabHeight,
          paddingBottom: paddingBottom,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 12,
          marginTop: 4,
        },
      }}
    >
      {/* Dashboard — keeps its custom header with shop name + bell */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} />,
        }}
      />

      {/* Products */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="box" size={22} color={color} />,
        }}
      />

      {/* Orders */}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="shopping-bag" size={22} color={color} />,
        }}
      />

      {/* Finance */}
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finance',
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="dollar-sign" size={22} color={color} />,
        }}
      />

      {/* More */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="menu" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#111',
  },
  customerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  customerBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
});

