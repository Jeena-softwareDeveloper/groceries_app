import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fonts } from '@/constants/theme';
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
            <Text style={styles.badgeText}>{discount}% OFF</Text>
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
      
      <View style={styles.bottomRow}>
        <View style={styles.priceCol}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(price)}</Text>
            {mrp && mrp > price ? <Text style={styles.mrp}>{formatPrice(mrp)}</Text> : null}
          </View>
        </View>
        {onAddToCart ? (
          <Pressable style={styles.addBtn} onPress={onAddToCart}>
            <Ionicons name="add" size={18} color={colors.white} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: spacing.sm,
    marginRight: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  compact: { width: '100%', marginRight: 0, marginBottom: spacing.md },
  imageWrap: { position: 'relative', marginBottom: spacing.sm },
  image: { width: '100%', height: 100, borderRadius: radius.md, backgroundColor: colors.surface },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.textMuted, fontSize: 12 },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: { color: colors.white, fontSize: 10, fontFamily: fonts.bold },
  name: { fontSize: 13, fontFamily: fonts.medium, color: colors.text, marginBottom: 2, height: 36 },
  vendor: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.sm },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceCol: { flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  price: { fontSize: 14, fontFamily: fonts.bold, color: colors.primaryDark },
  mrp: { fontSize: 11, color: colors.textMuted, textDecorationLine: 'line-through' },
  addBtn: {
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
