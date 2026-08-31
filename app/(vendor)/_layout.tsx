import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, fonts } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, Pressable, Text, View } from 'react-native';
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

  async function handleSwitchToCustomer() {
    dispatch(showLoader());
    try {
      const tokens = await authApi.switchToCustomer();
      await persistAuth(tokens.accessToken, tokens.refreshToken);
      dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
      const me = await authApi.getMe();
      dispatch(setUser(me));
      router.replace('/(tabs)');
    } catch (e) {
      // fallback — just navigate
      router.replace('/(tabs)');
    } finally {
      dispatch(hideLoader());
    }
  }

  return (
    <Pressable onPress={handleSwitchToCustomer} style={styles.customerBtn}>
      <Feather name="arrow-left" size={16} color={colors.primary} />
      <Text style={styles.customerBtnText}>Customer</Text>
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
          headerShown: true,
          headerTitle: 'Products',
          headerTitleStyle: styles.headerTitle,
          headerStyle: styles.headerStyle,
          headerShadowVisible: false,
          headerLeft: () => <CustomerPortalButton />,
          tabBarIcon: ({ color }) => <Feather name="box" size={22} color={color} />,
        }}
      />

      {/* Orders */}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          headerShown: true,
          headerTitle: 'Orders',
          headerTitleStyle: styles.headerTitle,
          headerStyle: styles.headerStyle,
          headerShadowVisible: false,
          headerLeft: () => <CustomerPortalButton />,
          tabBarIcon: ({ color }) => <Feather name="shopping-bag" size={22} color={color} />,
        }}
      />

      {/* Finance */}
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finance',
          headerShown: true,
          headerTitle: 'Finance',
          headerTitleStyle: styles.headerTitle,
          headerStyle: styles.headerStyle,
          headerShadowVisible: false,
          headerLeft: () => <CustomerPortalButton />,
          tabBarIcon: ({ color }) => <Feather name="dollar-sign" size={22} color={color} />,
        }}
      />

      {/* More */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerShown: true,
          headerTitle: 'More',
          headerTitleStyle: styles.headerTitle,
          headerStyle: styles.headerStyle,
          headerShadowVisible: false,
          headerLeft: () => <CustomerPortalButton />,
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

