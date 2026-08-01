import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '@/api';
import { InnerHeader } from '@/components/InnerHeader';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function DevicesScreen() {
  const queryClient = useQueryClient();
  const { data: sessions, isLoading } = useQuery({ 
    queryKey: ['sessions'], 
    queryFn: authApi.getSessions 
  });

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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <InnerHeader title="Logged in Devices" showBack showSearch={false} showCart={false} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.content}>
        <Text style={styles.infoText}>
          These are the devices that currently have access to your account. You can remotely log out any device you don't recognize.
        </Text>
        
        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={sessions || []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No active sessions found.</Text>}
            renderItem={({ item, index }) => {
              const isCurrent = index === 0; // The most recent session is usually the current one
              return (
                <View style={styles.card}>
                  <View style={styles.iconBox}>
                    <Feather name={item.osVersion?.toLowerCase().includes('windows') || item.osVersion?.toLowerCase().includes('mac') ? "monitor" : "smartphone"} size={24} color={isCurrent ? colors.primary : colors.textMuted} />
                  </View>
                  <View style={styles.details}>
                    <Text style={styles.deviceName}>
                      {item.deviceModel || item.deviceName || 'Unknown Device'} {isCurrent && <Text style={styles.currentBadge}>(Current)</Text>}
                    </Text>
                    <Text style={styles.meta}>
                      {item.osVersion ? `OS: ${item.osVersion} | ` : ''}IP: {item.ipAddress || 'Unknown'}
                    </Text>
                    <Text style={styles.meta}>
                      Started: {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {!isCurrent && (
                    <Pressable 
                      style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
                      onPress={() => handleRevoke(item.id, isCurrent)}
                    >
                      <Feather name="log-out" size={18} color="#dc2626" />
                    </Pressable>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>
          </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#dcfce7' },
  content: { flex: 1 },
  infoText: {
    padding: spacing.md,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  currentBadge: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  logoutBtn: {
    padding: spacing.sm,
    backgroundColor: '#fee2e2',
    borderRadius: radius.md,
  },
  logoutBtnPressed: {
    opacity: 0.7,
  }
});
