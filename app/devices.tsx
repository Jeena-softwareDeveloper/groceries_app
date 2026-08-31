import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { LoadingState } from '@/components/ui/LoadingState';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '@/api';
import { PageHeader } from '@/components/PageHeader';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setShowLoginModal } from '@/store/authSlice';

export default function DevicesScreen() {
  const queryClient = useQueryClient();
  const { accessToken } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const { data: sessions, isLoading } = useQuery({ 
    queryKey: ['sessions'], 
    queryFn: authApi.getSessions,
    enabled: !!accessToken,
  });

  if (!accessToken) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <PageHeader title="Devices" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 16, color: colors.textMuted, textAlign: 'center' }}>Please sign in to view this page</Text>
        </View>
      </SafeAreaView>
    );
  }

  const revokeMutation = useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to log out device.' });
    }
  });

  const handleRevoke = (id: string, isCurrentDevice: boolean) => {
    if (isCurrentDevice) {
      Toast.show({ type: 'error', text1: 'Cannot remove', text2: 'This is your current device. Please use the main Log out button instead.' });
      return;
    }
    Alert.alert(
      'Log Out Device',
      'Are you sure you want to log out from this device? It will require an OTP to access the app from there again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => revokeMutation.mutate(id) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <PageHeader title="Logged in Devices" showBack />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.content}>
        <Text style={styles.infoText}>
          These are the devices that currently have access to your account. You can remotely log out any device you don't recognize.
        </Text>
        
        {isLoading ? (
          <LoadingState fullScreen={false} />
        ) : (
          <FlatList
            data={sessions || []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No other devices found.</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.iconBox}>
                  <Feather name={item.deviceType === 'ios' || item.deviceType === 'android' ? 'smartphone' : 'monitor'} size={24} color={colors.primary} />
                </View>
                <View style={styles.details}>
                  <Text style={styles.deviceName}>
                    {item.deviceModel || item.deviceType || 'Unknown Device'}
                  </Text>
                  {item.isCurrentDevice ? (
                    <Text style={styles.currentBadge}>Current Device</Text>
                  ) : (
                    <Text style={styles.meta}>Last active: {new Date(item.lastActiveAt).toLocaleDateString()}</Text>
                  )}
                  {item.ipAddress && <Text style={styles.meta}>IP: {item.ipAddress}</Text>}
                </View>
                {!item.isCurrentDevice && (
                  <Pressable 
                    style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
                    onPress={() => handleRevoke(item.id, item.isCurrentDevice)}
                  >
                    <Feather name="log-out" size={16} color="#ef4444" />
                  </Pressable>
                )}
              </View>
            )}
          />
        )}
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { flex: 1, paddingVertical: spacing.md, gap: spacing.md },
  infoText: {
    marginHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    fontFamily: fonts.medium,
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { gap: spacing.sm },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  card: {
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  details: { flex: 1 },
  deviceName: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 4 },
  currentBadge: { color: colors.primary, fontSize: 12, fontFamily: fonts.bold },
  meta: { fontSize: 12, color: colors.textMuted },
  logoutBtn: { padding: spacing.sm, backgroundColor: '#fee2e2', borderRadius: radius.md },
  logoutBtnPressed: { opacity: 0.7 }
});
