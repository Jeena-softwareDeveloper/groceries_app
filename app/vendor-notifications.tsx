import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vendorApi } from '@/api/vendor.api';
import { Header } from '@/components/Header';
import { colors, radius, spacing, fonts } from '@/constants/theme';

export default function VendorNotificationsScreen() {
  const queryClient = useQueryClient();
  const { data: res, isLoading } = useQuery({ queryKey: ['vendor-notifications'], queryFn: () => vendorApi.listNotifications() });
  
  const data = res?.data || [];

  const readMutation = useMutation({
    mutationFn: vendorApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
    },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Notifications" showBack showSearch={false} showCart={false} />
      {isLoading ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : data.length === 0 ? (
        <Text style={styles.empty}>No notifications yet</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, !item.isRead && styles.unread]}
              onPress={() => !item.isRead && readMutation.mutate(item.id)}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unread: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '30',
  },
  title: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text, marginBottom: spacing.xs },
  body: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
});
