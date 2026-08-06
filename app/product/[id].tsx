import React, { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { cartApi, customerApi, productApi } from '@/api';
import { colors, spacing, fonts } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setItemCount } from '@/store/cartSlice';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.92;
const HALF = (SCREEN_WIDTH - 3) / 2;

// ── Rating labels (Meesho style) ───────────────────────────────────────────
const RATING_LABELS: Record<number, string> = {
  5: 'Very Good',
  4: 'Good',
  3: 'Ok-Ok',
  2: 'Bad',
  1: 'Very Bad',
};
const BAR_COLORS: Record<number, string> = {
  5: '#2e7d32',
  4: '#66bb6a',
  3: '#ffa726',
  2: '#ef5350',
  1: '#b71c1c',
};

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const cartCount = useAppSelector((s) => s.cart.itemCount);
  const user = useAppSelector((s) => s.auth.user);
  const { appSettings } = useAppSelector((s) => s.config);
  const role = user?.role || 'GUEST';
  const canAddToCart = appSettings?.roles[role]?.features?.canAddToCart ?? false;

  const [activeImg, setActiveImg] = useState(0);
  const [showMoreHighlights, setShowMoreHighlights] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.fetchProduct(id!),
    enabled: !!id,
  });

  const { data: similarData } = useQuery({
    queryKey: ['products', 'similar', product?.category?.id],
    queryFn: () => productApi.fetchProducts({ categoryId: product?.category?.id, limit: 12 }),
    enabled: !!product?.category?.id,
  });
  const similarProducts = (similarData?.products ?? []).filter((p) => p.id !== id);

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: customerApi.fetchWishlist,
    enabled: role === 'CUSTOMER',
  });
  const isWishlisted = wishlist.some((w: any) => w.product?.id === id || w.productId === id);

  const toggleWishlist = useMutation({
    mutationFn: () =>
      isWishlisted ? customerApi.removeFromWishlist(id!) : customerApi.addToWishlist(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
    onError: (e) => Toast.show({ type: 'error', text1: 'Wishlist error', text2: e instanceof Error ? e.message : 'Failed' }),
  });

  const addMutation = useMutation({
    mutationFn: (vars?: { isBuyNow?: boolean }) => cartApi.addToCart(id!, 1),
    onSuccess: async (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const cart = await cartApi.fetchCart();
      dispatch(setItemCount(cart.items.reduce((s, i) => s + i.quantity, 0)));
      if (vars?.isBuyNow) {
        router.push('/(tabs)/cart');
      } else {
        Toast.show({ type: 'success', text1: 'Added to cart!', text2: 'Item added successfully' });
      }
    },
    onError: (e) => Toast.show({ type: 'error', text1: 'Error', text2: e instanceof Error ? e.message : 'Could not add to cart' }),
  });

  const handleShare = useCallback(async () => {
    try { await Share.share({ message: `${product?.name} — Rs.${product?.sellingPrice}` }); } catch {}
  }, [product]);

  // ── States ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (error || !product) {
    return (
      <View style={s.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#e11d48" />
        <Text style={s.errorText}>{error instanceof Error ? error.message : 'Product not found'}</Text>
        <TouchableOpacity style={s.goBackBtn} onPress={() => router.back()}>
          <Text style={s.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const images = product.images ?? [];
  const price = Number(product.sellingPrice);
  const mrp = product.mrp ? Number(product.mrp) : null;
  const stock = product.inventory?.stock ?? 0;
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;
  const reviews = product.reviews ?? [];
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? reviews.reduce((a: number, r: any) => a + r.rating, 0) / reviewCount
    : 0;

  // Parse tags as "highlights" key-value pairs
  const rawTags: string[] = product.tags
    ? typeof product.tags === 'string'
      ? product.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : Array.isArray(product.tags) ? (product.tags as string[]).map(String) : []
    : [];

  // Build highlight pairs from tags (try key:value format, else show as single)
  const highlights: { key: string; val: string }[] = rawTags.map((t) => {
    const idx = t.indexOf(':');
    if (idx > -1) return { key: t.slice(0, idx).trim(), val: t.slice(idx + 1).trim() };
    return { key: t, val: '' };
  });

  const visibleHighlights = showMoreHighlights ? highlights : highlights.slice(0, 4);

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#fff' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={s.hBtn}>
              <Ionicons name="arrow-back" size={22} color="#222" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 4 }}>
              <TouchableOpacity style={s.hBtn}>
                <Ionicons name="search-outline" size={22} color="#222" />
              </TouchableOpacity>
              <TouchableOpacity style={s.hBtn} onPress={() => router.push('/(tabs)/cart')}>
                <Ionicons name="cart-outline" size={22} color="#222" />
                {cartCount > 0 && (
                  <View style={s.cartBadge}>
                    <Text style={s.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>

        {/* ── Image Carousel ── */}
        <View style={{ backgroundColor: '#f8f8f8', position: 'relative' }}>
          <FlatList
            data={images.length > 0 ? images : [{ id: 'ph', url: '' }]}
            keyExtractor={(item: any, i) => item.id ?? String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              if (idx !== activeImg && idx >= 0) setActiveImg(idx);
            }}
            renderItem={({ item }: { item: any }) =>
              item.url ? (
                <Image source={{ uri: item.url }} style={s.prodImg} resizeMode="contain" />
              ) : (
                <View style={[s.prodImg, s.imgPh]}>
                  <Ionicons name="image-outline" size={56} color="#ccc" />
                </View>
              )
            }
          />
          {/* Dot + counter row */}
          <View style={s.imgFooter}>
            <View style={s.dotsRow}>
              {(images.length > 1 ? images : [{}]).map((_: any, i: number) => (
                <View key={i} style={[s.dot, activeImg === i && s.dotActive]} />
              ))}
            </View>
            {images.length > 1 && (
              <TouchableOpacity style={s.addImgBtn}>
                <Ionicons name="add" size={14} color="#555" />
                <Text style={s.addImgText}>{activeImg + 1}/{images.length}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Product Title + Wishlist + Share ── */}
        <View style={s.titleBlock}>
          <View style={{ flex: 1 }}>
            {product.brand ? (
              <Text style={s.brandInline}>{product.brand} </Text>
            ) : null}
            <Text style={s.prodTitle}>
              {product.brand ? (
                <Text style={s.brandInline}>{product.brand} </Text>
              ) : null}
              {product.name}
            </Text>
          </View>
          <View style={s.titleActions}>
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => {
                if (role !== 'CUSTOMER') { router.push('/(auth)/login'); return; }
                toggleWishlist.mutate();
              }}
            >
              <Ionicons name={isWishlisted ? 'heart' : 'heart-outline'} size={22} color={isWishlisted ? '#e11d48' : '#555'} />
              <Text style={s.actionLabel}>Wishlist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={22} color="#555" />
              <Text style={s.actionLabel}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Price Row ── */}
        <View style={s.priceBlock}>
          <View style={s.priceRow}>
            <Text style={s.price}>Rs.{price.toFixed(0)}</Text>
            {mrp && mrp > price ? (
              <Text style={s.mrp}>{mrp.toFixed(0)}</Text>
            ) : null}
            {discount ? (
              <Text style={s.discPct}>{discount}% off</Text>
            ) : null}
          </View>
          {mrp && mrp > price ? (
            <Text style={s.savingsLine}>You save Rs.{(mrp - price).toFixed(0)}</Text>
          ) : null}
        </View>

        {/* ── Rating Pill ── */}
        {reviewCount > 0 && (
          <View style={s.ratingPillRow}>
            <View style={s.ratingPill}>
              <Text style={s.ratingPillVal}>{avgRating.toFixed(1)}</Text>
              <Ionicons name="star" size={12} color="#fff" />
            </View>
            <Text style={s.ratingPillCount}>({reviewCount.toLocaleString()})</Text>
          </View>
        )}

        <View style={s.divider} />

        {/* ── Pack Size / Unit chips ── */}
        {(product.weight || product.unit) ? (
          <>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Select Size</Text>
              <View style={s.chipsRow}>
                <View style={[s.sizeChip, s.sizeChipActive]}>
                  <Text style={s.sizeChipTextActive}>
                    {product.weight ? `${product.weight}${product.unit}` : product.unit}
                  </Text>
                </View>
              </View>
            </View>
            <View style={s.divider} />
          </>
        ) : null}

        {/* ── Sold by ── */}
        <Pressable style={s.soldByRow} onPress={() => product.vendor?.id && router.push(`/shop/${product.vendor.id}` as any)}>
          <View style={s.soldByIconWrap}>
            <Ionicons name="storefront" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.soldByLabel}>Sold by</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.soldByName}>{product.vendor?.shopName || 'Unknown Store'}</Text>
              {reviewCount > 0 && (
                <View style={s.shopRatingPill}>
                  <Text style={s.shopRatingText}>{avgRating.toFixed(1)}</Text>
                  <Ionicons name="star" size={10} color="#fff" />
                </View>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </Pressable>

        <View style={s.divider} />

        {/* ── Stock Status ── */}
        <View style={[s.section, { paddingVertical: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[s.stockDot, { backgroundColor: stock > 0 ? '#16a34a' : '#ef4444' }]} />
            <Text style={[s.stockText, { color: stock > 0 ? '#16a34a' : '#ef4444' }]}>
              {stock > 20 ? 'In Stock' : stock > 0 ? `Only ${stock} left — order soon!` : 'Out of Stock'}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Product Description ── */}
        {product.description ? (
          <>
            <View style={s.section}>
              <Text style={s.sectionTitle}>About this product</Text>
              <Text style={s.descText}>{product.description}</Text>
            </View>
            <View style={s.divider} />
          </>
        ) : null}

        {/* ── Product Highlights (Meesho key-value grid) ── */}
        {highlights.length > 0 && (
          <>
            <View style={s.section}>
              <View style={s.highlightsHeader}>
                <Text style={s.sectionTitle}>Product Highlights</Text>
                <TouchableOpacity>
                  <Text style={s.copyBtn}>COPY</Text>
                </TouchableOpacity>
              </View>
              <View style={s.highlightsGrid}>
                {visibleHighlights.map((h, i) => (
                  <View key={i} style={s.highlightCell}>
                    <Text style={s.hlKey}>{h.key}</Text>
                    {h.val ? <Text style={s.hlVal}>{h.val}</Text> : null}
                  </View>
                ))}
              </View>
              {highlights.length > 4 && (
                <TouchableOpacity onPress={() => setShowMoreHighlights(!showMoreHighlights)} style={s.additionalRow}>
                  <Text style={s.additionalText}>Additional Details</Text>
                  <Ionicons name={showMoreHighlights ? 'chevron-up' : 'chevron-down'} size={16} color="#555" />
                </TouchableOpacity>
              )}
            </View>
            <View style={s.divider} />
          </>
        )}

        {/* ── Customer Ratings & Reviews ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Customer Ratings &amp; Reviews</Text>

          {reviewCount > 0 ? (
            <>
              {/* Summary row */}
              <View style={s.reviewSummary}>
                <View style={s.bigRatingBox}>
                  <Text style={s.bigRatingNum}>{avgRating.toFixed(1)}</Text>
                  <Ionicons name="star" size={20} color="#fff" />
                  <Text style={s.bigRatingCount}>{reviewCount.toLocaleString()} ratings</Text>
                  <Text style={s.bigRatingReviews}>{reviewCount} reviews</Text>
                </View>
                <View style={s.barsWrap}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const cnt = reviews.filter((r: any) => Math.round(r.rating) === star).length;
                    const pct = reviewCount > 0 ? (cnt / reviewCount) * 100 : 0;
                    return (
                      <View key={star} style={s.barRow}>
                        <Text style={s.barLabel}>{RATING_LABELS[star]}</Text>
                        <View style={s.barTrack}>
                          <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: BAR_COLORS[star] }]} />
                        </View>
                        <Text style={s.barCount}>{cnt}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Review Cards */}
              {reviews.slice(0, 3).map((review: any, i: number) => (
                <View key={i} style={s.reviewCard}>
                  <View style={s.reviewCardTop}>
                    <View style={[s.reviewRatingChip, { backgroundColor: BAR_COLORS[Math.round(review.rating)] ?? '#666' }]}>
                      <Text style={s.reviewRatingNum}>{review.rating}</Text>
                      <Ionicons name="star" size={10} color="#fff" />
                    </View>
                    <Text style={[s.reviewLabel, { color: BAR_COLORS[Math.round(review.rating)] ?? '#666' }]}>
                      {RATING_LABELS[Math.round(review.rating)] ?? 'Rated'}
                    </Text>
                    {review.createdAt ? (
                      <>
                        <View style={s.reviewDot} />
                        <Text style={s.reviewDate}>
                          Posted on {new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                      </>
                    ) : null}
                  </View>
                  {review.comment ? (
                    <Text style={s.reviewComment}>{review.comment}</Text>
                  ) : null}
                  <Text style={s.reviewerName}>
                    -{review.user?.name || review.userName || 'Customer'}
                  </Text>
                  <TouchableOpacity style={s.helpfulRow}>
                    <Ionicons name="thumbs-up-outline" size={14} color="#666" />
                    <Text style={s.helpfulText}>Helpful</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {reviewCount > 3 && (
                <TouchableOpacity style={s.viewAllRow}>
                  <Text style={s.viewAllText}>VIEW ALL REVIEWS</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={s.noReviews}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color="#d1d5db" />
              <Text style={s.noReviewsTitle}>No reviews yet</Text>
              <Text style={s.noReviewsSub}>Be the first to review!</Text>
            </View>
          )}
        </View>

        <View style={s.divider} />

        {/* ── Trust Badges (Meesho style: horizontal 3-col) ── */}
        <View style={s.trustRow}>
          {[
            { icon: 'pricetag-outline', label: 'Lowest Price' },
            { icon: 'cash-outline', label: 'Cash on Delivery' },
            { icon: 'refresh-outline', label: '7-day Returns' },
          ].map((b, i) => (
            <React.Fragment key={i}>
              <View style={s.trustItem}>
                <Ionicons name={b.icon as any} size={22} color={colors.primary} />
                <Text style={s.trustLabel}>{b.label}</Text>
              </View>
              {i < 2 && <View style={s.trustDivider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={s.divider} />

        {/* ── People Also Viewed (2-column grid) ── */}
        {similarProducts.length > 0 && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }]}>
              People Also Viewed
            </Text>
            <View style={s.grid}>
              {similarProducts.map((rp) => {
                const rpPrice = Number(rp.sellingPrice);
                const rpMrp = rp.mrp ? Number(rp.mrp) : null;
                const rpDisc = rpMrp && rpMrp > rpPrice ? Math.round(((rpMrp - rpPrice) / rpMrp) * 100) : null;
                const rpRating = rp.reviews && rp.reviews.length > 0
                  ? (rp.reviews.reduce((a: number, r: any) => a + r.rating, 0) / rp.reviews.length).toFixed(1)
                  : null;
                return (
                  <Pressable key={rp.id} style={s.gridCard} onPress={() => router.push(`/product/${rp.id}`)}>
                    {/* Wishlist heart on card */}
                    <TouchableOpacity style={s.gridHeart}>
                      <Ionicons name="heart-outline" size={18} color="#aaa" />
                    </TouchableOpacity>
                    {rp.images?.[0]?.url ? (
                      <Image source={{ uri: rp.images[0].url }} style={s.gridImg} resizeMode="cover" />
                    ) : (
                      <View style={[s.gridImg, s.imgPh]}>
                        <Ionicons name="image-outline" size={32} color="#ccc" />
                      </View>
                    )}
                    <View style={s.gridInfo}>
                      {rp.vendor?.shopName ? (
                        <Text style={s.gridShop} numberOfLines={1}>{rp.vendor.shopName}</Text>
                      ) : null}
                      <Text style={s.gridName} numberOfLines={2}>{rp.name}</Text>
                      <View style={s.gridPriceRow}>
                        <Text style={s.gridPrice}>Rs.{rpPrice.toFixed(0)}</Text>
                        {rpMrp && rpMrp > rpPrice ? (
                          <Text style={s.gridMrp}>{rpMrp.toFixed(0)}</Text>
                        ) : null}
                        {rpDisc ? (
                          <Text style={s.gridDisc}>{rpDisc}% off</Text>
                        ) : null}
                      </View>
                      {rpRating ? (
                        <View style={s.gridRatingRow}>
                          <View style={s.gridRatingPill}>
                            <Text style={s.gridRatingVal}>{rpRating}</Text>
                            <Ionicons name="star" size={9} color="#fff" />
                          </View>
                          {rp.reviews?.length ? (
                            <Text style={s.gridRatingCnt}>({rp.reviews.length})</Text>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Sticky Bottom Bar ── */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom + 2, 10) }]}>
        {canAddToCart ? (
          <>
            <TouchableOpacity
              style={[s.addBtn, (stock <= 0 || addMutation.isPending) && s.disabledBtn]}
              disabled={stock <= 0 || addMutation.isPending}
              onPress={() => addMutation.mutate({})}
              activeOpacity={0.85}
            >
              {addMutation.isPending && !addMutation.variables?.isBuyNow ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={18} color={colors.primary} />
                  <Text style={s.addBtnText}>{stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.buyBtn, (stock <= 0 || addMutation.isPending) && s.disabledBtn]}
              disabled={stock <= 0 || addMutation.isPending}
              onPress={() => addMutation.mutate({ isBuyNow: true })}
              activeOpacity={0.85}
            >
              {addMutation.isPending && addMutation.variables?.isBuyNow ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="chevrons-right" size={18} color="#fff" />
                  <Text style={s.buyBtnText}>{stock <= 0 ? 'Unavailable' : 'Buy Now'}</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.88}>
            <Ionicons name="log-in-outline" size={18} color="#fff" />
            <Text style={s.loginBtnText}>Login to Buy</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { color: '#e11d48', fontSize: 15, textAlign: 'center', fontFamily: fonts.medium },
  goBackBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  goBackText: { color: '#fff', fontFamily: fonts.bold },

  // ── Header ────────────────────────────────────────────────────────────────
  hBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  cartBadge: {
    position: 'absolute', top: 2, right: 2, backgroundColor: '#e11d48',
    minWidth: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontFamily: fonts.bold },

  // ── Images ────────────────────────────────────────────────────────────────
  prodImg: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT, backgroundColor: '#f5f5f5' },
  imgPh: { alignItems: 'center', justifyContent: 'center' },
  imgFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  dotsRow: { flexDirection: 'row', gap: 5, flex: 1, justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ddd' },
  dotActive: { backgroundColor: colors.primary, width: 16 },
  addImgBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  addImgText: { fontSize: 11, color: '#555', fontFamily: fonts.regular },

  // ── Title block ───────────────────────────────────────────────────────────
  titleBlock: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  brandInline: { fontSize: 14, fontFamily: fonts.bold, color: '#888' },
  prodTitle: { fontSize: 14, fontFamily: fonts.regular, color: '#222', lineHeight: 20, flex: 1 },
  titleActions: { flexDirection: 'row', gap: 16, marginLeft: 8 },
  actionBtn: { alignItems: 'center', gap: 2 },
  actionLabel: { fontSize: 10, color: '#555', fontFamily: fonts.regular },

  // ── Price ────────────────────────────────────────────────────────────────
  priceBlock: { paddingHorizontal: 14, paddingBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  price: { fontSize: 22, fontFamily: fonts.bold, color: '#111' },
  mrp: { fontSize: 14, color: '#9ca3af', textDecorationLine: 'line-through', fontFamily: fonts.regular },
  discPct: { fontSize: 13, color: '#e65100', fontFamily: fonts.bold },
  savingsLine: { fontSize: 12, color: '#16a34a', fontFamily: fonts.medium, marginTop: 2 },

  // ── Rating Pill ───────────────────────────────────────────────────────────
  ratingPillRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10, gap: 6 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#388e3c', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  ratingPillVal: { fontSize: 13, fontFamily: fonts.bold, color: '#fff' },
  ratingPillCount: { fontSize: 12, color: '#555', fontFamily: fonts.regular },

  // ── Common ────────────────────────────────────────────────────────────────
  divider: { height: 6, backgroundColor: '#f3f4f6' },
  section: { paddingHorizontal: 14, paddingVertical: 14 },
  sectionTitle: { fontSize: 15, fontFamily: fonts.bold, color: '#111', marginBottom: 10 },

  // ── Pack/Size chips ───────────────────────────────────────────────────────
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeChip: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  sizeChipActive: { borderColor: '#333', backgroundColor: '#fff' },
  sizeChipTextActive: { fontSize: 13, fontFamily: fonts.bold, color: '#111' },

  // ── Sold by ───────────────────────────────────────────────────────────────
  soldByRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#fff' },
  soldByIconWrap: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  soldByLabel: { fontSize: 11, color: '#888', fontFamily: fonts.regular },
  soldByName: { fontSize: 14, fontFamily: fonts.bold, color: '#111' },
  shopRatingPill: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#388e3c', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  shopRatingText: { fontSize: 11, fontFamily: fonts.bold, color: '#fff' },

  // ── Stock ────────────────────────────────────────────────────────────────
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 13, fontFamily: fonts.medium },

  // ── Description ───────────────────────────────────────────────────────────
  descText: { fontSize: 13, color: '#444', lineHeight: 21, fontFamily: fonts.regular },

  // ── Highlights ────────────────────────────────────────────────────────────
  highlightsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  copyBtn: { fontSize: 13, fontFamily: fonts.bold, color: colors.primary, letterSpacing: 0.5 },
  highlightsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  highlightCell: { width: '50%', paddingBottom: 12, paddingRight: 8 },
  hlKey: { fontSize: 11, color: '#888', fontFamily: fonts.regular, marginBottom: 2 },
  hlVal: { fontSize: 13, color: '#111', fontFamily: fonts.medium },
  additionalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  additionalText: { fontSize: 14, fontFamily: fonts.medium, color: '#333' },

  // ── Reviews ──────────────────────────────────────────────────────────────
  reviewSummary: { flexDirection: 'row', gap: 16, marginBottom: 18, alignItems: 'flex-start' },
  bigRatingBox: { backgroundColor: '#2e7d32', borderRadius: 12, padding: 14, alignItems: 'center', minWidth: 96, gap: 2 },
  bigRatingNum: { fontSize: 34, fontFamily: fonts.bold, color: '#fff', lineHeight: 38 },
  bigRatingCount: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontFamily: fonts.regular, marginTop: 4 },
  bigRatingReviews: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: fonts.regular },
  barsWrap: { flex: 1, gap: 7, justifyContent: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 68, fontSize: 11, color: '#555', fontFamily: fonts.regular },
  barTrack: { flex: 1, height: 5, backgroundColor: '#e5e7eb', borderRadius: 3 },
  barFill: { height: '100%', borderRadius: 3 },
  barCount: { width: 28, fontSize: 11, color: '#888', textAlign: 'right', fontFamily: fonts.regular },

  reviewCard: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 14, marginBottom: 14 },
  reviewCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  reviewRatingChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  reviewRatingNum: { fontSize: 12, fontFamily: fonts.bold, color: '#fff' },
  reviewLabel: { fontSize: 13, fontFamily: fonts.bold },
  reviewDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#ccc' },
  reviewDate: { fontSize: 11, color: '#888', fontFamily: fonts.regular },
  reviewComment: { fontSize: 13, color: '#222', lineHeight: 20, marginBottom: 6, fontFamily: fonts.regular },
  reviewerName: { fontSize: 12, color: '#666', fontFamily: fonts.medium, marginBottom: 6 },
  helpfulRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  helpfulText: { fontSize: 12, color: '#666', fontFamily: fonts.regular },

  viewAllRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  viewAllText: { fontSize: 13, fontFamily: fonts.bold, color: colors.primary, letterSpacing: 0.5 },
  noReviews: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  noReviewsTitle: { fontSize: 15, fontFamily: fonts.bold, color: '#374151' },
  noReviewsSub: { fontSize: 13, color: '#9ca3af', fontFamily: fonts.regular },

  // ── Trust ────────────────────────────────────────────────────────────────
  trustRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  trustItem: { flex: 1, alignItems: 'center', gap: 6 },
  trustLabel: { fontSize: 11, color: '#333', fontFamily: fonts.medium, textAlign: 'center' },
  trustDivider: { width: 1, height: 32, backgroundColor: '#e5e7eb' },

  // ── People Also Viewed (2-col grid) ──────────────────────────────────────
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  gridCard: { width: HALF, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f0f0f0', position: 'relative' },
  gridHeart: { position: 'absolute', top: 8, right: 8, zIndex: 1, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  gridImg: { width: '100%', height: HALF, backgroundColor: '#f8f8f8' },
  gridInfo: { padding: 10 },
  gridShop: { fontSize: 10, color: '#888', fontFamily: fonts.regular, marginBottom: 2 },
  gridName: { fontSize: 13, fontFamily: fonts.regular, color: '#111', lineHeight: 18, marginBottom: 4 },
  gridPriceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 5 },
  gridPrice: { fontSize: 16, fontFamily: fonts.bold, color: '#111' },
  gridMrp: { fontSize: 12, color: '#9ca3af', textDecorationLine: 'line-through' },
  gridDisc: { fontSize: 12, color: '#e65100', fontFamily: fonts.medium },
  gridRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  gridRatingPill: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#388e3c', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  gridRatingVal: { fontSize: 10, fontFamily: fonts.bold, color: '#fff' },
  gridRatingCnt: { fontSize: 10, color: '#888', fontFamily: fonts.regular },

  // ── Bottom Bar ────────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb',
    flexDirection: 'row', paddingHorizontal: 12, paddingTop: 10, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 8,
  },
  addBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 48, borderRadius: 6, borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: '#fff',
  },
  addBtnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.primary },
  buyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 48, borderRadius: 6, backgroundColor: '#9b27af',
  },
  buyBtnText: { fontSize: 14, fontFamily: fonts.bold, color: '#fff' },
  disabledBtn: { opacity: 0.4 },
  loginBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: 6, backgroundColor: colors.primary,
  },
  loginBtnText: { fontSize: 15, fontFamily: fonts.bold, color: '#fff' },
});
