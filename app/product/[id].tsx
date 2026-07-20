import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cartApi, customerApi, productApi } from '@/api';
import { colors, radius, spacing, fonts, typography } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setItemCount } from '@/store/cartSlice';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector((state) => state.cart.itemCount);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.fetchProduct(id!),
    enabled: !!id,
  });

  const addMutation = useMutation({
    mutationFn: () => cartApi.addToCart(id!, 1),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const cart = await cartApi.fetchCart();
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
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;

  return (
    <View style={styles.mainWrapper}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Product Details',
          headerTitleAlign: 'left',
          headerTitleStyle: { fontFamily: fonts.semiBold, fontSize: 16 },
          headerShadowVisible: false,
          headerRight: () => (
            <View style={styles.headerRight}>
              <Pressable style={styles.headerBtn}>
                <Ionicons name="search-outline" size={20} color="#333" />
              </Pressable>
              <Pressable style={styles.headerBtn} onPress={() => router.push('/(tabs)/cart')}>
                <Ionicons name="cart-outline" size={20} color="#333" />
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount}</Text>
                  </View>
                )}
              </Pressable>
              <Pressable style={styles.headerBtn}>
                <Ionicons name="share-social-outline" size={20} color="#333" />
              </Pressable>
            </View>
          ),
        }} 
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>No image</Text>
            </View>
          )}
          
          {discount && (
            <View style={styles.heroDiscountBadge}>
              <Text style={styles.heroDiscountText}>{discount}% OFF</Text>
            </View>
          )}

          <Pressable style={styles.heroHeartBtn}>
            <Ionicons name="heart-outline" size={20} color="#111" />
          </Pressable>
          
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        <View style={styles.body}>
          {/* Brand & Title */}
          <Text style={styles.brand}>{product.brand || 'GENERIC'}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={styles.vendor}>Sold by {product.vendor?.shopName || 'Vendor'}</Text>
            <Ionicons name="checkmark-circle" size={14} color="#15803d" style={{ marginLeft: 4 }} />
          </View>

          {/* Price & Rating Row */}
          <View style={styles.priceAndRating}>
            <View>
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{price.toFixed(0)}</Text>
                {mrp && mrp > price ? (
                  <Text style={styles.mrp}>₹{mrp.toFixed(0)}</Text>
                ) : null}
                {discount ? (
                  <View style={styles.discountBadgeSmall}>
                    <Text style={styles.discountTextSmall}>{discount}% OFF</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.stockRow}>
                <Ionicons name="checkmark-circle" size={14} color="#15803d" />
                <Text style={styles.stockText}>{stock > 0 ? `${stock} in stock` : 'Out of stock'}</Text>
              </View>
            </View>

            {product.reviews && product.reviews.length > 0 ? (
              <View style={styles.ratingCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="star" size={14} color="#15803d" />
                  <Text style={styles.ratingVal}>
                    {' '}{(product.reviews.reduce((acc: any, r: any) => acc + r.rating, 0) / product.reviews.length).toFixed(1)}
                  </Text>
                </View>
                <Text style={styles.ratingCount}>({product.reviews.length} reviews)</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.divider} />

          {/* Pack Size */}
          <Text style={styles.sectionTitle}>Pack size</Text>
          <View style={styles.packSizes}>
            <View style={[styles.packBtn, styles.packBtnActive]}>
              <Text style={[styles.packBtnText, styles.packBtnTextActive]}>
                {product.weight ? `${product.weight} ${product.unit}` : product.unit || '1 pc'}
              </Text>
            </View>
          </View>

          {/* Product Details */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Product Details</Text>
          <Text style={styles.description}>
            {product.description || 'No description available for this product.'}
          </Text>

          {/* Features from tags */}
          {product.tags ? (
            <View style={styles.featuresGrid}>
              {product.tags.split(',').map((tag, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <View style={styles.featureIconWrap}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#15803d" />
                  </View>
                  <Text style={styles.featureItemText}>{tag.trim()}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Delivery Information */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Delivery Information</Text>
          <View style={styles.deliveryBox}>
            <Ionicons name="bicycle" size={32} color="#15803d" />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.deliveryTitle}>Delivery in 30-40 mins</Text>
              <Text style={styles.deliverySub}>Express delivery to your location</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </View>

          {/* Customer Reviews */}
          {product.reviews && product.reviews.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Customer Reviews</Text>
              <View style={styles.reviewBox}>
                <View style={styles.reviewLeft}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.bigRating}>
                      {(product.reviews.reduce((acc: any, r: any) => acc + r.rating, 0) / product.reviews.length).toFixed(1)}
                    </Text>
                    <Ionicons name="star" size={24} color="#f59e0b" style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={styles.reviewCountSub}>{product.reviews.length} reviews</Text>
                </View>
                
                <View style={styles.reviewBars}>
                  {[5, 4, 3, 2, 1].map((star, i) => {
                    const count = product.reviews!.filter((r: any) => r.rating === star).length;
                    const pct = product.reviews!.length > 0 ? (count / product.reviews!.length) * 100 : 0;
                    return (
                      <View key={star} style={styles.barRow}>
                        <Text style={styles.starText}>{star} <Ionicons name="star" size={10} color="#f59e0b" /></Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.barCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}

        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.qtyBox}>
          <Pressable style={styles.qtyBtn}>
            <Ionicons name="trash-outline" size={16} color="#333" />
          </Pressable>
          <Text style={styles.qtyText}>1</Text>
          <Pressable style={styles.qtyBtn}>
            <Ionicons name="add" size={16} color="#15803d" />
          </Pressable>
        </View>

        <Pressable 
          style={styles.wishlistBtn}
          onPress={async () => {
            try {
              await customerApi.addToWishlist(id!);
              Alert.alert('Wishlist', 'Added to wishlist');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not add');
            }
          }}
        >
          <Ionicons name="heart-outline" size={18} color="#333" />
          <Text style={styles.wishlistBtnText}>Add to Wishlist</Text>
        </Pressable>

        <Pressable 
          style={styles.addToCartBtn}
          disabled={stock <= 0 || addMutation.isPending}
          onPress={() => addMutation.mutate()}
        >
          {addMutation.isPending ? (
             <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={18} color="#fff" />
              <Text style={styles.addToCartBtnText}>Add to Cart</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: colors.white },
  container: { paddingBottom: 100 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  error: { color: colors.error, textAlign: 'center' },
  
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  cartBadge: {
    position: 'absolute', top: -4, right: -4, backgroundColor: '#15803d',
    width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.bold },
  
  imageWrap: { position: 'relative', margin: spacing.md, borderRadius: radius.lg, backgroundColor: '#f8fafc', height: 250 },
  image: { width: '100%', height: '100%', borderRadius: radius.lg },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.textMuted },
  
  heroDiscountBadge: {
    position: 'absolute', top: 12, left: 12, backgroundColor: '#15803d',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
  },
  heroDiscountText: { color: '#fff', fontSize: 11, fontFamily: fonts.bold },
  
  heroHeartBtn: {
    position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  
  dotsRow: { position: 'absolute', bottom: -16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d1d5db' },
  dotActive: { backgroundColor: '#15803d' },
  
  body: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  brand: { fontSize: 10, color: colors.textMuted, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { fontSize: 20, fontFamily: fonts.bold, color: '#111', marginTop: 4 },
  vendor: { fontSize: 12, color: '#15803d', fontFamily: fonts.semiBold },
  
  priceAndRating: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 28, fontFamily: fonts.bold, color: '#15803d' },
  mrp: { fontSize: 16, color: '#9ca3af', textDecorationLine: 'line-through' },
  discountBadgeSmall: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountTextSmall: { color: '#15803d', fontSize: 10, fontFamily: fonts.bold },
  
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  stockText: { fontSize: 12, color: '#4b5563' },
  
  ratingCard: { backgroundColor: '#f0fdf4', padding: 8, borderRadius: 8, alignItems: 'center', minWidth: 80 },
  ratingVal: { fontSize: 14, fontFamily: fonts.bold, color: '#15803d' },
  ratingCount: { fontSize: 10, color: '#4b5563', marginTop: 2 },
  
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: spacing.lg },
  
  sectionTitle: { fontSize: 14, fontFamily: fonts.bold, color: '#111', marginBottom: spacing.sm },
  
  packSizes: { flexDirection: 'row', gap: spacing.sm },
  packBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  packBtnActive: { borderColor: '#15803d', backgroundColor: '#f0fdf4' },
  packBtnText: { fontSize: 13, color: '#4b5563', fontFamily: fonts.medium },
  packBtnTextActive: { color: '#15803d' },
  
  description: { fontSize: 13, color: '#4b5563', lineHeight: 20 },
  
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: spacing.md },
  featureItem: { width: '23%', alignItems: 'center' },
  featureIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  featureItemText: { fontSize: 10, color: '#4b5563', textAlign: 'center', fontFamily: fonts.medium },
  
  deliveryBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: spacing.md, borderRadius: radius.lg },
  deliveryTitle: { fontSize: 13, fontFamily: fonts.bold, color: '#111' },
  deliverySub: { fontSize: 11, color: '#4b5563', marginTop: 2 },
  
  reviewBox: { flexDirection: 'row', marginTop: spacing.sm },
  reviewLeft: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bigRating: { fontSize: 36, fontFamily: fonts.bold, color: '#111' },
  reviewCountSub: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  
  reviewBars: { flex: 2, paddingLeft: spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  starText: { width: 24, fontSize: 11, color: '#6b7280', flexDirection: 'row', alignItems: 'center' },
  barTrack: { flex: 1, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginHorizontal: 8 },
  barFill: { height: '100%', backgroundColor: '#15803d', borderRadius: 2 },
  barCount: { width: 24, fontSize: 10, color: '#6b7280', textAlign: 'right' },
  
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6',
    flexDirection: 'row', padding: spacing.md, alignItems: 'center', gap: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 32 : spacing.md,
  },
  qtyBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, height: 40 },
  qtyBtn: { width: 36, alignItems: 'center', justifyContent: 'center', height: '100%' },
  qtyText: { width: 24, textAlign: 'center', fontSize: 14, fontFamily: fonts.bold, color: '#111' },
  
  wishlistBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#15803d', gap: 6,
  },
  wishlistBtnText: { color: '#111', fontSize: 13, fontFamily: fonts.semiBold },
  
  addToCartBtn: {
    flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 40, borderRadius: 8, backgroundColor: '#15803d', gap: 6,
  },
  addToCartBtnText: { color: '#fff', fontSize: 13, fontFamily: fonts.semiBold },
});
