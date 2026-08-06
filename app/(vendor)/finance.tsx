import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { vendorApi } from '@/api/vendor.api';
import { colors, fonts, spacing, radius } from '@/constants/theme';

function fmt(n: number | undefined) {
  if (!n) return '₹0';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

export default function VendorFinance() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-finance'],
    queryFn: vendorApi.getFinance,
    staleTime: 30000,
  });

  const onRefresh = React.useCallback(() => { refetch(); }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.emptyText}>Failed to load finance data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { summary, transactions } = data;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>{fmt(summary.totalRevenue)}</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.itemLabel}>This Month</Text>
              <Text style={styles.itemValue}>{fmt(summary.monthlyRevenue)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.itemLabel}>Platform Fees</Text>
              <Text style={[styles.itemValue, { color: '#dc2626' }]}>-{fmt(summary.commission)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.itemLabel}>Net Revenue</Text>
              <Text style={styles.itemValue}>{fmt(summary.netRevenue)}</Text>
            </View>
          </View>
        </View>

        {/* Payout Banner */}
        <View style={styles.payoutBanner}>
          <View style={styles.payoutLeft}>
            <Text style={styles.payoutLabel}>Pending Payout</Text>
            <Text style={styles.payoutValue}>{fmt(summary.pendingPayout)}</Text>
          </View>
          <Pressable style={styles.payoutBtn}>
            <Text style={styles.payoutBtnText}>Withdraw</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="file-text" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {transactions.map((tx, idx) => (
              <View key={idx} style={styles.txRow}>
                <View style={styles.txIcon}>
                  <Feather name="arrow-down-left" size={16} color={colors.primary} />
                </View>
                <View style={styles.txMeta}>
                  <Text style={styles.txRef}>Order #{tx.reference}</Text>
                  <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txAmount}>+{fmt(tx.net)}</Text>
                  <Text style={styles.txSub}>Fee: {fmt(tx.commission)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  scroll: { padding: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  // Summary Card
  summaryCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  summaryTop: { marginBottom: spacing.lg },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: fonts.medium, marginBottom: 4 },
  summaryValue: { color: colors.white, fontSize: 32, fontFamily: fonts.bold },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: spacing.md },
  summaryItem: { flex: 1 },
  itemLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: fonts.medium, marginBottom: 2 },
  itemValue: { color: colors.white, fontSize: 16, fontFamily: fonts.bold },

  // Payout Banner
  payoutBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  payoutLeft: { flex: 1 },
  payoutLabel: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.medium },
  payoutValue: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  payoutBtn: { backgroundColor: colors.text, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md },
  payoutBtnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },

  // Sections
  sectionTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.sm },
  txList: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  txIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  txMeta: { flex: 1 },
  txRef: { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  txDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontFamily: fonts.bold, color: colors.primary },
  txSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  
  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  emptyText: { fontSize: 14, fontFamily: fonts.medium, color: colors.textMuted, marginTop: spacing.sm },
});
