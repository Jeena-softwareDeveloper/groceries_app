import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchNotifications, markNotificationRead } from '@/api/customer';
import { Header } from '@/components/Header';
import { colors, radius, spacing } from '@/constants/theme';

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications });

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Notifications" showBack />
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
  unread: { borderColor: colors.primary, backgroundColor: '#f0fdf4' },
  title: { fontWeight: '700', color: colors.text },
  body: { color: colors.textMuted, marginTop: 4, fontSize: 14 },
});
