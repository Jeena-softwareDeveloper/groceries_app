import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors , fonts} from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'expo-router';

const FloatingTabIcon = () => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      top: -15, // Floating up
      justifyContent: 'center',
      alignItems: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
      transform: [{ scale }]
    }}>
      <Ionicons name="grid" size={26} color={colors.white} />
    </Animated.View>
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(10, insets.bottom);
  const tabHeight = 64 + paddingBottom;
  const { accessToken } = useAppSelector((s) => s.auth);
  const router = useRouter();

  const handleProtectedTabPress = (e: any) => {
    if (!accessToken) {
      e.preventDefault();
      router.push('/(auth)/login');
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: '#e5e7eb',
          height: tabHeight,
          paddingBottom: paddingBottom,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 12, fontFamily: fonts.medium, marginTop: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ focused }) => <FloatingTabIcon />,
          tabBarLabel: () => null, // Hide label for center button
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: handleProtectedTabPress }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: handleProtectedTabPress }}
      />
    </Tabs>
  );
}
