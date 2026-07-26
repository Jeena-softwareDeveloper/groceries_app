import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import type { Shop } from '@/types/customer';

interface ShopCardProps {
  shop: Shop;
  onPress?: () => void;
  horizontal?: boolean;
}

export function ShopCard({ shop, onPress, horizontal }: ShopCardProps) {
  // Use logoUrl first (shop logo), then bannerUrl; treat empty strings as falsy
  const banner = shop.logoUrl || shop.bannerUrl || null;

  return (
    <Pressable style={[styles.card, horizontal && styles.horizontalCard]} onPress={onPress}>
      <View style={styles.imageContainer}>
        {banner ? (
          <Image source={{ uri: banner }} style={styles.banner} resizeMode="cover" />
        ) : (
          <View style={[styles.banner, styles.bannerPlaceholder]}>
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>
                {shop.shopName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.shopNameUnder} numberOfLines={1}>{shop.shopName}</Text>
          </View>
        )}
        
        <View style={[styles.statusBadge, shop.isOpen === false && styles.statusClosed]}>
          <Text style={[styles.statusText, shop.isOpen === false && styles.statusTextClosed]}>
            {shop.isOpen === false ? 'Closed' : 'Open'}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {shop.shopName}
        </Text>
        
        <View style={styles.metaRow}>
          {shop.rating != null ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.metaText}>{Number(shop.rating).toFixed(1)}</Text>
            </View>
          ) : null}
          {shop.minOrderValue != null ? (
            <Text style={styles.metaText}>Min ₹{Number(shop.minOrderValue)}</Text>
          ) : null}
        </View>

        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={styles.timeText}>30-40 mins</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  horizontalCard: {
    width: 160,
    marginRight: spacing.md,
    marginBottom: 0,
  },
  imageContainer: {
    position: 'relative',
  },
  banner: { width: '100%', height: 100, backgroundColor: colors.surface },
  bannerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  statusBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusClosed: { backgroundColor: colors.error },
  statusText: { fontSize: 10, fontFamily: fonts.bold, color: colors.white },
  statusTextClosed: { color: colors.white },
  body: { padding: spacing.sm },
  name: { fontSize: 14, fontFamily: fonts.bold, color: colors.text, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: colors.textMuted },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, color: colors.textMuted },
  initialsCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  initialsText: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#fff',
  },
  shopNameUnder: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    maxWidth: 120,
    textAlign: 'center',
  },
});
