import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import type { Product } from '@/types/customer';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
  isAdding?: boolean;
  compact?: boolean;
}

function formatPrice(value: number | string) {
  return `₹${Number(value).toFixed(0)}`;
}

export function ProductCard({ product, onPress, onAddToCart, isAdding, compact }: ProductCardProps) {
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
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.unit} numberOfLines={1}>
        {product.unit || '1 pc'}
      </Text>
      
      <View style={styles.priceContainer}>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        <Text style={styles.mrp}>{mrp && mrp > price ? formatPrice(mrp) : ' '}</Text>
      </View>
      
      <View style={styles.bottomRow}>
        {discount ? (
          <Text style={styles.discountText}>{discount}% OFF</Text>
        ) : <View />}
        {onAddToCart ? (
          <Pressable style={[styles.addBtn, isAdding && { opacity: 0.7 }]} onPress={onAddToCart} disabled={isAdding}>
            {isAdding ? (
              <ActivityIndicator size="small" color="#15803d" />
            ) : (
              <Ionicons name="add" size={16} color="#15803d" />
            )}
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
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
  },
  compact: { width: '100%', marginRight: 0, marginBottom: spacing.md },
  imageWrap: { position: 'relative', marginBottom: 8, width: '100%', height: 90, borderRadius: radius.md, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  placeholderText: { color: colors.textMuted, fontSize: 12 },
  heartBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  name: { fontSize: 12, fontFamily: fonts.semiBold, color: '#333', marginBottom: 2, minHeight: 15, lineHeight: 16 },
  unit: { fontSize: 10, color: colors.textMuted, marginBottom: 8 },
  
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  price: { fontSize: 15, fontFamily: fonts.bold, color: '#111' },
  mrp: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  discountText: { fontSize: 10, fontFamily: fonts.bold, color: '#15803d' },
  addBtn: {
    backgroundColor: '#f0fdf4',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
