import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchOrder } from '@/api/customer';
import { Button } from '@/components/Button';
import { colors, radius, spacing , fonts} from '@/constants/theme';
import { api, unwrap } from '@/api/client';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
  });

  async function cancel() {
    await unwrap(api.post(`/customer/orders/${id}/cancel`, { reason: 'Customer cancelled' }));
    router.back();
  }

  if (isLoading || !order) {
    return <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>;
  }

  const canCancel = order.status === 'PLACED' || order.status === 'CONFIRMED';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{order.orderNumber}</Text>
      <Text style={styles.status}>{order.status}</Text>
      <Text style={styles.vendor}>{order.vendor?.shopName}</Text>
      {order.items?.map((item, idx) => (
        <View key={idx} style={styles.row}>
          <Text style={styles.itemName}>{item.name} × {item.quantity}</Text>
          <Text>₹{Number(item.total).toFixed(0)}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Grand total</Text>
        <Text style={styles.total}>₹{Number(order.grandTotal).toFixed(0)}</Text>
      </View>
      {canCancel && <Button title="Cancel order" variant="ghost" onPress={cancel} style={{ marginTop: spacing.lg }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontFamily: fonts.bold, color: colors.text },
  status: { color: colors.primary, fontFamily: fonts.medium, marginTop: spacing.xs },
  vendor: { color: colors.textMuted, marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { flex: 1, color: colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  totalLabel: { fontFamily: fonts.medium },
  total: { fontSize: 20, fontFamily: fonts.bold, color: colors.primary },
});
