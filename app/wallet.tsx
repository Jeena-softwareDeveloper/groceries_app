import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { walletApi } from '@/api';
import { PageHeader } from '@/components/PageHeader';
import { colors, radius, spacing , fonts} from '@/constants/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setShowLoginModal } from '@/store/authSlice';
import { STALE_TIMES } from '@/utils/constants';

export default function WalletScreen() {
  const { accessToken } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const { data, isLoading } = useQuery({ queryKey: ['wallet'], queryFn: walletApi.fetchWallet, enabled: !!accessToken, staleTime: STALE_TIMES.REALTIME });

  if (!accessToken) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <PageHeader title="Wallet" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 16, color: colors.textMuted, textAlign: 'center' }}>Please sign in to view this page</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <PageHeader title="Wallet" showBack />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.balanceCard}>
        <Text style={styles.label}>Available balance</Text>
        <Text style={styles.balance}>₹{isLoading ? '—' : Number(data?.balance ?? 0).toFixed(0)}</Text>
      </View>
      <Text style={styles.section}>Recent transactions</Text>
      <FlatList
        data={data?.transactions ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: spacing.md }}
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
          </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0fdf4' },
  balanceCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  label: { color: '#dcfce7', fontSize: 14 },
  balance: { color: '#fff', fontSize: 36, fontFamily: fonts.bold, marginTop: spacing.sm },
  section: { paddingHorizontal: spacing.md, fontFamily: fonts.bold, color: colors.text },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.lg },
  tx: {
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txType: { color: colors.text, fontFamily: fonts.medium },
  txAmount: { fontFamily: fonts.bold },
  credit: { color: colors.primary },
  debit: { color: colors.error },
});
