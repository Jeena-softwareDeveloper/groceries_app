import { useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '@/api/customer.api';
import { ShopCard } from '@/components/ShopCard';
import { colors, radius, spacing, fonts, typography } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';

export default function CategoryShopsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { districtId, latitude, longitude } = useAppSelector((s) => s.location);
  const cartCount = useAppSelector((s) => s.cart.itemCount);

  const { data: shops, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['categoryShops', id, districtId, latitude, longitude],
    queryFn: () =>
      customerApi.fetchShops(districtId ?? undefined, undefined, id, latitude, longitude),
    enabled: !!id && (!!districtId || (!!latitude && !!longitude)),
    staleTime: 60_000,
  });

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="storefront-outline" size={64} color={colors.border} />
        <Text style={styles.emptyTitle}>No shops yet</Text>
        <Text style={styles.emptySub}>Check back soon for new vendors!</Text>
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
            {name ?? 'Vendors'}
          </Text>
          {shops && (
            <Text style={styles.headerCount}>{shops.length} shops</Text>
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

      {/* ── Shop List ── */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading vendors…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>Failed to load vendors</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          key="grid-2"
          data={shops || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.md }}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <ShopCard
                shop={item}
                isNearest={!!latitude && !!longitude && shops?.[0]?.id === item.id}
                onPress={() => router.push(`/shop/${item.id}`)}
              />
            </View>
          )}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => refetch()}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={11}
          removeClippedSubviews={true}
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

  // List
  list: { padding: spacing.md, paddingBottom: 100 },
  listItem: { flex: 1, maxWidth: '50%', marginBottom: spacing.md },

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
