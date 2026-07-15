import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { authApi } from '@/api';
import { Header } from '@/components/Header';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import { persistAuth, wipeAuth } from '@/hooks/useBootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuth, setTokens, setUser } from '@/store/authSlice';
import { vendorRequestApi } from '@/api/vendor-request.api';
import { useQuery } from '@tanstack/react-query';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, refreshToken, accessToken } = useAppSelector((s) => s.auth);
  const { districtName, areaName } = useAppSelector((s) => s.location);

  const { data: vendorRequest } = useQuery({
    queryKey: ['vendorRequest', user?.id],
    queryFn: vendorRequestApi.getMyRequest,
    retry: false,
  });

  const isVendorApproved = vendorRequest?.status === 'APPROVED';

  async function handleSwitchToVendor() {
    try {
      const tokens = await authApi.switchToVendor();
      await persistAuth(tokens.accessToken, tokens.refreshToken);
      dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
      const me = await authApi.getMe();
      dispatch(setUser(me));
      router.replace('/(vendor)');
    } catch (e) {
      alert('Failed to switch to Vendor Mode');
    }
  }

  async function handleLogout() {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {}
    await wipeAuth();
    dispatch(clearAuth());
    router.replace('/(auth)/login');
  }

  function handleChangeLocation() {
    router.push('/location');
  }

  const isLoggedIn = !!(accessToken && user);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header showCart />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          <View style={styles.guestCard}>
            <View style={styles.guestIconCircle}>
              <Feather name="user-check" size={28} color={colors.primary} />
            </View>
            <Text style={styles.guestTitle}>Welcome to DistrictMart</Text>
            <Text style={styles.guestSub}>
              Log in to access your wishlist, wallet, orders, and manage your store.
            </Text>
            <Pressable style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginBtnText}>Log in / Sign up</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <>
            {/* User Info Header Card */}
            <View style={styles.profileHeaderCard}>
              <View style={styles.avatarBox}>
                <Feather name="home" size={28} color="#16a34a" />
                <View style={styles.checkBadge}>
                  <Feather name="check" size={10} color="#fff" />
                </View>
              </View>
              <View style={styles.profileMeta}>
                <View style={styles.topTitleRow}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name ?? 'DistrictMart User'}
                  </Text>
                  <View style={styles.openPill}>
                    <Text style={styles.openPillText}>Active</Text>
                  </View>
                </View>
                <View style={styles.verifiedRow}>
                  <View style={styles.verifiedPill}>
                    <Feather name="check-circle" size={12} color="#16a34a" />
                    <Text style={styles.verifiedText}>Verified Customer</Text>
                  </View>
                </View>
                <Text style={styles.ratingSub}>⭐ 4.8 • DistrictMart Member</Text>
              </View>
            </View>

            {/* Phone Card */}
            <View style={styles.card}>
              <View style={styles.cardIconRow}>
                <View style={styles.iconSquare}>
                  <Feather name="phone" size={20} color="#16a34a" />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTitle}>Phone</Text>
                  <Text style={styles.rowSub}>{user?.phone ?? '+91 —'}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textMuted} />
              </View>
            </View>
          </>
        )}

        {/* Delivery Location Card */}
        <View style={styles.card}>
          <View style={styles.cardIconRow}>
            <View style={styles.iconSquare}>
              <Feather name="map-pin" size={20} color="#16a34a" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Delivery location</Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {areaName && districtName ? `${areaName}, ${districtName}` : 'Select your location'}
              </Text>
            </View>
            <Pressable style={styles.changeLocBtn} onPress={handleChangeLocation}>
              <Text style={styles.changeLocText}>Change location</Text>
            </Pressable>
          </View>
        </View>

        {/* Grouped Menu Card */}
        <View style={styles.card}>
          <MenuItem
            icon="heart"
            title="Wishlist"
            subtitle="View your saved items"
            onPress={() => router.push('/wishlist')}
          />
          <MenuItem
            icon="bell"
            title="Notifications"
            subtitle="Stay updated with orders & offers"
            onPress={() => router.push('/notifications')}
          />
          <MenuItem
            icon="credit-card"
            title="Wallet"
            subtitle="Manage your balance & transactions"
            onPress={() => router.push('/wallet')}
          />
          <MenuItem
            icon="headphones"
            title="Help & Support"
            subtitle="Get help & contact support"
            onPress={() => router.push('/support')}
            last={!isVendorApproved && !isLoggedIn}
          />
          {isLoggedIn && (
            isVendorApproved ? (
              <MenuItem
                icon="home"
                title="Open Vendor Portal"
                subtitle="Manage your store, products & orders"
                onPress={handleSwitchToVendor}
                last
              />
            ) : (
              <MenuItem
                icon="briefcase"
                title="Join as Vendor"
                subtitle="Start selling products on DistrictMart"
                onPress={() => router.push('/vendor-request')}
                last
              />
            )
          )}
        </View>

        {/* Log Out Button Card */}
        {isLoggedIn && (
          <Pressable style={styles.logoutCard} onPress={handleLogout}>
            <View style={styles.cardIconRow}>
              <View style={styles.logoutIconSquare}>
                <Feather name="log-out" size={20} color="#dc2626" />
              </View>
              <View style={styles.rowTextCol}>
                <Text style={styles.logoutTitle}>Log out</Text>
                <Text style={styles.logoutSub}>Securely log out from your account</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#dc2626" />
            </View>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Menu Item Component ──────────────────────────────────────────────────────

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  last,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.menuRow, !last && styles.menuDivider]} onPress={onPress}>
      <View style={styles.iconSquare}>
        <Feather name={icon as any} size={20} color="#16a34a" />
      </View>
      <View style={styles.rowTextCol}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSub}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: spacing.md, paddingBottom: 120, gap: 14 },

  guestCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  guestIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  guestTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.text, marginBottom: 6 },
  guestSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  loginBtnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },

  profileHeaderCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  avatarBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    marginRight: spacing.md,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileMeta: { flex: 1 },
  topTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userName: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, flex: 1, marginRight: 8 },
  openPill: { backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full },
  openPillText: { fontSize: 12, fontFamily: fonts.bold, color: '#16a34a' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 4 },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  verifiedText: { fontSize: 11, fontFamily: fonts.bold, color: '#16a34a' },
  ratingSub: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.medium },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextCol: { flex: 1 },
  rowTitle: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.medium },
  rowSub: { fontSize: 15, fontFamily: fonts.bold, color: colors.text, marginTop: 2 },

  changeLocBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  changeLocText: { fontSize: 12, fontFamily: fonts.bold, color: '#16a34a' },

  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  menuSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontFamily: fonts.regular },

  logoutCard: {
    backgroundColor: '#fef2f2',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTitle: { fontSize: 15, fontFamily: fonts.bold, color: '#dc2626' },
  logoutSub: { fontSize: 12, color: '#7f1d1d', marginTop: 2, fontFamily: fonts.medium },
});
