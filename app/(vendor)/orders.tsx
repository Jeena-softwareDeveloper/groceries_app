import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, ActivityIndicator, RefreshControl, Modal, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { vendorApi, type VendorOrder } from '@/api/vendor.api';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import Toast from 'react-native-toast-message';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'PLACED', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Accepted' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'OUT_FOR_DELIVERY', label: 'On Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const NEXT_STATUS: Record<string, { status: string; label: string; color: string }[]> = {
  PLACED: [
    { status: 'CONFIRMED', label: 'Accept Order', color: '#3b82f6' },
    { status: 'CANCELLED', label: 'Reject Order', color: '#dc2626' },
  ],
  CONFIRMED: [
    { status: 'PACKED', label: 'Mark Packed', color: '#8b5cf6' },
    { status: 'CANCELLED', label: 'Cancel', color: '#dc2626' },
  ],
  PACKED: [
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: '#06b6d4' },
  ],
  OUT_FOR_DELIVERY: [
    { status: 'DELIVERED', label: 'Mark Delivered', color: '#16a34a' },
    { status: 'RETURNED', label: 'Mark Returned', color: '#6b7280' },
  ],
};

function formatStatus(s: string) {
  const map: Record<string, string> = {
    PLACED: 'Pending', CONFIRMED: 'Accepted', PACKED: 'Packed',
    OUT_FOR_DELIVERY: 'On Delivery', DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled', RETURNED: 'Returned',
  };
  return map[s] ?? s;
}

