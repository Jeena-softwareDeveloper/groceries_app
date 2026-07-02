import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';

interface HeaderProps {
  title?: string;
  showLocation?: boolean;
  showCart?: boolean;
  showSearch?: boolean;
  showBack?: boolean;
  style?: ViewStyle;
}

export function Header({
  title = 'DistrictMart',
  showLocation = true,
  showCart = true,
  showSearch = true,
  showBack = false,
  style,
}: HeaderProps) {
  const router = useRouter();
  const { districtName, areaName } = useAppSelector((s) => s.location);
  const itemCount = useAppSelector((s) => s.cart.itemCount);

  const locationLabel =
    districtName && areaName ? `${areaName}, ${districtName}` : 'Select location';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        <Text style={[styles.logo, showBack && { flex: 1 }]}>{title}</Text>
        <View style={styles.actions}>
          {showSearch ? (
            <Pressable style={styles.iconBtn} onPress={() => router.push('/(tabs)/search')}>
              <Ionicons name="search-outline" size={22} color={colors.text} />
            </Pressable>
          ) : null}
          {showCart ? (
            <Pressable style={styles.iconBtn} onPress={() => router.push('/(tabs)/cart')}>
              <Ionicons name="cart-outline" size={22} color={colors.text} />
              {itemCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
        </View>
      </View>
      {showLocation && !showBack ? (
        <Pressable style={styles.locationRow} onPress={() => router.push('/location')}>
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  logo: { fontSize: 22, fontWeight: '800', color: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  locationText: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.text },
});
