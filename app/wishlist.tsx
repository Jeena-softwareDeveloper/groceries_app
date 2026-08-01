import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customerApi } from '@/api';
import { InnerHeader } from '@/components/InnerHeader';
import { colors, radius, spacing , fonts} from '@/constants/theme';

export default function WishlistScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['wishlist'], queryFn: customerApi.fetchWishlist });

  const removeMutation = useMutation({
    mutationFn: customerApi.removeFromWishlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <InnerHeader title="Wishlist" showBack showSearch={false} showCart={false} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isLoading ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : data.length === 0 ? (
        <Text style={styles.empty}>Your wishlist is empty</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => {
            const p = item.product;
            const img = p.images?.[0]?.url;
            return (
              <Pressable style={styles.row} onPress={() => router.push(`/product/${p.id}`)}>
                {img ? <Image source={{ uri: img }} style={styles.thumb} /> : <View style={[styles.thumb, styles.placeholder]} />}
                <View style={styles.info}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.price}>₹{Number(p.sellingPrice).toFixed(0)}</Text>
                </View>
                <Pressable onPress={() => removeMutation.mutate(p.id)}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
          </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#dcfce7' },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.border },
  placeholder: {},
  info: { flex: 1, marginLeft: spacing.md },
  name: { fontFamily: fonts.medium, color: colors.text },
  price: { color: colors.primary, marginTop: 4, fontFamily: fonts.bold },
  remove: { color: colors.error, fontSize: 13, fontFamily: fonts.medium },
});