function getStatusStyle(s: string): { bg: string; color: string } {
  const map: Record<string, { bg: string; color: string }> = {
    PLACED: { bg: '#fef3c7', color: '#92400e' },
    CONFIRMED: { bg: '#dbeafe', color: '#1e40af' },
    PACKED: { bg: '#ede9fe', color: '#5b21b6' },
    OUT_FOR_DELIVERY: { bg: '#cffafe', color: '#164e63' },
    DELIVERED: { bg: '#dcfce7', color: '#14532d' },
    CANCELLED: { bg: '#fee2e2', color: '#991b1b' },
    RETURNED: { bg: '#f3f4f6', color: '#374151' },
  };
  return map[s] ?? { bg: '#f3f4f6', color: '#374151' };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderDetailModal({ order, visible, onClose, onStatusUpdate }: {
  order: VendorOrder | null;
  visible: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: string) => void;
}) {
  if (!order) return null;
  const nextActions = NEXT_STATUS[order.status] ?? [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={modalStyles.safe} edges={['top', 'bottom']}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Order #{order.orderNumber}</Text>
          <Pressable onPress={onClose} style={modalStyles.closeBtn}>
            <Feather name="x" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView style={modalStyles.body}>
          {/* Status */}
          <View style={modalStyles.section}>
            <View style={[modalStyles.statusBadge, { backgroundColor: getStatusStyle(order.status).bg }]}>
              <Text style={[modalStyles.statusText, { color: getStatusStyle(order.status).color }]}>
                {formatStatus(order.status)}
              </Text>
            </View>
            <Text style={modalStyles.timeText}>{timeAgo(order.createdAt)}</Text>
          </View>

          {/* Customer */}
          <View style={modalStyles.card}>
            <Text style={modalStyles.cardLabel}>Customer</Text>
            <Text style={modalStyles.cardValue}>{order.customer?.name ?? 'N/A'}</Text>
            <Text style={modalStyles.cardSub}>{order.customer?.phone}</Text>
          </View>

          {/* Delivery Address */}
          {order.address && (
            <View style={modalStyles.card}>
              <Text style={modalStyles.cardLabel}>Delivery Address</Text>
              <Text style={modalStyles.cardValue}>{order.address.line1}</Text>
              <Text style={modalStyles.cardSub}>{order.address.city} — {order.address.pincode}</Text>
            </View>
          )}

          {/* Items */}
          <View style={modalStyles.card}>
            <Text style={modalStyles.cardLabel}>Items ({order.items?.length ?? 0})</Text>
            {order.items?.map((item) => (
              <View key={item.id} style={modalStyles.itemRow}>
                <Text style={modalStyles.itemName}>{item.name}</Text>
                <Text style={modalStyles.itemQty}>×{item.quantity}</Text>
                <Text style={modalStyles.itemPrice}>₹{Number(item.total).toFixed(0)}</Text>
              </View>
            ))}
          </View>

          {/* Price Breakdown */}
          <View style={modalStyles.card}>
            <Text style={modalStyles.cardLabel}>Price Breakdown</Text>
            <View style={modalStyles.priceRow}>
              <Text style={modalStyles.priceLabel}>Subtotal</Text>
              <Text style={modalStyles.priceVal}>₹{Number(order.subtotal).toFixed(2)}</Text>
            </View>
            {Number(order.discount) > 0 && (
              <View style={modalStyles.priceRow}>
                <Text style={[modalStyles.priceLabel, { color: '#16a34a' }]}>Discount</Text>
                <Text style={[modalStyles.priceVal, { color: '#16a34a' }]}>-₹{Number(order.discount).toFixed(2)}</Text>
              </View>
            )}
            <View style={modalStyles.priceRow}>
              <Text style={modalStyles.priceLabel}>Delivery</Text>
              <Text style={modalStyles.priceVal}>₹{Number(order.deliveryCharge).toFixed(2)}</Text>
            </View>
            <View style={[modalStyles.priceRow, modalStyles.totalRow]}>
              <Text style={modalStyles.totalLabel}>Grand Total</Text>
              <Text style={modalStyles.totalVal}>₹{Number(order.grandTotal).toFixed(2)}</Text>
            </View>
          </View>

          {/* Notes */}
          {order.notes && (
            <View style={modalStyles.card}>
              <Text style={modalStyles.cardLabel}>Customer Notes</Text>
              <Text style={modalStyles.cardValue}>{order.notes}</Text>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        {nextActions.length > 0 && (
          <View style={modalStyles.actions}>
            {nextActions.map((action) => (
              <Pressable
                key={action.status}
                style={[modalStyles.actionBtn, { backgroundColor: action.color }]}
                onPress={() => {
                  onStatusUpdate(order.id, action.status);
                  onClose();
                }}
              >
                <Text style={modalStyles.actionText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onPress,
  onQuickAction,
}: {
  order: VendorOrder;
  onPress: () => void;
  onQuickAction: (id: string, status: string) => void;
}) {
  const st = getStatusStyle(order.status);
  const itemsText = order.items?.map((i) => `${i.name} ×${i.quantity}`).join(', ') ?? '';
  const nextActions = NEXT_STATUS[order.status] ?? [];

  return (
    <Pressable style={cardStyles.card} onPress={onPress}>
      <View style={cardStyles.topRow}>
        <View style={cardStyles.orderNumBox}>
          <Text style={cardStyles.orderNum}>#{order.orderNumber}</Text>
          <Text style={cardStyles.time}>{timeAgo(order.createdAt)}</Text>
        </View>
        <View style={[cardStyles.badge, { backgroundColor: st.bg }]}>
          <Text style={[cardStyles.badgeText, { color: st.color }]}>{formatStatus(order.status)}</Text>
        </View>
      </View>

      <View style={cardStyles.divider} />

      <View style={cardStyles.customerRow}>
        <View style={cardStyles.customerIcon}>
          <Feather name="user" size={14} color={colors.textMuted} />
        </View>
        <View style={cardStyles.customerInfo}>
          <Text style={cardStyles.customerName}>
            {order.customer?.name ?? order.customer?.phone ?? 'Customer'}
          </Text>
          {order.address?.city ? (
            <Text style={cardStyles.customerLoc} numberOfLines={1}>
              {order.address.line1}, {order.address.city}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={cardStyles.itemsBox}>
        <Feather name="shopping-bag" size={13} color={colors.textMuted} style={{ marginTop: 2 }} />
        <Text style={cardStyles.itemsText} numberOfLines={2}>
          {itemsText || 'No items listed'}
        </Text>
      </View>

      <View style={cardStyles.footerRow}>
        <View>
          <Text style={cardStyles.totalLabel}>Total Amount</Text>
          <Text style={cardStyles.amount}>₹{Number(order.grandTotal).toFixed(0)}</Text>
        </View>

        {nextActions.length > 0 ? (
          <View style={cardStyles.quickActions}>
            {nextActions.slice(0, 1).map((act) => (
              <Pressable
                key={act.status}
                style={[cardStyles.quickBtn, { backgroundColor: act.color }]}
                onPress={(e) => {
                  e.stopPropagation();
                  onQuickAction(order.id, act.status);
                }}
              >
                <Text style={cardStyles.quickBtnText}>{act.label}</Text>
                <Feather name="chevron-right" size={14} color="#fff" />
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={cardStyles.viewDetailsBtn}>
            <Text style={cardStyles.viewDetailsText}>Details</Text>
            <Feather name="arrow-right" size={14} color={colors.primary} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VendorOrders() {
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-orders', activeTab, search, page],
    queryFn: () => vendorApi.listOrders({ status: activeTab || undefined, search: search || undefined, page }),
    staleTime: 15000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      vendorApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.message ?? 'Failed to update order status' });
    },
  });

  const orders: VendorOrder[] = data?.data ?? [];
  const meta = data?.meta;

  const onRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Orders Management</Text>
          <Text style={styles.subTitle}>Track and fulfill customer orders</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{meta?.total ?? orders.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search order ID, customer name or phone..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setPage(1);
          }}
        />
        {search !== '' && (
          <Pressable onPress={() => setSearch('')} style={styles.clearBtn}>
            <Feather name="x" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {STATUS_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <Feather name="inbox" size={42} color={colors.primary} />
          </View>
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubText}>
            {search || activeTab
              ? 'No matching orders for your selected filter or search.'
              : 'You do not have any orders in your store yet.'}
          </Text>
          {(search !== '' || activeTab !== '') && (
            <Pressable
              style={styles.resetBtn}
              onPress={() => {
                setSearch('');
                setActiveTab('');
              }}
            >
              <Feather name="refresh-cw" size={14} color={colors.white} />
              <Text style={styles.resetBtnText}>Reset Filters</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => setSelectedOrder(item)}
              onQuickAction={(id, status) => updateMutation.mutate({ id, status })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          onEndReached={() => {
            if (meta && page * meta.limit < meta.total) setPage((p) => p + 1);
          }}
          onEndReachedThreshold={0.3}
        />
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        visible={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusUpdate={(id, status) => updateMutation.mutate({ id, status })}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  subTitle: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontFamily: fonts.regular },
  countBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  countText: { fontSize: 13, fontFamily: fonts.bold, color: '#0284c7' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: radius.xl,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, fontFamily: fonts.regular },
  clearBtn: { padding: 6 },
  tabsWrapper: {
    height: 56,
    maxHeight: 56,
    marginTop: 8,
    flexGrow: 0,
    flexShrink: 0,
  },
  tabsContainer: { flexGrow: 0, height: 56 },
  tabsContent: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: 8,
    height: 56,
  },
  tab: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, fontFamily: fonts.medium, color: '#64748b' },
  tabTextActive: { color: colors.white, fontFamily: fonts.bold },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  loadingText: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.medium, marginTop: 4 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  emptySubText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19, maxWidth: 260 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  resetBtnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNumBox: { flex: 1 },
  orderNum: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  time: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontSize: 12, fontFamily: fonts.bold },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: spacing.md },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  customerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 14, color: colors.text, fontFamily: fonts.bold },
  customerLoc: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  itemsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  itemsText: { flex: 1, fontSize: 13, color: '#334155', fontFamily: fonts.medium, lineHeight: 18 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.medium, textTransform: 'uppercase' },
  amount: { fontSize: 18, fontFamily: fonts.bold, color: colors.primary, marginTop: 2 },
  quickActions: { flexDirection: 'row', alignItems: 'center' },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  quickBtnText: { color: '#fff', fontFamily: fonts.bold, fontSize: 13 },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetailsText: { fontSize: 13, fontFamily: fonts.bold, color: colors.primary },
});

const modalStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, padding: spacing.lg },
  section: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.full },
  statusText: { fontSize: 13, fontFamily: fonts.bold },
  timeText: { fontSize: 13, color: colors.textMuted },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fonts.bold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  cardSub: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  itemName: { flex: 1, fontSize: 14, color: colors.text, fontFamily: fonts.medium },
  itemQty: { fontSize: 13, color: colors.textMuted, marginHorizontal: spacing.sm, fontFamily: fonts.bold },
  itemPrice: { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  priceLabel: { fontSize: 13, color: colors.textMuted },
  priceVal: { fontSize: 13, color: colors.text, fontFamily: fonts.medium },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 8, paddingTop: 10 },
  totalLabel: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  totalVal: { fontSize: 18, fontFamily: fonts.bold, color: colors.primary },
  actions: { padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionBtn: { paddingVertical: 14, borderRadius: radius.xl, alignItems: 'center' },
  actionText: { fontSize: 15, fontFamily: fonts.bold, color: colors.white },
});
