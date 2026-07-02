import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchHomeFeed } from '@/api/customer';
import { CategoryCard } from '@/components/CategoryCard';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ShopCard } from '@/components/ShopCard';
import { colors, radius, spacing } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export default function HomeScreen() {
  const router = useRouter();
  const { districtId, areaId } = useAppSelector((s) => s.location);

  const { data, isLoading, error } = useQuery({
    queryKey: ['homeFeed', districtId, areaId],
    queryFn: () => fetchHomeFeed(districtId!, areaId ?? undefined),
    enabled: !!districtId,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header />
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error instanceof Error ? error.message : 'Failed to load'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {data?.banners?.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bannerRow}>
              {data.banners.map((b) => (
                <Image key={b.id} source={{ uri: b.imageUrl }} style={styles.banner} />
              ))}
            </ScrollView>
          ) : null}

          {data?.microBanners?.length ? (
            <>
              <SectionTitle title="Promotions" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bannerRow}>
                {data.microBanners.map((b) => (
                  <Image key={b.id} source={{ uri: b.imageUrl }} style={styles.microBanner} />
                ))}
              </ScrollView>
            </>
          ) : null}

          {data?.categories?.length ? (
            <>
              <SectionTitle title="Categories" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hList}>
                {data.categories.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    onPress={() => router.push(`/(tabs)/search?q=${encodeURIComponent(cat.name)}`)}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}

          {data?.nearbyShops?.length ? (
            <>
              <SectionTitle title="Nearby Stores" />
              {data.nearbyShops.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  onPress={() => router.push(`/shop/${shop.id}`)}
                />
              ))}
            </>
          ) : null}

          {data?.trendingProducts?.length ? (
            <>
              <SectionTitle title="Trending" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hList}>
                {data.trendingProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onPress={() => router.push(`/product/${p.id}`)}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}

          {data?.bestSellers?.length ? (
            <>
              <SectionTitle title="Best Sellers" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hList}>
                {data.bestSellers.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onPress={() => router.push(`/product/${p.id}`)}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}

          {data?.offers?.length ? (
            <View style={styles.offers}>
              <SectionTitle title="Offers" />
              {data.offers.map((o) => (
                <View key={o.id} style={styles.offerCard}>
                  <Text style={styles.offerTitle}>{o.title}</Text>
                  {o.description ? <Text style={styles.offerDesc}>{o.description}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  error: { color: colors.error, textAlign: 'center' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  hList: { marginBottom: spacing.sm },
  bannerRow: { marginBottom: spacing.md },
  banner: {
    width: 300,
    height: 140,
    borderRadius: radius.lg,
    marginRight: spacing.md,
  },
  microBanner: {
    width: 200,
    height: 80,
    borderRadius: radius.md,
    marginRight: spacing.sm,
  },
  offers: { marginTop: spacing.md },
  offerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  offerDesc: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
