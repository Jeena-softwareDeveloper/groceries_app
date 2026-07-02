import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { addToCart, addToWishlist, fetchProduct } from '@/api/customer';
import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/constants/theme';
import { useAppDispatch } from '@/store/hooks';
import { setItemCount } from '@/store/cartSlice';
import { fetchCart } from '@/api/customer';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
  });

  const addMutation = useMutation({
    mutationFn: () => addToCart(id!, 1),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const cart = await fetchCart();
      dispatch(setItemCount(cart.items.reduce((s, i) => s + i.quantity, 0)));
      Alert.alert('Added to cart', 'Item added successfully.', [
        { text: 'Continue shopping' },
        { text: 'View cart', onPress: () => router.push('/(tabs)/cart') },
      ]);
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not add to cart'),
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error instanceof Error ? error.message : 'Product not found'}</Text>
      </View>
    );
  }

  const imageUrl = product.images?.[0]?.url;
  const price = Number(product.sellingPrice);
  const mrp = product.mrp ? Number(product.mrp) : null;
  const stock = product.inventory?.stock ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>No image</Text>
        </View>
      )}

      <View style={styles.body}>
        {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
        <Text style={styles.name}>{product.name}</Text>
        {product.vendor?.shopName ? (
          <Text style={styles.vendor}>Sold by {product.vendor.shopName}</Text>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{price.toFixed(0)}</Text>
          {mrp && mrp > price ? (
            <Text style={styles.mrp}>₹{mrp.toFixed(0)}</Text>
          ) : null}
        </View>

        {product.weight ? <Text style={styles.meta}>Weight: {product.weight}</Text> : null}
        <Text style={[styles.stock, stock > 0 ? styles.inStock : styles.outStock]}>
          {stock > 0 ? `${stock} in stock` : 'Out of stock'}
        </Text>

        {product.description ? (
          <Text style={styles.description}>{product.description}</Text>
        ) : null}

        <Button
          title="Add to cart"
          loading={addMutation.isPending}
          disabled={stock <= 0}
          onPress={() => addMutation.mutate()}
          style={{ marginTop: spacing.lg }}
        />
        <Button
          title="Add to wishlist"
          variant="secondary"
          onPress={async () => {
            try {
              await addToWishlist(id!);
              Alert.alert('Wishlist', 'Added to wishlist');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not add');
            }
          }}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  error: { color: colors.error, textAlign: 'center' },
  image: { width: '100%', height: 280, backgroundColor: colors.surface },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.textMuted },
  body: { padding: spacing.lg },
  brand: { fontSize: 13, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: spacing.xs },
  vendor: { fontSize: 14, color: colors.primary, marginTop: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  price: { fontSize: 28, fontWeight: '800', color: colors.primary },
  mrp: { fontSize: 16, color: colors.textMuted, textDecorationLine: 'line-through' },
  meta: { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm },
  stock: { fontSize: 14, fontWeight: '600', marginTop: spacing.sm },
  inStock: { color: colors.primary },
  outStock: { color: colors.error },
  description: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
});
