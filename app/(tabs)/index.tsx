import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import LottieView from 'lottie-react-native';
import { customerApi, cartApi } from '@/api';
import { LoadingState } from '@/components/ui/LoadingState';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { ShopCard } from '@/components/ShopCard';
import { colors, radius, spacing, fonts, typography } from '@/constants/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setItemCount } from '@/store/cartSlice';
import { setShowLoginModal } from '@/store/authSlice';
import { setShowLocationModal } from '@/store/locationSlice';

import { useEvent } from 'expo';

function VideoBanner({ url, style, onReady }: { url: string, style: any, onReady?: () => void }) {
  console.log('[VideoBanner] url:', url);

  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // expo-video 3.x: useEvent returns the event payload object
  const statusPayload = useEvent(player, 'statusChange', { status: player.status });
  // statusPayload may be { status: string } or just a string depending on version
  const currentStatus: string =
    typeof statusPayload === 'string'
      ? statusPayload
      : (statusPayload as any)?.status ?? player.status;

  console.log('[VideoBanner] status:', currentStatus);

  useEffect(() => {
    let t: any;
    if (currentStatus === 'readyToPlay') {
      player.play();
      onReady?.();
    } else if (currentStatus === 'error') {
      console.warn('[VideoBanner] video error - releasing overlay');
      onReady?.();
    } else {
      // Safety fallback: release overlay after 6 seconds even if status never fires
      t = setTimeout(() => {
        console.warn('[VideoBanner] timeout fallback - releasing overlay');
        onReady?.();
      }, 6000);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [currentStatus]);

  return (
    <View style={[style, { position: 'relative' }]}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={true}
        contentFit="cover"
        allowsFullscreen={true}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

function TypewriterSearchBar({ onPress }: { onPress: () => void }) {
  const searchHints = ['Milk, Bread, Eggs...', 'Fresh Tomatoes...', 'Amul Butter...', 'Rice, Dal, Oil...', 'Snacks & Drinks...', 'Daily Essentials...'];
  const [hintIndex, setHintIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const searchGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(searchGlow, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(searchGlow, { toValue: 0, duration: 1400, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const currentHint = searchHints[hintIndex];
    let timeout: any;
    if (!isDeleting && typedText.length < currentHint.length) {
      timeout = setTimeout(() => setTypedText(currentHint.slice(0, typedText.length + 1)), 60);
    } else if (!isDeleting && typedText.length === currentHint.length) {
      timeout = setTimeout(() => setIsDeleting(true), 1400);
    } else if (isDeleting && typedText.length > 0) {
      timeout = setTimeout(() => setTypedText(typedText.slice(0, -1)), 35);
    } else if (isDeleting && typedText.length === 0) {
      setIsDeleting(false);
      setHintIndex((i) => (i + 1) % searchHints.length);
    }
    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, hintIndex]);

  const glowBorderColor = searchGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e2e8f0', '#86efac'],
  });
  const glowShadowOpacity = searchGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.22],
  });

  return (
    <Animated.View style={[styles.searchBarOuter, { borderColor: glowBorderColor, shadowOpacity: glowShadowOpacity }]}>
      <Pressable style={styles.searchBar} onPress={onPress}>
        <Ionicons name="search-outline" size={20} color="#22c55e" />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.searchPlaceholder}>
            {typedText}<Text style={{ color: '#22c55e', fontFamily: fonts.bold }}>|</Text>
          </Text>
        </View>
        <View style={styles.qrBtn}>
          <Ionicons name="scan" size={20} color={colors.primary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Global cache to prevent showing the image loading spinner again when navigating back
const loadedVisualsCache = new Set<string>();

export default function HomeScreen() {
  const router = useRouter();
  const { accessToken } = useAppSelector((s) => s.auth);
  const { districtId, areaId, latitude, longitude, displayName, areaName, districtName } = useAppSelector((s) => s.location);
  const itemCount = useAppSelector((s) => s.cart.itemCount);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const hasAttemptedLogin = useRef(false);

  const isGPSMode = !districtId && !!latitude && !!longitude;
  const hasLocation = !!districtId || isGPSMode;

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const VIDEO_HEIGHT = Math.round(SCREEN_WIDTH * 0.48); // Reduced from 16:9ish

  const [totalVisuals, setTotalVisuals] = useState(0);
  const [loadedVisuals, setLoadedVisuals] = useState(0);
  const cacheKey = `${districtId}-${areaId}`;
  const handleVisualLoaded = useCallback(() => {
    if (loadedVisualsCache.has(cacheKey)) return;
    setLoadedVisuals((prev) => prev + 1);
  }, [cacheKey]);

  // Track location changes to show loading overlay when location is updated
  const [locationChanged, setLocationChanged] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    await refetch();
    setIsManualRefreshing(false);
  }, [refetch]);

  const prevLocationRef = useRef({ districtId, areaId, latitude, longitude });
  useEffect(() => {
    const prev = prevLocationRef.current;
    const changed =
      prev.districtId !== districtId ||
      prev.areaId !== areaId ||
      prev.latitude !== latitude ||
      prev.longitude !== longitude;
    if (changed && hasLocation) {
      prevLocationRef.current = { districtId, areaId, latitude, longitude };
      setLocationChanged(true);
      setLoadedVisuals(0); // reset loading state for new location
    }
  }, [districtId, areaId, latitude, longitude, hasLocation]);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['homeFeed', districtId, areaId, latitude, longitude, isGPSMode],
    queryFn: () =>
      isGPSMode
        ? customerApi.fetchHomeFeedByLocation(latitude!, longitude!)
        : customerApi.fetchHomeFeed(districtId ?? '', areaId ?? undefined, latitude, longitude),
    enabled: hasLocation,
    staleTime: 60 * 1000,
  });

  const { data: nearbyShops } = useQuery({
    queryKey: ['nearbyShops', districtId, areaId, latitude, longitude],
    queryFn: () =>
      customerApi.fetchShops(districtId ?? undefined, areaId ?? undefined, undefined, latitude, longitude),
    enabled: hasLocation,
    staleTime: 60 * 1000,
  });

  const [imagesPreloaded, setImagesPreloaded] = useState(() => loadedVisualsCache.has(cacheKey));

  useEffect(() => {
    if (data && !imagesPreloaded) {
      const urls: string[] = [];
      if (data.banners) {
        data.banners.forEach((b: any) => {
          if (b.imageUrl && b.type !== 'VIDEO') urls.push(b.imageUrl);
        });
      }
      if (data.categories) {
        data.categories.forEach((c: any) => {
          if (c.imageUrl) urls.push(c.imageUrl);
        });
      }

      if (urls.length === 0) {
        setImagesPreloaded(true);
      } else {
        // Fallback timeout so we never hang indefinitely
        const timer = setTimeout(() => {
          console.warn('[HomeScreen] imagesPreloaded timed out');
          setImagesPreloaded(true);
        }, 3000);

        Promise.all(urls.map(url => Image.prefetch(url)))
          .then(() => { clearTimeout(timer); setImagesPreloaded(true); })
          .catch(() => { clearTimeout(timer); setImagesPreloaded(true); });
      }
    }
  }, [data, imagesPreloaded]);

  const row1Banner = data?.banners?.find((b: any) => b.row === 1) ?? data?.banners?.[0];
  const row2Banners: any[] = data?.banners?.filter((b: any) => b.row === 2) ?? [];
  const row3Banner = data?.banners?.find((b: any) => b.row === 3);

  const videoSrc: string | null =
    row1Banner?.videoUrl?.trim() ||
    (row1Banner?.type === 'VIDEO' && row1Banner?.imageUrl?.trim()
      ? row1Banner.imageUrl.trim()
      : null) ||
    null;

  const hasVideo = !!videoSrc;

  useEffect(() => {
    if (data && locationChanged) {
      setLocationChanged(false);
    }
  }, [data, locationChanged]);

  useEffect(() => {
    if (data) {
      let count = 0;
      if (hasVideo || (row1Banner?.imageUrl && row1Banner?.type !== 'VIDEO')) count++;
      if (row2Banners.length) count += row2Banners.length;
      if (data.categories?.length) count += data.categories.length;
      if (row3Banner?.imageUrl) count++;

      setTotalVisuals(count);
      setLoadedVisuals(0);
    }
  }, [data, hasVideo]);

  // Safety fallback for visual loader
  useEffect(() => {
    let t: any;
    if (data && totalVisuals > 0 && loadedVisuals < totalVisuals) {
      t = setTimeout(() => {
        console.warn('[HomeScreen] Visual loader timed out');
        setLoadedVisuals(totalVisuals);
      }, 4000);
    }
    return () => { if (t) clearTimeout(t); };
  }, [data, totalVisuals, loadedVisuals]);

  const isPageLoading = !hasLocation || isLoading || !data || !imagesPreloaded || locationChanged;
  
  const hasLoadedVisualsBefore = loadedVisualsCache.has(cacheKey);
  
  const showVisualsLoader = !hasLoadedVisualsBefore && (totalVisuals > 0 && loadedVisuals < totalVisuals);
  const showOverlay = isPageLoading || showVisualsLoader;

  useEffect(() => {
    if (totalVisuals > 0 && loadedVisuals >= totalVisuals) {
      loadedVisualsCache.add(cacheKey);
    }
  }, [totalVisuals, loadedVisuals, cacheKey]);

  useEffect(() => {
    if (data && !showOverlay && !accessToken && !hasAttemptedLogin.current) {
      hasAttemptedLogin.current = true;
      const timer = setTimeout(() => dispatch(setShowLoginModal(true)), 2000);
      return () => clearTimeout(timer);
    }
  }, [data, showOverlay, accessToken, dispatch]);

  const fadeAnim = useRef(new Animated.Value(showOverlay ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showOverlay ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [showOverlay, fadeAnim]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);



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

  const handleAddToCart = (productId: string) => {
    if (!accessToken) { dispatch(setShowLoginModal(true)); return; }
    addToCartMutation.mutate(productId);
  };

  const locationLabel = areaName && districtName
    ? `${areaName}, ${districtName}`
    : displayName || 'Select location';



  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: colors.error, textAlign: 'center', fontFamily: fonts.regular }}>
          {error instanceof Error ? error.message : 'Failed to load'}
        </Text>
      </View>
    );
  }

  if (data && (data as any).serviced === false) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Feather name="map-pin" size={64} color={colors.primary} style={{ marginBottom: 24 }} />
          <Text style={{ fontSize: 22, fontFamily: fonts.bold, color: colors.text, textAlign: 'center', marginBottom: 12 }}>
            We're not here yet!
          </Text>
          <Text style={{ fontSize: 15, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            Sorry, we don't have stores in {displayName || 'your area'} yet.
          </Text>
          <Pressable
            style={{ backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            onPress={() => dispatch(setShowLocationModal(true))}
          >
            <Feather name="map" size={18} color="#fff" />
            <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: '#fff' }}>Change Location</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Banner helpers ─────────────────────────────────────────────────────────
  const halfW = (SCREEN_WIDTH - spacing.md * 2 - spacing.sm) / 2;
  const row2H = Math.round(halfW * 0.95);
  const row3H = Math.round(SCREEN_WIDTH * 0.48);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ═══════════════════════════════════════════════════════════
          STICKY HEADER: Logo | Location | Bell + Cart
      ═══════════════════════════════════════════════════════════ */}
      <View style={styles.header}>
        {/* Logo */}
        <Pressable style={styles.logoRow} onPress={() => {}}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logoImg} contentFit="contain" />
          <View>
            <Text style={[styles.logoText, { color: '#0f5132' }]}>ALL TIME</Text>
            <Text style={[styles.logoText, { color: '#ea580c' }]}>MARKET</Text>
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Location pill */}
          <Pressable style={styles.locationPill} onPress={() => dispatch(setShowLocationModal(true))}>
            <Ionicons name="location" size={13} color={colors.text} />
            <Text style={styles.locationPillText} numberOfLines={1}>{locationLabel}</Text>
            <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
          </Pressable>

          {/* Bell */}
          <Pressable style={styles.headerIconBtn} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>
      </View>

      {/* ═══════════════════════════════════════════════════════════
          SCROLLABLE CONTENT
      ═══════════════════════════════════════════════════════════ */}
      {!!data && !locationChanged && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isManualRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        >
          {/* ── ROW 1: VIDEO OR IMAGE BANNER ── */}
          {hasVideo ? (
            <View style={styles.videoBannerWrap}>
              <VideoBanner url={videoSrc!} style={styles.videoBannerImg as any} onReady={handleVisualLoaded} />
            </View>
          ) : row1Banner?.imageUrl && row1Banner?.type !== 'VIDEO' ? (
            <View style={styles.videoBannerWrap}>
              <Image 
                source={{ uri: row1Banner.imageUrl }} 
                style={styles.videoBannerImg as any} 
                contentFit="cover" 
                onLoad={handleVisualLoaded}
                onError={handleVisualLoaded}
              />
            </View>
          ) : null}

        {/* ── WHITE CONTENT AREA (BELOW VIDEO) ── */}
        <View style={styles.bottomContentWrap}>

          {/* ── 1. SEARCH BAR ── */}
          <View style={styles.searchWrap}>
            <TypewriterSearchBar onPress={() => router.push('/(tabs)/search')} />
          </View>

          {/* ── 2. BANNER IMAGES (70% width horizontal scroll) ── */}
          {row2Banners.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={Math.round(SCREEN_WIDTH * 0.70) + spacing.sm}
              snapToAlignment="start"
              contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
              style={{ marginTop: 6 }}
            >
              {row2Banners.map((b: any) => (
                <Pressable
                  key={b.id}
                  style={{
                    width: Math.round(SCREEN_WIDTH * 0.70),
                    height: Math.round(SCREEN_WIDTH * 0.70 * 0.60),
                    borderRadius: 16,
                    overflow: 'hidden',
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                  }}
                >
                  <Image 
                    source={{ uri: b.imageUrl }} 
                    style={{ width: '100%', height: '100%' }} 
                    contentFit="cover" 
                    onLoad={handleVisualLoaded}
                    onError={handleVisualLoaded}
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}


          {/* ── 3. SHOP BY CATEGORIES ── */}
          {data?.categories?.length ? (
            <View style={{ marginTop: 6 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Shop by Categories</Text>
                <Pressable style={styles.viewAllRow} onPress={() => router.push('/(tabs)/categories')}>
                  <Text style={styles.viewAll}>View all</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 4 }}
              >
                {data.categories.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    isSelected={false}
                    onPress={() => router.push(`/category/${cat.id}?name=${encodeURIComponent(cat.name)}`)}
                    onVisualReady={handleVisualLoaded}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* ── 4. WIDE FULL-WIDTH BANNER IMAGE ── */}
          {row3Banner && row3Banner.imageUrl ? (
            <Pressable style={[styles.row3Card, { height: row3H }]}>
              <Image
                source={{ uri: row3Banner.imageUrl }}
                style={{ width: SCREEN_WIDTH - spacing.md * 2, height: row3H }}
                contentFit="cover"
                onLoad={handleVisualLoaded}
                onError={handleVisualLoaded}
              />
            </Pressable>
          ) : null}

        </View>



        {/* ── CART FAB ── */}
        {itemCount > 0 && (
          <View style={{ height: 80 }} />
        )}
      </ScrollView>
      )}

      {/* ── FLOATING CART BUTTON ── */}
      {itemCount > 0 && (
        <Pressable
          style={styles.cartFab}
          onPress={() => router.push('/(tabs)/cart')}
        >
          <Ionicons name="cart" size={22} color="#fff" />
          <Text style={styles.cartFabText}>{itemCount} item{itemCount > 1 ? 's' : ''} in cart</Text>
          <View style={styles.cartFabBadge}>
            <Text style={styles.cartFabBadgeText}>{itemCount}</Text>
          </View>
        </Pressable>
      )}

      <Animated.View 
        pointerEvents={showOverlay ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', zIndex: 999, opacity: fadeAnim }]}
      >
        <LoadingState fullScreen={false} />
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0fdf4' },

  // ── HEADER ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 0,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  logoImg: { width: 52, height: 52, resizeMode: 'contain' },
  logoText: { fontSize: 15, fontFamily: fonts.bold, letterSpacing: -0.2, lineHeight: 17 },
  locationPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: radius.full,
    borderWidth: 1, borderColor: '#e2e8f0',
    maxWidth: 140,
  },
  locationPillText: { fontSize: 12, fontFamily: fonts.medium, color: colors.text, flex: 1 },
  headerIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5, borderColor: '#fff',
  },

  // ── SCROLL ──
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 0 }, // Changed to 0 since padding is handled by bottomContentWrap

  bottomContentWrap: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 4,
    paddingBottom: 120,
  },

  // ── VIDEO BANNER ──
  videoBannerWrap: {
    marginHorizontal: spacing.md,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: radius.xl,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  videoBannerImg: {
    width: '100%',
    height: Math.round(SW * 0.48), // Reduced from 0.56
  },
  playBtnWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)',
  },
  videoBannerContent: {
    position: 'absolute',
    bottom: 40,
    left: 0, right: 0,
    padding: spacing.md,
  },
  videoBannerTitle: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  videoBannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },
  shopNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 8,
    elevation: 2,
  },
  shopNowText: { color: '#fff', fontFamily: fonts.bold, fontSize: 13 },
  videoControls: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    paddingTop: 6,
  },
  videoTime: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.regular, fontSize: 11 },
  progressTrack: {
    flex: 1, height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    width: '30%', height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  // ── SEARCH BAR ──
  searchWrap: {
    marginHorizontal: spacing.md,
    marginTop: 10,
    marginBottom: 10,
  },
  searchBarOuter: {
    borderRadius: radius.full,
    borderWidth: 1.5,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: 6,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: radius.full,
  },
  searchPlaceholder: {
    fontSize: 15, fontFamily: fonts.medium,
    color: '#94a3b8', flex: 1,
  },
  qrBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f0fdf4',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── ROW 2 (dual images) ──
  row2Wrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  row2Card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginRight: spacing.sm,
  },
  row2Img: { width: '100%', height: '100%', resizeMode: 'cover' },
  row2Overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  row2Content: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.sm,
  },
  row2Title: {
    color: '#1e293b', fontFamily: fonts.bold, fontSize: 13,
  },
  row2Subtitle: {
    color: '#475569', fontFamily: fonts.regular, fontSize: 11, marginTop: 1,
  },
  row2Tag: {
    color: '#ea580c', fontFamily: fonts.bold, fontSize: 12, marginTop: 1,
  },
  row2Btn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primary,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start', marginTop: 6,
  },
  row2BtnAlt: { backgroundColor: '#ea580c' },
  row2BtnText: { color: '#fff', fontFamily: fonts.bold, fontSize: 10 },

  // ── ROW 3 (wide image) ──
  row3Card: {
    marginHorizontal: spacing.md,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: radius.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  row3Img: { width: '100%', height: '100%' },
  row3Overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  row3Content: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md,
  },
  row3Title: { color: '#1e293b', fontFamily: fonts.bold, fontSize: 18 },
  row3Subtitle: { color: '#475569', fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  row3Tag: { color: '#64748b', fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },

  // ── SECTION HEADER ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: 6,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewAll: { fontSize: 13, fontFamily: fonts.medium, color: colors.primary },

  // ── FREE DELIVERY ──
  freeDeliveryBanner: {
    marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.md, overflow: 'hidden',
    elevation: 3, shadowColor: '#3b1c0a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6,
  },
  freeDeliveryGradient: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    flexDirection: 'row', alignItems: 'center',
  },

  // ── WHY SHOP WITH US ──
  whyList: {
    backgroundColor: '#fff', marginHorizontal: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden',
  },
  whyItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  whyDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  whyIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  whyTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.text, marginBottom: 2 },
  whySub: { fontSize: 12, fontFamily: fonts.regular, color: colors.textMuted },

  // ── FLOATING CART FAB ──
  cartFab: {
    position: 'absolute',
    bottom: 90,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  cartFabText: { flex: 1, color: '#fff', fontFamily: fonts.bold, fontSize: 14 },
  cartFabBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartFabBadgeText: { color: '#fff', fontFamily: fonts.bold, fontSize: 11 },
});
