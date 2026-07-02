import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchShop, fetchShopProducts } from '@/api/customer';
import { ProductCard } from '@/components/ProductCard';
import { colors, radius, spacing } from '@/constants/theme';

export default function ShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const shopQuery = useQuery({
    queryKey: ['shop', id],
    queryFn: () => fetchShop(id!),
    enabled: !!id,
  });

  const productsQuery = useQuery({
    queryKey: ['shopProducts', id],
    queryFn: () => fetchShopProducts(id!),
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {shop.bannerUrl ? (
        <Image source={{ uri: shop.bannerUrl }} style={styles.banner} resizeMode="cover" />
      ) : (
        <View style={[styles.banner, styles.bannerPlaceholder]} />
      )}
      <View style={styles.header}>
        {shop.logoUrl ? (
          <Image source={{ uri: shop.logoUrl }} style={styles.logo} />
        ) : null}
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{shop.shopName}</Text>
          {shop.address ? <Text style={styles.address}>{shop.address}</Text> : null}
          {shop.rating != null ? (
            <Text style={styles.rating}>★ {Number(shop.rating).toFixed(1)}</Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.section}>Products</Text>
      {productsQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : productsQuery.data?.length ? (
        <View style={styles.grid}>
          {productsQuery.data.map((p) => (
            <View key={p.id} style={styles.gridItem}>
              <ProductCard
                product={p}
                compact
                onPress={() => router.push(`/product/${p.id}`)}
              />
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>No products available</Text>
      )}
    </ScrollView>
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
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  address: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  rating: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 4 },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  gridItem: { width: '48%', marginBottom: spacing.md },
  empty: { padding: spacing.lg, color: colors.textMuted, textAlign: 'center' },
});
