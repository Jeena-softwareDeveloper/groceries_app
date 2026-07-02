import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/constants/theme';
import type { Shop } from '@/types/customer';

interface ShopCardProps {
  shop: Shop;
  onPress?: () => void;
}

export function ShopCard({ shop, onPress }: ShopCardProps) {
  const banner = shop.bannerUrl ?? shop.logoUrl;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {banner ? (
        <Image source={{ uri: banner }} style={styles.banner} resizeMode="cover" />
      ) : (
        <View style={[styles.banner, styles.bannerPlaceholder]}>
          <Ionicons name="storefront-outline" size={32} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          {shop.logoUrl ? (
            <Image source={{ uri: shop.logoUrl }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <Ionicons name="storefront" size={18} color={colors.primary} />
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {shop.shopName}
            </Text>
            {shop.area?.name ? (
              <Text style={styles.area} numberOfLines={1}>
                {shop.area.name}
              </Text>
            ) : null}
          </View>
          <View style={[styles.status, shop.isOpen === false && styles.closed]}>
            <Text style={styles.statusText}>{shop.isOpen === false ? 'Closed' : 'Open'}</Text>
          </View>
        </View>
        <View style={styles.meta}>
          {shop.rating != null ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={styles.metaText}>{Number(shop.rating).toFixed(1)}</Text>
            </View>
          ) : null}
          {shop.minOrderValue != null ? (
            <Text style={styles.metaText}>Min ₹{Number(shop.minOrderValue)}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  banner: { width: '100%', height: 100, backgroundColor: colors.surface },
  bannerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  logoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  area: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  status: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  closed: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.primaryDark },
  meta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: colors.textMuted },
});
