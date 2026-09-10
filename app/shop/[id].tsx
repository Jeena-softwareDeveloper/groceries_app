import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/utils/constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingState } from '@/components/ui/LoadingState';
import { Image } from 'expo-image';
import { IMAGE_CACHE_POLICY } from '@/utils/constants';
import { customerApi, productApi } from '@/api';
import { ProductCard } from '@/components/ProductCard';
import { colors, radius, spacing , fonts} from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';

export default function ShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { latitude, longitude } = useAppSelector((s) => s.location);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');

  const shopQuery = useQuery({
    queryKey: ['shop', id, latitude, longitude],
    queryFn: () => customerApi.fetchShop(id!, latitude, longitude),
    enabled: !!id,
    staleTime: STALE_TIMES.CONTENT,
  });

  const productsQuery = useQuery({
    queryKey: ['shopProducts', id],
    queryFn: () => productApi.fetchShopProducts(id!),
    enabled: !!id,
    staleTime: STALE_TIMES.LIST,
  });

  if (shopQuery.isLoading) {
    return <LoadingState />;
  }

  const shop = shopQuery.data;
  if (!shop) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Shop not found</Text>
      </View>
    );
  }

  const displayPhone = shop.phone?.trim() || null;

  const renderHeader = () => (
    <View style={{ paddingBottom: spacing.md, borderBottomWidth: 8, borderBottomColor: colors.surface }}>
      <View style={styles.header}>
        {shop.logoUrl ? (
          <Image source={{ uri: shop.logoUrl }} style={styles.logo} contentFit="cover" cachePolicy={IMAGE_CACHE_POLICY} />
        ) : null}
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{shop.shopName}</Text>
          {shop.address ? <Text style={styles.address}>{shop.address}</Text> : null}
          {shop.distance != null ? (
            <Text style={styles.distance}>
              {shop.distance.toFixed(1)} km away
              {shop.inDeliveryRadius === false ? ' · Out of delivery range' : ''}
            </Text>
          ) : null}

          {displayPhone ? (
            <Text style={{ fontSize: 13, color: colors.primary, fontFamily: fonts.bold, marginTop: 4 }}>
              📞 {displayPhone}
            </Text>
          ) : null}
        </View>

        {displayPhone ? (
          <TouchableOpacity
            style={styles.callShopBtnCircle}
            onPress={() => Linking.openURL(`tel:${displayPhone}`)}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={20} color="#ffffff" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tabBtn, activeTab === 'products' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('products')}
        >
          <Ionicons name="grid-outline" size={16} color={activeTab === 'products' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>Products</Text>
        </Pressable>
        <Pressable 
          style={[styles.tabBtn, activeTab === 'reviews' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('reviews')}
        >
          <Ionicons name="star-outline" size={16} color={activeTab === 'reviews' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
            Reviews {shop.ratingCount ? `(${shop.ratingCount})` : ''}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
    {activeTab === 'products' ? (
      <FlatList
        key="products-grid"
        data={productsQuery.data || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          productsQuery.isLoading ? (
            <LoadingState fullScreen={false} />
          ) : (
            <Text style={styles.empty}>No products available</Text>
          )
        }
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ProductCard
              product={item}
              compact
              onPress={() => router.push(`/product/${item.id}`)}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews={true}
      />
    ) : (
      <FlatList
        key="reviews-list"
        data={shop.reviews || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={styles.empty}>No reviews yet</Text>}
        renderItem={({ item: r }) => (
          <View style={[styles.reviewCard, { marginHorizontal: spacing.md }]}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>{r.customer?.name || 'User'}</Text>
              <Text style={styles.reviewRating}>★ {r.rating}</Text>
            </View>
            {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
            <Text style={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.error },
  banner: { width: '100%', height: 160, backgroundColor: colors.surface },
  bannerPlaceholder: { backgroundColor: colors.border },
  header: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerInfo: { flex: 1 },
  name: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  address: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  distance: { fontSize: 12, color: colors.primary, fontFamily: fonts.medium, marginTop: 4 },
  rating: { fontSize: 13, color: colors.primary, fontFamily: fonts.medium },
  section: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  gridItem: { width: '48%', marginBottom: spacing.md },
  empty: { padding: spacing.lg, color: colors.textMuted, textAlign: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: 4 },
  phone: { fontSize: 13, color: colors.text, fontFamily: fonts.medium },
  callShopBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingCount: { fontSize: 12, color: colors.textMuted },
  
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.medium,
    color: colors.textMuted,
    fontSize: 14,
  },
  tabTextActive: {
    color: colors.primaryDark,
    fontFamily: fonts.bold,
  },

  reviewCard: { padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewerName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  reviewRating: { color: colors.primary, fontFamily: fonts.bold },
  reviewComment: { color: colors.text, fontSize: 14, marginBottom: 8 },
  reviewDate: { fontSize: 12, color: colors.textMuted },
});
