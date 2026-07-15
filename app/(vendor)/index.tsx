import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { vendorApi } from '@/api/vendor.api';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | undefined) {
  if (!n) return '₹0';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color = colors.primary, small = false }: {
  label: string; value: string | number; icon?: string; color?: string; small?: boolean;
}) {
  return (
    <View style={[styles.statCard, small && styles.statCardSmall]}>
      {icon && <Feather name={icon as any} size={18} color={color} style={styles.statIcon} />}
      <Text style={[styles.statValue, { color }]}>{String(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, onPress, actionLabel }: { title: string; onPress?: () => void; actionLabel?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress && <Pressable onPress={onPress}><Text style={styles.sectionAction}>{actionLabel ?? 'See all'}</Text></Pressable>}
    </View>
  );
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  packed: '#8b5cf6',
  outForDelivery: '#06b6d4',
  delivered: '#16a34a',
  cancelled: '#dc2626',
  returned: '#6b7280',
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: vendorApi.getDashboard,
    staleTime: 30000,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.loadingText, { color: colors.error }]}>Failed to load dashboard</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const d = data;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Vendor Portal</Text>
          <Text style={styles.shopName}>{user?.shopName ?? 'My Shop'}</Text>
        </View>
        <Pressable
          style={[styles.notifBtn, d.notifications.unread > 0 && styles.notifBtnActive]}
          onPress={() => router.push('/(vendor)/more')}
        >
          <Feather name="bell" size={20} color={d.notifications.unread > 0 ? colors.white : colors.text} />
          {d.notifications.unread > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{d.notifications.unread > 9 ? '9+' : d.notifications.unread}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Sales Summary */}
        <View style={styles.salesCard}>
          <View style={styles.salesRow}>
            <View style={styles.salesItem}>
              <Text style={styles.salesValue}>{fmt(d.sales.today)}</Text>
              <Text style={styles.salesLabel}>Today's Sales</Text>
              <Text style={styles.salesSub}>{d.sales.todayOrders} orders</Text>
            </View>
            <View style={styles.salesDivider} />
            <View style={styles.salesItem}>
              <Text style={styles.salesValue}>{fmt(d.sales.weekly)}</Text>
              <Text style={styles.salesLabel}>This Week</Text>
              <Text style={styles.salesSub}>{d.sales.weeklyOrders} orders</Text>
            </View>
            <View style={styles.salesDivider} />
            <View style={styles.salesItem}>
              <Text style={styles.salesValue}>{fmt(d.sales.monthly)}</Text>
              <Text style={styles.salesLabel}>This Month</Text>
              <Text style={styles.salesSub}>{d.sales.monthlyOrders} orders</Text>
            </View>
          </View>
          <View style={styles.totalRevRow}>
            <Feather name="trending-up" size={16} color={colors.primary} />
            <Text style={styles.totalRevLabel}>Total Revenue: </Text>
            <Text style={styles.totalRevValue}>{fmt(d.sales.totalRevenue)}</Text>
          </View>
        </View>

        {/* Order Status Grid */}
        <SectionTitle title="Orders" onPress={() => router.push('/(vendor)/orders')} />
        <View style={styles.statsGrid}>
          <StatCard label="Pending" value={d.orders.pending} color={ORDER_STATUS_COLORS.pending} />
          <StatCard label="Accepted" value={d.orders.accepted} color={ORDER_STATUS_COLORS.accepted} />
          <StatCard label="Packed" value={d.orders.packed} color={ORDER_STATUS_COLORS.packed} />
          <StatCard label="On Delivery" value={d.orders.outForDelivery} color={ORDER_STATUS_COLORS.outForDelivery} />
          <StatCard label="Delivered" value={d.orders.delivered} color={ORDER_STATUS_COLORS.delivered} />
          <StatCard label="Cancelled" value={d.orders.cancelled} color={ORDER_STATUS_COLORS.cancelled} />
        </View>

        {/* Product Status */}
        <SectionTitle title="Products" onPress={() => router.push('/(vendor)/products')} />
        <View style={styles.statsGrid}>
          <StatCard label="Active" value={d.products.active} color="#16a34a" />
          <StatCard label="Draft" value={d.products.draft} color="#6b7280" />
          <StatCard label="Pending Review" value={d.products.pendingApproval} color="#f59e0b" />
          <StatCard label="Rejected" value={d.products.rejected} color="#dc2626" />
          <StatCard label="Low Stock" value={d.products.lowStock} color="#ea580c" />
          <StatCard label="Out of Stock" value={d.products.outOfStock} color="#dc2626" />
        </View>

        {/* Customers & Rating */}
        <View style={styles.row}>
          <View style={[styles.infoCard, { flex: 1, marginRight: spacing.sm }]}>
            <Feather name="users" size={20} color={colors.primary} />
            <Text style={styles.infoValue}>{d.customers.total}</Text>
            <Text style={styles.infoLabel}>Customers</Text>
          </View>
          <View style={[styles.infoCard, { flex: 1 }]}>
            <Feather name="star" size={20} color="#f59e0b" />
            <Text style={[styles.infoValue, { color: '#f59e0b' }]}>{d.rating.average.toFixed(1)}</Text>
            <Text style={styles.infoLabel}>{d.rating.count} Reviews</Text>
          </View>
        </View>

        {/* Low Stock Alert */}
        {d.lowStockItems.length > 0 && (
          <>
            <View style={styles.alertBanner}>
              <Feather name="alert-triangle" size={16} color="#ea580c" />
              <Text style={styles.alertText}>{d.lowStockItems.length} product(s) running low on stock</Text>
            </View>
          </>
        )}

        {/* Recent Orders */}
        {d.recentOrders.length > 0 && (
          <>
            <SectionTitle title="Recent Orders" onPress={() => router.push('/(vendor)/orders')} />
            <View style={styles.orderList}>
              {d.recentOrders.slice(0, 5).map((order) => (
                <View key={order.id} style={styles.orderRow}>
                  <View style={styles.orderMeta}>
                    <Text style={styles.orderNum}>#{order.orderNumber}</Text>
                    <Text style={styles.orderCustomer}>{order.customer?.name ?? order.customer?.phone ?? 'Customer'}</Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderAmount}>₹{Number(order.grandTotal).toFixed(0)}</Text>
                    <View style={[styles.statusPill, { backgroundColor: getStatusBg(order.status) }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{formatStatus(order.status)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Best Sellers */}
        {d.bestSellers.length > 0 && (
          <>
            <SectionTitle title="Best Sellers" />
            <View style={styles.orderList}>
              {d.bestSellers.map((b, i) => (
                <View key={b.productId} style={styles.orderRow}>
                  <View style={styles.orderMeta}>
                    <Text style={styles.orderNum}>#{i + 1} {b.product?.name ?? 'Product'}</Text>
                    <Text style={styles.orderCustomer}>{b.totalSold} units sold</Text>
                  </View>
                  <Text style={styles.orderAmount}>{fmt(b.totalRevenue)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

function formatStatus(s: string) {
  const map: Record<string, string> = {
    PLACED: 'Pending', CONFIRMED: 'Accepted', PACKED: 'Packed',
    OUT_FOR_DELIVERY: 'On Delivery', DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled', RETURNED: 'Returned',
  };
  return map[s] ?? s;
}

function getStatusColor(s: string) {
  const map: Record<string, string> = {
    PLACED: '#92400e', CONFIRMED: '#1e40af', PACKED: '#5b21b6',
    OUT_FOR_DELIVERY: '#164e63', DELIVERED: '#14532d',
    CANCELLED: '#991b1b', RETURNED: '#374151',
  };
  return map[s] ?? '#374151';
}

function getStatusBg(s: string) {
  const map: Record<string, string> = {
    PLACED: '#fef3c7', CONFIRMED: '#dbeafe', PACKED: '#ede9fe',
    OUT_FOR_DELIVERY: '#cffafe', DELIVERED: '#dcfce7',
    CANCELLED: '#fee2e2', RETURNED: '#f3f4f6',
  };
  return map[s] ?? '#f3f4f6';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontSize: 15, color: colors.textMuted, fontFamily: fonts.medium },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md },
  retryText: { color: colors.white, fontFamily: fonts.bold },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  greeting: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.medium },
  shopName: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  notifBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#dc2626', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: colors.white, fontSize: 10, fontFamily: fonts.bold },
  scroll: { padding: spacing.md },

  // Sales Card
  salesCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  salesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  salesItem: { flex: 1, alignItems: 'center' },
  salesValue: { fontSize: 20, fontFamily: fonts.bold, color: colors.primary },
  salesLabel: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.medium, marginTop: 4 },
  salesSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  salesDivider: { width: 1, backgroundColor: '#f1f5f9' },
  totalRevRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  totalRevLabel: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.medium, marginLeft: spacing.xs },
  totalRevValue: { fontSize: 16, fontFamily: fonts.bold, color: colors.primary },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, marginTop: spacing.md },
  sectionTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  sectionAction: { fontSize: 13, color: colors.primary, fontFamily: fonts.medium },

  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.md },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 100,
    flexGrow: 1,
    flexBasis: '30%',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  statCardSmall: { minWidth: 80, flexBasis: '22%', padding: spacing.sm },
  statIcon: { marginBottom: 4 },
  statValue: { fontSize: 20, fontFamily: fonts.bold },
  statLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 2, fontFamily: fonts.medium },

  // Info Cards
  row: { flexDirection: 'row', marginBottom: spacing.md, gap: 10 },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  infoValue: { fontSize: 22, fontFamily: fonts.bold, color: colors.text },
  infoLabel: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.medium },

  // Alert
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#fff7ed', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: '#fed7aa', marginBottom: spacing.md },
  alertText: { fontSize: 13, color: '#ea580c', fontFamily: fonts.medium, flex: 1 },

  // Orders
  orderList: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, overflow: 'hidden' },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  orderMeta: { flex: 1 },
  orderNum: { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  orderCustomer: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderAmount: { fontSize: 14, fontFamily: fonts.bold, color: colors.primary },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontFamily: fonts.bold },
});
