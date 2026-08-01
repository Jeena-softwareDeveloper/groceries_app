import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderApi } from '@/api';
import { InnerHeader } from '@/components/InnerHeader';
import { colors, radius, spacing , fonts} from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/Button';

const STATUS_COLORS: Record<string, string> = {
  PLACED: '#3b82f6',
  CONFIRMED: '#8b5cf6',
  PACKED: '#f59e0b',
  OUT_FOR_DELIVERY: '#06b6d4',
  DELIVERED: '#16a34a',
  CANCELLED: '#dc2626',
};

export default function OrdersScreen() {
  const router = useRouter();
  const { accessToken } = useAppSelector((s) => s.auth);

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.fetchOrders(1),
    enabled: !!accessToken,
  });

  if (!accessToken) {
    return (
      <SafeAreaView style={styles.safe}>
        <InnerHeader title="My Orders" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Feather name="package" size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 8 }}>Please Login</Text>
          <Text style={{ fontSize: 14, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'center', marginBottom: 24 }}>
            Login to view your order history and track deliveries.
          </Text>
          <Button title="Login / Sign Up" onPress={() => router.push('/(auth)/login')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <InnerHeader title="My Orders" />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error instanceof Error ? error.message : 'Failed to load'}</Text>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.empty}>No orders yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/orders/${item.id}`)}>
              <View style={styles.row}>
                <Text style={styles.orderNo}>{item.orderNumber}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? colors.textMuted }]}>
                  <Text style={styles.badgeText}>{item.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>
              {item.vendor?.shopName ? (
                <Text style={styles.shop}>{item.vendor.shopName}</Text>
              ) : null}
              <Text style={styles.total}>₹{Number(item.grandTotal).toFixed(0)}</Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </Pressable>
          )}
        />
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#dcfce7' },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  error: { color: colors.error },
  empty: { color: colors.textMuted, fontSize: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { fontSize: 14, fontFamily: fonts.bold, color: colors.text, flex: 1 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { color: colors.white, fontSize: 11, fontFamily: fonts.medium },
  shop: { fontSize: 15, color: colors.textMuted, marginTop: spacing.sm },
  total: { fontSize: 18, fontFamily: fonts.bold, color: colors.primary, marginTop: spacing.sm },
  date: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
