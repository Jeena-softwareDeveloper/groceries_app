import { useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle, Animated, Image } from 'react-native';
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
  showLogo?: boolean;
  customSearchNode?: React.ReactNode;
  style?: ViewStyle;
  darkIcons?: boolean;
  scrollY?: Animated.Value;
}

export function Header({
  title = 'ATM',
  showLocation = false,
  showCart = true,
  showSearch = true,
  showBack = false,
  showLogo = false,
  customSearchNode,
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

  const scrollValue = scrollY || new Animated.Value(0);

  // We only animate opacity now. The translateY of the entire header will be handled by the parent.
  const topRowOpacity = scrollValue.interpolate({
    inputRange: [0, 30],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const hasTopRow = showLogo || showLocation || (!showSearch && showCart) || (showBack && !showSearch) || (showBack && showLogo);

  return (
    <View style={[styles.container, style]}>
      {/* Row 1: Logo & Location (Fades out) */}
      {hasTopRow && (
        <Animated.View style={[styles.topRow, { opacity: topRowOpacity }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {(showBack && (!showSearch || showLogo)) && (
            <Pressable style={[styles.iconBtn, { backgroundColor: cartBg, marginRight: spacing.sm }]} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={iconColor} />
            </Pressable>
          )}
          {showLogo && (
            <View style={styles.logoContainer}>
              <Image source={require('@/assets/images/logo.png')} style={{ width: 68, height: 68, resizeMode: 'contain' }} />
              <View style={{ justifyContent: 'center', marginLeft: -6 }}>
                <Text style={[styles.logoText, { color: '#0f5132' }]}>ALL TIME</Text>
                <Text style={[styles.logoText, { color: '#ea580c' }]}>MARKET</Text>
              </View>
            </View>
          )}
          {!showLogo && title ? (
            <Text style={{ fontSize: 18, fontFamily: fonts.bold, color: textColor, marginLeft: showBack ? 4 : 0 }}>{title}</Text>
          ) : null}
        </View>

        {showLocation && !showBack ? (
          <Pressable style={styles.locationRow} onPress={() => router.push('/location')}>
            <Ionicons name="location-outline" size={16} color={iconColor} />
            <Text style={[styles.locationText, { color: textColor }]} numberOfLines={1}>
              {locationLabel}
            </Text>
            <Ionicons name="chevron-down" size={14} color={mutedColor} />
          </Pressable>
        ) : null}

        {!showSearch && showCart ? (
          <Pressable
            style={[styles.iconBtn, { backgroundColor: cartBg, marginLeft: spacing.sm }]}
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
      </Animated.View>
      )}

      {/* Row 2: Search bar & Cart (Only rendered if showSearch is true) */}
      {showSearch ? (
        <View style={styles.bottomRow}>
          {(showBack && !showLogo) && (
            <Pressable style={[styles.iconBtn, { backgroundColor: cartBg, marginRight: spacing.sm }]} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={iconColor} />
            </Pressable>
          )}
          
          {customSearchNode ? customSearchNode : (
            <Pressable
              style={[styles.searchBar, { backgroundColor: searchBg }]}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Animated.View style={{ transform: [{ scale: searchScale }] }}>
                <Ionicons name="search-outline" size={18} color="rgba(0,0,0,0.4)" />
              </Animated.View>
              <Text style={styles.searchPlaceholder}>Search groceries, products…</Text>
            </Pressable>
          )}

          {showCart ? (
            <Pressable
              style={[styles.iconBtn, { backgroundColor: cartBg, marginLeft: spacing.sm }]}
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: 2,
    paddingBottom: 8, // slight gap at bottom
    backgroundColor: '#dcfce7', // Default light green background for pages without dynamic gradient
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    height: 68,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8, // decreased
    borderRadius: radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    height: 44, // decreased
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
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: radius.md,
    maxWidth: '55%',
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
});
