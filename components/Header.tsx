import { useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  title = 'All Time Market',
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
  const topRowHeight = scrollY ? scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [42, 0], // 42 is the iconBtn height
    extrapolate: 'clamp',
  }) : 42;

  const topRowOpacity = scrollY ? scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  }) : 1;

  const topRowMargin = scrollY ? scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [spacing.sm, 0],
    extrapolate: 'clamp',
  }) : spacing.sm;

  const searchMarginRight = scrollY && showCart ? scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 50], // 42 (cart width) + 8 (gap)
    extrapolate: 'clamp',
  }) : 0;

  return (
    <View style={[styles.container, style]}>
      {/* Row 1: App name (left) - Animates OUT on scroll */}
      <Animated.View style={[styles.topRow, { height: topRowHeight, opacity: topRowOpacity, marginBottom: topRowMargin }]}>
        {showBack ? (
          <Pressable style={[styles.iconBtn, { backgroundColor: cartBg }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={iconColor} />
          </Pressable>
        ) : (
          <Text style={[styles.logo, { color: textColor }]}>{title}</Text>
        )}

        {showBack && (
          <Text style={[styles.logo, { flex: 1, marginLeft: spacing.sm, color: textColor }]}>{title}</Text>
        )}
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
        <Pressable style={styles.locationRow} onPress={() => router.push('/location')}>
          <Ionicons name="location-outline" size={16} color={iconColor} />
          <Text style={[styles.locationText, { color: textColor }]} numberOfLines={1}>
            {locationLabel}
          </Text>
          <Ionicons name="chevron-down" size={14} color={mutedColor} />
        </Pressable>
      ) : null}
    </View>
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
    paddingVertical: 14,
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
    paddingVertical: 8,
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
