import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productApi } from '@/api';
import { InnerHeader } from '@/components/InnerHeader';
import { ProductCard } from '@/components/ProductCard';
import { ShopCard } from '@/components/ShopCard';
import { CategoryCard } from '@/components/CategoryCard';
import { colors, radius, spacing , fonts} from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const { districtId } = useAppSelector((s) => s.location);
  const [query, setQuery] = useState(params.q ?? '');
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced, districtId],
    queryFn: () => productApi.searchProducts(debounced, districtId ?? undefined),
    enabled: debounced.trim().length >= 2,
  });

  const hasQuery = debounced.trim().length >= 2;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <InnerHeader 
        title="Search" 
        showSearch={true} 
        customSearchNode={
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.searchInput, { flex: 1, backgroundColor: '#fff', borderRadius: 999, height: 44, paddingVertical: 0, paddingHorizontal: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, borderWidth: 0 }]}
              placeholder="Search products, shops, categories..."
              value={query}
              onChangeText={setQuery}
              autoCapitalize="words"
              returnKeyType="search"
              autoFocus={true}
            />
          </View>
        }
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>

      {!hasQuery ? (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Type at least 2 characters to search</Text>
        </View>
      ) : isFetching ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.results}>
          {data?.products?.length ? (
            <>
              <Text style={styles.section}>Products</Text>
              <View style={styles.grid}>
                {data.products.map((p) => (
                  <View key={p.id} style={styles.gridItem}>
                    <ProductCard
                      product={p}
                      compact
                      onPress={() => router.push(`/product/${p.id}`)}
                    />
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {data?.shops?.length ? (
            <>
              <Text style={styles.section}>Shops</Text>
              {data.shops.map((s) => (
                <ShopCard key={s.id} shop={s} onPress={() => router.push(`/shop/${s.id}`)} />
              ))}
            </>
          ) : null}

          {data?.categories?.length ? (
            <>
              <Text style={styles.section}>Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {data.categories.map((c) => (
                  <CategoryCard key={c.id} category={c} />
                ))}
              </ScrollView>
            </>
          ) : null}

          {!data?.products?.length && !data?.shops?.length && !data?.categories?.length ? (
            <Text style={styles.empty}>No results for "{debounced}"</Text>
          ) : null}
        </ScrollView>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#dcfce7' },
  searchWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  hint: { padding: spacing.lg, alignItems: 'center' },
  hintText: { color: colors.textMuted },
  centered: { padding: spacing.xl, alignItems: 'center' },
  results: { padding: spacing.md, paddingBottom: spacing.xl },
  section: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: { width: '48%', marginBottom: spacing.md },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
