import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { customerApi, cartApi } from '@/api';
import { CategoryCard } from '@/components/CategoryCard';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ShopCard } from '@/components/ShopCard';
import { colors, radius, spacing, fonts, typography } from '@/constants/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setItemCount } from '@/store/cartSlice';

function SectionHeader({ title, onAction }: { title: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onAction ? (
        <Pressable onPress={onAction} style={styles.viewAllRow}>
          <Text style={styles.viewAll}>View all</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { districtId, areaId } = useAppSelector((s) => s.location);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const BANNER_WIDTH = SCREEN_WIDTH - spacing.md * 2; // full width minus horizontal padding
  const BANNER_HEIGHT = Math.round(BANNER_WIDTH * 0.45); // 45% aspect ratio = landscape

  const scrollY = useRef(new Animated.Value(0)).current;

  const { data, isLoading, error } = useQuery({
    queryKey: ['homeFeed', districtId, areaId],
    queryFn: () => customerApi.fetchHomeFeed(districtId!, areaId ?? undefined),
    enabled: !!districtId,
    staleTime: 60 * 1000, // 1 minute
  });

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(130); // tracks actual header height for overlay positioning

  const addToCartMutation = useMutation({
    mutationFn: (productId: string) => cartApi.addToCart(productId, 1),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const cart = await cartApi.fetchCart();
      dispatch(setItemCount(cart.items.reduce((s, i) => s + i.quantity, 0)));
      Alert.alert('Success', 'Item added to cart');
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not add to cart'),
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!data?.banners?.length) return;
    const scrollX = event.nativeEvent.contentOffset.x;
    const itemWidth = BANNER_WIDTH + spacing.sm; // banner width + gap
    const index = Math.round(scrollX / itemWidth);
    const safeIndex = Math.min(Math.max(index, 0), data.banners.length - 1);
    if (safeIndex !== activeBannerIndex) {
      setActiveBannerIndex(safeIndex);
    }
  };

  const activeBanner = data?.banners?.[activeBannerIndex];
  const headerColor = activeBanner?.themeColor || colors.primary;
  const headerColorEnd = activeBanner?.themeColorEnd || headerColor;

  // SafeAreaView bg matches the START color of the gradient
  const safeAreaBg = headerColor;

  // Gradient: solid top → gradual transition to end color → slow fade to transparent near banner bottom
  const headerGradientColors: [string, string, string, string, string] = [
    headerColor,           // solid at top (app name)
    headerColor,           // solid through search bar
    headerColorEnd,        // end color at location row
    headerColorEnd + '44', // 27% opacity — deep into banner, slow fade
    'transparent',         // fully gone near banner bottom
  ] as any;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: safeAreaBg }]} edges={['top']}>
      {/* ═══ STICKY HEADER: solid gradient (no fade) ═══ */}
      <LinearGradient
        colors={[headerColor, headerColorEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <Header darkIcons style={{ backgroundColor: 'transparent' }} scrollY={scrollY} />
      </LinearGradient>

      {isLoading ? (
        <View style={[styles.centered, { backgroundColor: safeAreaBg }]}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error instanceof Error ? error.message : 'Failed to load'}</Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={{ backgroundColor: colors.background, marginTop: -1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false } // We animate layout/height, so useNativeDriver must be false
          )}
          scrollEventThrottle={16}
        >
          {/* ═══ GRADIENT FADE: sits BEHIND the banners, scrolls up with them ═══ */}
          <LinearGradient
            colors={[headerColorEnd, headerColorEnd + '00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: BANNER_HEIGHT * 0.65, // slightly longer fade behind banner
            }}
            pointerEvents="none"
          />

          {/* Banners: normal flow, renders ON TOP of the gradient background */}
          {data?.banners?.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.bannersList}
              contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
              decelerationRate="fast"
              snapToAlignment="start"
              snapToInterval={BANNER_WIDTH + spacing.sm}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {data.banners.map((banner: any) => (
                <View key={banner.id} style={[styles.bannerItem, { width: BANNER_WIDTH, height: BANNER_HEIGHT }]}>
                  <Image source={{ uri: banner.imageUrl }} style={styles.bannerItemImage} />
                </View>
              ))}
            </ScrollView>
          ) : null}

          {/* Categories */}
          {data?.categories?.length ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={[styles.hList, { marginTop: spacing.md }]}
              contentContainerStyle={{ paddingHorizontal: spacing.md }}
            >
              {data.categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  onPress={() => router.push(`/(tabs)/search?q=${encodeURIComponent(cat.name)}`)}
                />
              ))}
            </ScrollView>
          ) : null}

          {/* Free Delivery Banner */}
          {data?.deliveryRule?.freeAbove || data?.layout?.freeDelivery ? (
            <View style={[styles.freeDeliveryBanner, { padding: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: '#e6f4ea', borderColor: '#dcfce7', marginHorizontal: spacing.md, marginTop: spacing.md }]}>
              {/* Icon Left */}
              <View style={{ marginRight: spacing.sm }}>
                {data?.deliveryRule?.bannerIcon?.includes('.json') ? (
                  <LottieView
                    source={{ uri: data.deliveryRule.bannerIcon }}
                    autoPlay loop style={{ width: 48, height: 48 }}
                  />
                ) : (
                  <Ionicons name="bicycle" size={40} color={colors.primary} />
                )}
              </View>

              {/* Text Center */}
              <View style={styles.freeDeliveryContent}>
                <Text style={[styles.freeDeliveryTitle, { color: '#166534', fontSize: 13 }]}>
                  {data?.deliveryRule?.bannerTitle || data?.layout?.freeDelivery?.title || 'FREE DELIVERY'}
                </Text>
                <Text style={[styles.freeDeliverySub, { color: '#166534', fontSize: 11 }]}>
                  {data?.deliveryRule?.bannerSubtitle || data?.layout?.freeDelivery?.subtitle || `On all orders above ₹199`}
                </Text>
              </View>

              {/* Arrow Right */}
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-forward" size={16} color="#166534" />
              </View>
            </View>
          ) : null}

          {/* Best Sellers (Products) */}
          {data?.trendingProducts?.length ? (
            <>
              <SectionHeader title="Best Sellers" onAction={() => {}} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hList} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
                {data.trendingProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onPress={() => router.push(`/product/${p.id}`)}
                    onAddToCart={() => addToCartMutation.mutate(p.id)}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}

          {/* Bulk Orders Banner */}
          {data?.layout?.bulkOrders ? (
            <View style={styles.bulkBanner}>
              <View style={styles.bulkContent}>
                <Text style={styles.bulkTitle}>{data.layout.bulkOrders.title}</Text>
                <Text style={styles.bulkSub}>{data.layout.bulkOrders.subtitle}</Text>
                <Pressable style={styles.bulkBtn}>
                  <Text style={styles.bulkBtnText}>{data.layout.bulkOrders.buttonText || 'Order Now'}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primaryDark} />
                </Pressable>
              </View>
              <Ionicons name="cube" size={64} color="#bbf7d0" style={styles.bulkIcon} />
            </View>
          ) : null}

          {/* Top Sellers (Shops) */}
          {data?.nearbyShops?.length ? (
            <>
              <SectionHeader title="Top Sellers" onAction={() => {}} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hList} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
                {data.nearbyShops.map((shop) => (
                  <ShopCard
                    key={shop.id}
                    shop={shop}
                    horizontal={true}
                    onPress={() => router.push(`/shop/${shop.id}`)}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}

          {/* Features Row */}
          {data?.layout?.features && data.layout.features.length > 0 ? (
            <View style={styles.featuresRow}>
              {data.layout.features.map((feature: any, index: number) => (
                <View key={index} style={{ flexDirection: 'row', flex: 1 }}>
                  <View style={styles.featureItem}>
                    <Ionicons name={feature.icon as any} size={20} color={colors.primary} />
                    <Text style={styles.featureItemText}>{feature.text}</Text>
                  </View>
                  {index < (data.layout!.features!.length - 1) ? (
                    <View style={styles.featureDivider} />
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {/* All Products Grid */}
          {data?.recentlyAdded?.length ? (
            <>
              <SectionHeader title="All Products" onAction={() => {}} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, justifyContent: 'space-between' }}>
                {data.recentlyAdded.map((p) => (
                  <View key={p.id} style={{ width: '48%', marginBottom: spacing.md }}>
                    <ProductCard
                      product={p}
                      compact={true}
                      onPress={() => router.push(`/product/${p.id}`)}
                      onAddToCart={() => addToCartMutation.mutate(p.id)}
                    />
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Why Shop With Us? */}
          {data?.layout?.whyShopWithUs && data.layout.whyShopWithUs.length > 0 ? (
            <>
              <SectionHeader title="Why Shop With Us?" />
              <View style={styles.whyList}>
                {data.layout.whyShopWithUs.map((item: any, index: number) => (
                  <View key={index} style={styles.whyItem}>
                    <View style={styles.whyIcon}><Ionicons name={item.icon as any} size={20} color={colors.primary} /></View>
                    <View style={styles.whyTextCol}>
                      <Text style={styles.whyTitle}>{item.title}</Text>
                      <Text style={styles.whySub}>{item.subtitle}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Refer & Earn */}
          {data?.layout?.referEarn ? (
            <View style={styles.referBanner}>
              <View style={styles.referContent}>
                <Text style={styles.referTitle}>{data.layout.referEarn.title}</Text>
                <Text style={styles.referSub}>{data.layout.referEarn.subtitle}</Text>
                <Pressable style={styles.referBtn}>
                  <Text style={styles.referBtnText}>{data.layout.referEarn.buttonText || 'Refer Now'}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </Pressable>
              </View>
              <Ionicons name="gift-outline" size={64} color="#ef4444" style={styles.referIcon} />
            </View>
          ) : null}

          {/* Popular Searches */}
          {data?.layout?.popularSearches && data.layout.popularSearches.length > 0 ? (
            <>
              <SectionHeader title="Popular Searches" />
              <View style={styles.pillsRow}>
                {data.layout.popularSearches.map((pill: string) => (
                  <Pressable key={pill} style={styles.pill}>
                    <Text style={styles.pillText}>{pill}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {/* Desktop/Expanded Footer */}
          {data?.layout?.footer ? (
            <View style={styles.footer}>
              <View style={styles.footerHero}>
                <Text style={styles.footerTitle}>{data.layout.footer.title}</Text>
                <Text style={styles.footerSub}>{data.layout.footer.subtitle}</Text>
              </View>
              {data.layout.footer.stats ? (
                <View style={styles.footerStatsRow}>
                  {data.layout.footer.stats.map((stat: any, index: number) => (
                    <View key={index} style={styles.footerStat}>
                      <Ionicons name={stat.icon as any} size={24} color={colors.primary} />
                      <View>
                        <Text style={styles.footerStatNum}>{stat.number}</Text>
                        <Text style={styles.footerStatLabel}>{stat.label}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
              {data.layout.footer.download ? (
                <View style={styles.downloadBox}>
                  <View style={styles.downloadContent}>
                    <Text style={styles.downloadTitle}>{data.layout.footer.download.title}</Text>
                    <Text style={styles.downloadSub}>{data.layout.footer.download.subtitle}</Text>
                    <View style={styles.downloadButtons}>
                      <View style={styles.storeBtn}>
                        <Ionicons name="logo-google-playstore" size={20} color={colors.white} />
                        <View>
                          <Text style={styles.storeBtnSub}>GET IT ON</Text>
                          <Text style={styles.storeBtnTitle}>Google Play</Text>
                        </View>
                      </View>
                      <View style={styles.storeBtn}>
                        <Ionicons name="logo-apple" size={20} color={colors.white} />
                        <View>
                          <Text style={styles.storeBtnSub}>Download on the</Text>
                          <Text style={styles.storeBtnTitle}>App Store</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 120 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  error: { color: colors.error, textAlign: 'center' },

  // ─── Gradient overlay strip above banners (absolutely no header inside) ───
  heroZone: {
    paddingTop: 0,     // gradient starts from very top of banner
    paddingBottom: 0,  // overridden inline with BANNER_HEIGHT * 0.80
    marginBottom: 0,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAll: {
    ...typography.subtitle2,
    color: colors.primary,
  },
  hList: { paddingBottom: spacing.xs, overflow: 'visible' },
  bannersList: {
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  bannerItem: {
    // width and height set dynamically from BANNER_WIDTH / BANNER_HEIGHT
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  bannerItemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerItemOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  bannerItemTitle: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: typography.h2.fontSize,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  
  // Free Delivery Banner
  heroBanner: {
    backgroundColor: '#15803d',
    borderRadius: radius.xl,
    padding: spacing.md, // Decreased from lg
    paddingVertical: spacing.md, 
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    marginTop: spacing.sm,
  },
  heroContent: { flex: 1, zIndex: 2 },
  heroTrust: { color: '#bbf7d0', ...typography.caption, fontFamily: fonts.medium, marginBottom: 8 },
  heroTitle: { color: colors.white, ...typography.h1, marginBottom: 8 },
  heroSub: { color: '#dcfce7', ...typography.subtitle2, marginBottom: 16 },
  heroBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  heroBtnText: { color: colors.text, ...typography.button, fontSize: 13 },
  heroImage: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    opacity: 0.9,
  },

  // Free Delivery
  freeDeliveryBanner: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cornerTopLeft: {
    position: 'absolute', top: -12, left: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.background, zIndex: 10,
  },
  cornerTopRight: {
    position: 'absolute', top: -12, right: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.background, zIndex: 10,
  },
  cornerBottomLeft: {
    position: 'absolute', bottom: -12, left: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.background, zIndex: 10,
  },
  cornerBottomRight: {
    position: 'absolute', bottom: -12, right: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.background, zIndex: 10,
  },
  freeDeliveryContent: { flex: 1, zIndex: 1 },
  freeDeliveryTitle: { ...typography.h4, color: colors.text, marginBottom: 2 },
  freeDeliverySub: { ...typography.subtitle2, color: colors.textMuted },
  freeDeliveryIcon: { marginRight: 8 },

  // Bulk Orders
  bulkBanner: {
    backgroundColor: '#16a34a',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bulkContent: { flex: 1 },
  bulkTitle: { ...typography.h3, color: colors.white, marginBottom: 4 },
  bulkSub: { ...typography.subtitle2, color: '#dcfce7', marginBottom: 12, paddingRight: 40 },
  bulkBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  bulkBtnText: { color: colors.primaryDark, ...typography.button, fontSize: 13 },
  bulkIcon: { position: 'absolute', right: 0, bottom: -10, opacity: 0.4, transform: [{ rotate: '-15deg' }] },

  // Features Row
  featuresRow: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
  featureItemText: { ...typography.caption, fontFamily: fonts.medium, color: colors.text, lineHeight: 14 },
  featureDivider: { width: 1, height: 24, backgroundColor: '#bbf7d0' },

  // Why Shop With Us
  whyList: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden' },
  whyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: spacing.md,
  },
  whyIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyTextCol: { flex: 1 },
  whyTitle: { ...typography.subtitle1, fontFamily: fonts.bold, color: colors.text, marginBottom: 2 },
  whySub: { ...typography.caption, color: colors.textMuted },

  // Refer & Earn
  referBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
    position: 'relative',
    overflow: 'hidden',
  },
  referContent: { flex: 1, zIndex: 2 },
  referTitle: { ...typography.h4, color: '#15803d', marginBottom: 4 },
  referSub: { ...typography.subtitle2, color: '#166534', marginBottom: 12, paddingRight: 60 },
  referBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#dcfce7',
    gap: 6,
  },
  referBtnText: { color: colors.primary, ...typography.button, fontSize: 12 },
  referIcon: { position: 'absolute', right: 10, bottom: -10, transform: [{ rotate: '10deg' }] },

  // Popular Searches
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  pillText: { ...typography.subtitle2, color: colors.text },

  // Desktop Footer
  footer: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  footerHero: { marginBottom: spacing.lg },
  footerTitle: { ...typography.h2, color: colors.text, marginBottom: 8, lineHeight: 26 },
  footerSub: { ...typography.subtitle2, color: colors.textMuted, lineHeight: 20 },
  footerStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
  footerStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerStatNum: { ...typography.subtitle1, fontFamily: fonts.bold, color: colors.text },
  footerStatLabel: { ...typography.caption, fontSize: 10, color: colors.textMuted },
  downloadBox: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  downloadContent: {},
  downloadTitle: { ...typography.subtitle1, fontFamily: fonts.bold, color: colors.text, marginBottom: 2 },
  downloadSub: { ...typography.caption, fontSize: 11, color: colors.textMuted, marginBottom: 12 },
  downloadButtons: { flexDirection: 'row', gap: 8 },
  storeBtn: {
    backgroundColor: colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 8,
    flex: 1,
  },
  storeBtnSub: { ...typography.caption, fontSize: 8, color: colors.white, opacity: 0.8 },
  storeBtnTitle: { ...typography.caption, fontFamily: fonts.bold, fontSize: 11, color: colors.white },
});
