import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationApi } from '@/api';
import { InnerHeader } from '@/components/InnerHeader';
import { colors, radius, spacing , fonts} from '@/constants/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setShowLoginModal } from '@/store/authSlice';

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { accessToken } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const { data = [], isLoading } = useQuery({ queryKey: ['notifications'], queryFn: notificationApi.fetchNotifications, enabled: !!accessToken });

  if (!accessToken) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <InnerHeader title="Notifications" showBack showSearch={false} showCart={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 16, color: colors.textMuted, textAlign: 'center' }}>Please sign in to view this page</Text>
        </View>
      </SafeAreaView>
    );
  }

  const readMutation = useMutation({
    mutationFn: notificationApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <InnerHeader title="Notifications" showBack showSearch={false} showCart={false} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
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
          </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#dcfce7' },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unread: { borderColor: colors.primary, backgroundColor: '#f0fdf4' },
  title: { fontFamily: fonts.bold, color: colors.text },
  body: { color: colors.textMuted, marginTop: 4, fontSize: 14 },
});
