import { Tabs } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setShowLoginModal } from '@/store/authSlice';
import { useRouter } from 'expo-router';
import { vendorRequestApi } from '@/api/vendor-request.api';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api';
import { persistAuth } from '@/hooks/useBootstrap';
import { setTokens, setUser } from '@/store/authSlice';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;
        
        // Only render our 3 main tabs
        if (!['index', 'categories', 'profile'].includes(route.name)) return null;

        const iconName = 
          route.name === 'index' ? 'home' : 
          route.name === 'categories' ? 'storefront' : 'person';
        
        const displayLabel = 
          route.name === 'index' ? 'Home' : 
          route.name === 'categories' ? 'Vendors' : 'Profile';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons 
              name={iconName as any} 
              size={22} 
              color={isFocused ? colors.primary : '#94a3b8'} 
            />
            <Text style={[styles.tabLabel, { color: isFocused ? colors.primary : '#94a3b8' }]}>
              {displayLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    justifyContent: 'space-between',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    marginTop: 2,
  },
});

export default function TabLayout() {
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { data: vendorRequest } = useQuery({
    queryKey: ['vendorRequest', user?.id],
    queryFn: vendorRequestApi.getMyRequest,
    enabled: !!accessToken,
    retry: false,
  });

  const handleProtectedTabPress = (e: any) => {
    if (!accessToken) {
      e.preventDefault();
      dispatch(setShowLoginModal(true));
    }
  };

  const handleVendorTabPress = async (e: any) => {
    e.preventDefault();
    if (!accessToken) {
      dispatch(setShowLoginModal(true));
      return;
    }
    if (vendorRequest?.status === 'APPROVED') {
      try {
        const tokens = await authApi.switchToVendor();
        await persistAuth(tokens.accessToken, tokens.refreshToken);
        dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
        const me = await authApi.getMe();
        dispatch(setUser(me));
        router.replace('/(vendor)');
      } catch {
        router.push('/vendor-request');
      }
      return;
    }
    router.push('/vendor-request');
  };

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="categories" options={{ title: 'Vendors' }} listeners={{ tabPress: handleVendorTabPress }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} listeners={{ tabPress: handleProtectedTabPress }} />
      
      {/* Hidden tabs, still accessible via router.push but not shown in tab bar */}
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="cart" options={{ href: null }} />
      <Tabs.Screen name="orders" options={{ href: null }} />
    </Tabs>
  );
}
