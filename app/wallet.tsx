import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWallet } from '@/api/customer';
import { Header } from '@/components/Header';
import { colors, radius, spacing } from '@/constants/theme';

export default function WalletScreen() {
  const { data, isLoading } = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Wallet" showBack />
      <View style={styles.balanceCard}>
        <Text style={styles.label}>Available balance</Text>
        <Text style={styles.balance}>₹{isLoading ? '—' : Number(data?.balance ?? 0).toFixed(0)}</Text>
      </View>
      <Text style={styles.section}>Recent transactions</Text>
      <FlatList
        data={data?.transactions ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.tx}>
            <Text style={styles.txType}>{item.type}</Text>
            <Text style={[styles.txAmount, item.amount < 0 ? styles.debit : styles.credit]}>
              {item.amount < 0 ? '' : '+'}₹{Math.abs(item.amount)}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  balanceCard: {
    margin: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  label: { color: '#dcfce7', fontSize: 14 },
  balance: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: spacing.sm },
  section: { paddingHorizontal: spacing.md, fontWeight: '700', color: colors.text },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.lg },
  tx: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txType: { color: colors.text, fontWeight: '500' },
  txAmount: { fontWeight: '700' },
  credit: { color: colors.primary },
  debit: { color: colors.error },
});
