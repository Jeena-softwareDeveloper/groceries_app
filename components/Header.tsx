import { useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';

interface HeaderProps {
  title?: string;
  showLocation?: boolean;
  showCart?: boolean;
  showSearch?: boolean;
  showBack?: boolean;
  style?: ViewStyle;
  darkIcons?: boolean;
  scrollY?: Animated.Value;
}

export function Header({
  title = 'ATM',
  showLocation = true,
  showCart = true,
  showSearch = true,
  showBack = false,
  style,
  darkIcons = true,
  scrollY,
}: HeaderProps) {
  const router = useRouter();
  const { districtName, areaName } = useAppSelector((s) => s.location);
  const itemCount = useAppSelector((s) => s.cart.itemCount);

  // Micro-animations for Cart and Search
  const cartScale = useRef(new Animated.Value(1)).current;
  const searchScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for Cart icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(cartScale, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(cartScale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Subtle bounce animation for Search icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(searchScale, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(searchScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const locationLabel =
    districtName && areaName ? `${areaName}, ${districtName}` : 'Select delivery location';

  const iconColor = darkIcons ? 'rgba(0,0,0,0.75)' : colors.white;
  const textColor = darkIcons ? '#111827' : colors.white;
  const mutedColor = darkIcons ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
  const searchBg = darkIcons ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.85)';
  const cartBg = darkIcons ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.2)';

  // Animations
  const scrollValue = scrollY || new Animated.Value(0);

  const headerBgColor = scrollValue.interpolate({
    inputRange: [0, 60],
    outputRange: ['rgba(255, 255, 255, 0)', 'rgba(220, 252, 231, 0.98)'], // Light green when sticky
    extrapolate: 'clamp',
  });

  const topRowHeight = scrollValue.interpolate({
    inputRange: [0, 50],
    outputRange: [42, 0],
    extrapolate: 'clamp',
  });

  const topRowOpacity = scrollValue.interpolate({
    inputRange: [0, 30],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const topRowMargin = scrollValue.interpolate({
    inputRange: [0, 50],
    outputRange: [spacing.sm, 0],
    extrapolate: 'clamp',
  });

  const searchMarginRight = scrollValue.interpolate({
    inputRange: [0, 60],
    outputRange: [0, showCart ? 50 : 0],
    extrapolate: 'clamp',
  });

  const locationHeight = scrollValue.interpolate({
    inputRange: [0, 60],
    outputRange: [34, 0],
    extrapolate: 'clamp',
  });

  const locationOpacity = scrollValue.interpolate({
    inputRange: [0, 30],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  const locationMargin = scrollValue.interpolate({
    inputRange: [0, 60],
    outputRange: [spacing.xs, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.container, style, { backgroundColor: headerBgColor }]}>
      {/* Row 1: App name (left) - Animates OUT on scroll */}
      <Animated.View style={[styles.topRow, { height: topRowHeight, opacity: topRowOpacity, marginBottom: topRowMargin, overflow: 'hidden' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {showBack && (
            <Pressable style={[styles.iconBtn, { backgroundColor: cartBg, marginRight: spacing.sm }]} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={iconColor} />
            </Pressable>
          )}
          <BlurView intensity={70} tint="light" style={styles.logoBlurContainer}>
            <Image source={require('@/assets/images/logo.png')} style={{ width: 34, height: 34, resizeMode: 'contain' }} />
            <Text style={styles.logo}>
              <Text style={{ color: '#0f5132' }}>AT</Text>
              <Text style={{ color: '#ea580c' }}>M</Text>
            </Text>
          </BlurView>
        </View>
      </Animated.View>

      {/* Cart (Absolute positioned so it stays when topRow collapses) */}
      <View style={styles.absoluteActions}>
        {showCart ? (
          <Pressable
            style={[styles.iconBtn, { backgroundColor: cartBg }]}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <Animated.View style={{ transform: [{ scale: cartScale }] }}>
              <Ionicons name="cart-outline" size={22} color={iconColor} />
            </Animated.View>
            {itemCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      {/* Row 2: Search bar (full width) */}
      {showSearch ? (
        <Animated.View style={{ marginRight: searchMarginRight }}>
          <Pressable
            style={[styles.searchBar, { backgroundColor: searchBg }]}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Animated.View style={{ transform: [{ scale: searchScale }] }}>
              <Ionicons name="search-outline" size={18} color="rgba(0,0,0,0.4)" />
            </Animated.View>
            <Text style={styles.searchPlaceholder}>Search groceries, products…</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {/* Row 3: Address / Location */}
      {showLocation && !showBack ? (
        <Animated.View style={{ height: locationHeight, opacity: locationOpacity, marginBottom: locationMargin, overflow: 'hidden' }}>
          <Pressable style={styles.locationRow} onPress={() => router.push('/location')}>
            <Ionicons name="location-outline" size={16} color={iconColor} />
            <Text style={[styles.locationText, { color: textColor }]} numberOfLines={1}>
              {locationLabel}
            </Text>
            <Ionicons name="chevron-down" size={14} color={mutedColor} />
          </Pressable>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  absoluteActions: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  logo: {
    fontSize: 22,
    fontFamily: fonts.bold,
    letterSpacing: -0.5,
  },
  logoBlurContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // extra white tint for visibility against green
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.white, fontSize: 9, fontFamily: fonts.bold },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(0,0,0,0.4)',
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // semi-transparent background for blur effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // subtle white border
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
});
