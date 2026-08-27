import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { customerApi, productApi } from '@/api';
import { ProductCard } from '@/components/ProductCard';
import { colors, radius, spacing , fonts} from '@/constants/theme';

export default function ShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');

  const shopQuery = useQuery({
    queryKey: ['shop', id],
    queryFn: () => customerApi.fetchShop(id!),
    enabled: !!id,
  });

  const productsQuery = useQuery({
    queryKey: ['shopProducts', id],
    queryFn: () => productApi.fetchShopProducts(id!),
    enabled: !!id,
  });

  if (shopQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const shop = shopQuery.data;
  if (!shop) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Shop not found</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={{ paddingBottom: spacing.md }}>
      {shop.bannerUrl ? (
        <Image source={{ uri: shop.bannerUrl }} style={styles.banner} contentFit="cover" />
      ) : null}
      <View style={styles.header}>
        {shop.logoUrl ? (
          <Image source={{ uri: shop.logoUrl }} style={styles.logo} contentFit="cover" />
        ) : null}
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{shop.shopName}</Text>
          {shop.address ? <Text style={styles.address}>{shop.address}</Text> : null}
          
          <View style={styles.metaRow}>
            {shop.phone ? <Text style={styles.phone}>📞 {shop.phone}</Text> : null}
            {shop.rating != null ? (
              <Pressable onPress={() => setActiveTab(prev => prev === 'products' ? 'reviews' : 'products')} style={styles.ratingRow}>
                <Text style={styles.rating}>★ {Number(shop.rating).toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({shop.ratingCount || 0} Reviews)</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <Text style={styles.section}>
        {activeTab === 'products' ? 'Products' : 'Reviews'}
      </Text>
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
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
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
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  headerInfo: { flex: 1 },
  name: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  address: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
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
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingCount: { fontSize: 12, color: colors.textMuted },
  
  reviewCard: { padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewerName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  reviewRating: { color: colors.primary, fontFamily: fonts.bold },
  reviewComment: { color: colors.text, fontSize: 14, marginBottom: 8 },
  reviewDate: { fontSize: 12, color: colors.textMuted },
});
