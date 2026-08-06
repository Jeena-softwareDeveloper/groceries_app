import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { vendorApi } from '@/api/vendor.api';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function VendorNotificationsScreen() {
  const queryClient = useQueryClient();

  const { data: res, isLoading } = useQuery({
    queryKey: ['vendor-notifications'],
    queryFn: () => vendorApi.listNotifications(),
  });

  const notifications = res?.data || [];

  const readMutation = useMutation({
    mutationFn: vendorApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: vendorApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      Toast.show({ type: 'success', text1: 'Cleared', text2: 'All notifications marked as read' });
    },
  });

  return (
    <View style={s.root}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerRight: () =>
            notifications.length > 0 && notifications.some((n: any) => !n.isRead) ? (
              <Pressable
                onPress={() => clearAllMutation.mutate()}
                style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }, s.clearBtn]}
              >
                <Text style={s.clearBtnText}>Clear All</Text>
              </Pressable>
            ) : null,
        }}
      />

      {isLoading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={s.centered}>
          <Ionicons name="notifications-off-outline" size={56} color="#d1d5db" />
          <Text style={s.emptyTitle}>No Notifications</Text>
          <Text style={s.emptySub}>You're all caught up!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, gap: 10 }}
          renderItem={({ item }) => (
            <Pressable
              style={[s.card, !item.isRead && s.unread]}
              onPress={() => !item.isRead && readMutation.mutate(item.id)}
            >
              <View style={s.cardLeft}>
                <View style={[s.dot, !item.isRead && s.dotActive]} />
              </View>
              <View style={s.cardBody}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardBody2}>{item.body}</Text>
              </View>
              {!item.isRead && (
                <View style={s.newBadge}>
                  <Text style={s.newBadgeText}>New</Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f7fb' },
  clearBtn: { marginRight: 16 },
  clearBtnText: { color: colors.primary, fontFamily: fonts.semiBold, fontSize: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontSize: 17, fontFamily: fonts.bold, color: '#374151' },
  emptySub: { fontSize: 14, fontFamily: fonts.regular, color: '#9ca3af' },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
  },
  unread: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
  cardLeft: { paddingTop: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d1d5db' },
  dotActive: { backgroundColor: colors.primary },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15, color: '#111', marginBottom: 4, lineHeight: 20 },
  cardBody2: { fontFamily: fonts.regular, fontSize: 13, color: '#6b7280', lineHeight: 19 },
  newBadge: { backgroundColor: colors.primary, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  newBadgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.bold },
});
