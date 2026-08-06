import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, fonts } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

export default function VendorTabLayout() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(10, insets.bottom);
  const tabHeight = 64 + paddingBottom;

  return (
    <Tabs
      screenOptions={{
        // Default: no native header (each tab renders its own inline header)
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

      {/* Products — native header: title only */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          headerShown: true,
          headerTitle: 'Products',
          headerTitleStyle: styles.headerTitle,
          headerStyle: styles.headerStyle,
          headerShadowVisible: false,
          tabBarIcon: ({ color }) => <Feather name="box" size={22} color={color} />,
        }}
      />

      {/* Orders — native header: title only */}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          headerShown: true,
          headerTitle: 'Orders',
          headerTitleStyle: styles.headerTitle,
          headerStyle: styles.headerStyle,
          headerShadowVisible: false,
          tabBarIcon: ({ color }) => <Feather name="shopping-bag" size={22} color={color} />,
        }}
      />

      {/* Finance — native header: title only */}
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finance',
          headerShown: true,
          headerTitle: 'Finance',
          headerTitleStyle: styles.headerTitle,
          headerStyle: styles.headerStyle,
          headerShadowVisible: false,
          tabBarIcon: ({ color }) => <Feather name="dollar-sign" size={22} color={color} />,
        }}
      />

      {/* More — native header: title only */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerShown: true,
          headerTitle: 'More',
          headerTitleStyle: styles.headerTitle,
          headerStyle: styles.headerStyle,
          headerShadowVisible: false,
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
});
