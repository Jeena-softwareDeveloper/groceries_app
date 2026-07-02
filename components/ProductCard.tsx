import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import type { Product } from '@/types/customer';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
  compact?: boolean;
}

function formatPrice(value: number | string) {
  return `₹${Number(value).toFixed(0)}`;
}

export function ProductCard({ product, onPress, onAddToCart, compact }: ProductCardProps) {
  const imageUrl = product.images?.[0]?.url;
  const mrp = product.mrp ? Number(product.mrp) : null;
  const price = Number(product.sellingPrice);
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;

  return (
    <Pressable style={[styles.card, compact && styles.compact]} onPress={onPress}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
        {discount ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{discount}% off</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
      {product.vendor?.shopName ? (
        <Text style={styles.vendor} numberOfLines={1}>
          {product.vendor.shopName}
        </Text>
      ) : null}
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        {mrp && mrp > price ? <Text style={styles.mrp}>{formatPrice(mrp)}</Text> : null}
      </View>
      {onAddToCart ? (
        <Pressable style={styles.addBtn} onPress={onAddToCart}>
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  compact: { width: '100%', marginRight: 0, marginBottom: spacing.md },
  imageWrap: { position: 'relative', marginBottom: spacing.sm },
  image: { width: '100%', height: 120, borderRadius: radius.md, backgroundColor: colors.surface },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.textMuted, fontSize: 12 },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '600' },
  name: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  vendor: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  price: { fontSize: 15, fontWeight: '700', color: colors.primary },
  mrp: { fontSize: 12, color: colors.textMuted, textDecorationLine: 'line-through' },
  addBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addBtnText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});
