import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Pressable, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setShowLoginModal } from '@/store/authSlice';
import { useRouter } from 'expo-router';
import { vendorRequestApi } from '@/api/vendor-request.api';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api';
import { persistAuth } from '@/hooks/useBootstrap';
import { setTokens, setUser } from '@/store/authSlice';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useState, useRef } from 'react';

function AnimatedTabItem({
  routeKey, iconName, displayLabel, isFocused, isLoading, onPress,
}: {
  routeKey: string;
  iconName: string;
  displayLabel: string;
  isFocused: boolean;
  isLoading?: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.82,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  }

  const activeColor = colors.primary;
  const inactiveColor = '#94a3b8';
  const iconColor = isLoading || isFocused ? activeColor : inactiveColor;

  return (
    <Pressable
      key={routeKey}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
      disabled={isLoading}
    >
      <Animated.View style={[
        styles.iconWrap,
        isFocused && styles.iconWrapActive,
        { transform: [{ scale }] },
      ]}>
        {isLoading ? (
          <ActivityIndicator size={22} color={activeColor} />
        ) : (
          <Ionicons
            name={iconName as any}
            size={22}
            color={iconColor}
          />
        )}
      </Animated.View>
      <Text style={[styles.tabLabel, { color: iconColor }]}>
        {isLoading ? 'Loading...' : displayLabel}
      </Text>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation, switchingVendor }: BottomTabBarProps & { switchingVendor?: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        if (!['index', 'categories', 'profile'].includes(route.name)) return null;

        const iconName =
          route.name === 'index' ? 'home' :
          route.name === 'categories' ? 'storefront' : 'person';

        const displayLabel =
          route.name === 'index' ? 'Home' :
          route.name === 'categories' ? 'Vendors' : 'Profile';

        const isVendorTab = route.name === 'categories';
        const isLoading = isVendorTab && switchingVendor;

        const onPress = () => {
          if (isLoading) return;
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <AnimatedTabItem
            key={route.key}
            routeKey={route.key}
            iconName={iconName}
            displayLabel={displayLabel}
            isFocused={isFocused}
            isLoading={isLoading}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}


const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 6,
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
    paddingVertical: 4,
    paddingHorizontal: 24,
  },
  iconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: '#f0fdf4', // light green pill background
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    marginTop: 1,
  },
});

export default function TabLayout() {
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

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
    if (isSwitching) return; // block double-tap
    if (!accessToken) {
      dispatch(setShowLoginModal(true));
      return;
    }
    if (vendorRequest?.status === 'APPROVED') {
      setIsSwitching(true);
      try {
        const tokens = await authApi.switchToVendor();
        await persistAuth(tokens.accessToken, tokens.refreshToken);
        dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
        const me = await authApi.getMe();
        dispatch(setUser(me));
        router.replace('/(vendor)');
      } catch {
        router.push('/vendor-request');
      } finally {
        setIsSwitching(false);
      }
      return;
    }
    router.push('/vendor-request');
  };

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} switchingVendor={isSwitching} />}
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
