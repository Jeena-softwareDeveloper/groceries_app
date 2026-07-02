import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout as apiLogout } from '@/api/auth';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { colors, radius, spacing } from '@/constants/theme';
import { wipeAuth } from '@/hooks/useBootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuth } from '@/store/authSlice';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, refreshToken } = useAppSelector((s) => s.auth);
  const { districtName, areaName } = useAppSelector((s) => s.location);

  async function handleLogout() {
    try {
      if (refreshToken) await apiLogout(refreshToken);
    } catch {
      // ignore logout API errors
    }
    await wipeAuth();
    dispatch(clearAuth());
    router.replace('/(auth)/login');
  }

  async function handleChangeLocation() {
    router.push('/location');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header showCart />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{user?.phone ?? '—'}</Text>
          {user?.name ? (
            <>
              <Text style={[styles.label, { marginTop: spacing.md }]}>Name</Text>
              <Text style={styles.value}>{user.name}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Delivery location</Text>
          <Text style={styles.value}>
            {areaName && districtName ? `${areaName}, ${districtName}` : 'Not set'}
          </Text>
          <Button
            title="Change location"
            variant="secondary"
            onPress={handleChangeLocation}
            style={{ marginTop: spacing.md }}
          />
        </View>

        <View style={styles.card}>
          <MenuLink label="Wishlist" onPress={() => router.push('/wishlist')} />
          <MenuLink label="Notifications" onPress={() => router.push('/notifications')} />
          <MenuLink label="Wallet" onPress={() => router.push('/wallet')} />
          <MenuLink label="Help & Support" onPress={() => router.push('/support')} last />
        </View>

        <Button title="Log out" variant="ghost" onPress={handleLogout} style={{ marginTop: spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  value: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: 4 },
});

function MenuLink({ label, onPress, last }: { label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable style={[menuStyles.row, !last && menuStyles.border]} onPress={onPress}>
      <Text style={menuStyles.label}>{label}</Text>
      <Text style={menuStyles.chevron}>›</Text>
    </Pressable>
  );
}

const menuStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  border: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  chevron: { fontSize: 20, color: colors.textMuted },
});
