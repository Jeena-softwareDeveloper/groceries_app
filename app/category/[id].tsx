import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { productApi, cartApi } from '@/api';
import { ProductCard } from '@/components/ProductCard';
import { colors, radius, spacing, fonts, typography } from '@/constants/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setItemCount } from '@/store/cartSlice';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
  { label: 'Name A–Z', value: 'name' },
];

export default function CategoryProductsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { districtId } = useAppSelector((s) => s.location);
  const cartCount = useAppSelector((s) => s.cart.itemCount);

  const [sort, setSort] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['categoryProducts', id, sort, page, districtId],
    queryFn: () =>
      productApi.fetchProducts({
        categoryId: id,
        districtId: districtId ?? undefined,
        sort,
        page,
        limit: LIMIT,
      }),
    enabled: !!id,
    staleTime: 60_000,
  });

  const addToCartMutation = useMutation({
    mutationFn: (productId: string) => cartApi.addToCart(productId, 1),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const cart = await cartApi.fetchCart();
      dispatch(setItemCount(cart.items.reduce((s: number, i: any) => s + i.quantity, 0)));
      Alert.alert('Added!', 'Item added to cart');
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not add to cart'),
  });

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Sort';

  const handleLoadMore = () => {
    if (data && page < data.totalPages && !isFetching) {
      setPage((p) => p + 1);
    }
  };

  const renderFooter = () => {
    if (!isFetching) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="cube-outline" size={64} color={colors.border} />
        <Text style={styles.emptyTitle}>No products yet</Text>
        <Text style={styles.emptySub}>Check back soon for new arrivals!</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: spacing.md }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {name ?? 'Products'}
          </Text>
          {data?.total !== undefined && (
            <Text style={styles.headerCount}>{data.total} items</Text>
          )}
        </View>
        {/* Cart */}
        <Pressable style={styles.cartBtn} onPress={() => router.push('/(tabs)/cart')}>
          <Ionicons name="cart-outline" size={22} color={colors.text} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ── Sort Bar ── */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>
          {data?.total ? `${data.total} Products` : 'Products'}
        </Text>
        <Pressable style={styles.sortBtn} onPress={() => setShowSortMenu((v) => !v)}>
          <Ionicons name="swap-vertical-outline" size={16} color={colors.primary} />
          <Text style={styles.sortBtnText}>{activeSortLabel}</Text>
          <Ionicons
            name={showSortMenu ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.primary}
          />
        </Pressable>
      </View>

      {/* ── Sort Dropdown ── */}
      {showSortMenu && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.sortOption, sort === opt.value && styles.sortOptionActive]}
              onPress={() => {
                setSort(opt.value);
                setPage(1);
                setShowSortMenu(false);
              }}
            >
              <Text style={[styles.sortOptionText, sort === opt.value && styles.sortOptionTextActive]}>
                {opt.label}
              </Text>
              {sort === opt.value && (
                <Ionicons name="checkmark" size={16} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* ── Product Grid ── */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>Failed to load products</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data?.products ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard
                product={item}
                compact
                onPress={() => router.push(`/product/${item.id}`)}
                onAddToCart={() => addToCartMutation.mutate(item.id)}
              />
            </View>
          )}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && page === 1}
              onRefresh={() => {
                setPage(1);
                refetch();
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text,
  },
  headerCount: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { fontSize: 10, color: colors.white, fontFamily: fonts.bold },

  // Sort bar
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortLabel: {
    ...typography.subtitle2,
    color: colors.textMuted,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  sortBtnText: {
    ...typography.caption,
    fontFamily: fonts.bold,
    color: colors.primary,
  },

  // Sort dropdown
  sortDropdown: {
    position: 'absolute',
    top: 110,
    right: spacing.md,
    zIndex: 100,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    minWidth: 160,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sortOptionActive: { backgroundColor: '#f0fdf4' },
  sortOptionText: { ...typography.body2, color: colors.text },
  sortOptionTextActive: { color: colors.primary, fontFamily: fonts.bold },

  // Grid
  grid: { padding: spacing.md, paddingBottom: 100 },
  row: { justifyContent: 'space-between' },
  gridItem: { width: '48.5%', marginBottom: spacing.md },

  // States
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingText: { ...typography.subtitle2, color: colors.textMuted, marginTop: spacing.md },
  errorText: { ...typography.subtitle1, color: colors.error, marginTop: spacing.md, textAlign: 'center' },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  retryBtnText: { ...typography.button, color: colors.white },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { ...typography.h4, color: colors.text, marginTop: spacing.md },
  emptySub: { ...typography.subtitle2, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});
