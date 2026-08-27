import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Alert, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi } from '@/api';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import { persistAuth, wipeAuth } from '@/hooks/useBootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuth, setTokens, setUser } from '@/store/authSlice';
import { setShowLocationModal } from '@/store/locationSlice';
import { vendorRequestApi } from '@/api/vendor-request.api';
import { useQuery } from '@tanstack/react-query';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, refreshToken, accessToken } = useAppSelector((s) => s.auth);
  const isLoggedIn = !!accessToken;
  const { districtName, areaName, displayName } = useAppSelector((s) => s.location);

  const { data: vendorRequest } = useQuery({
    queryKey: ['vendorRequest', user?.id],
    queryFn: vendorRequestApi.getMyRequest,
    retry: false,
    enabled: !!accessToken,
  });

  const [isSwitching, setIsSwitching] = useState(false);

  async function handleSwitchToVendor() {
    if (isSwitching) return;
    setIsSwitching(true);
    try {
      const tokens = await authApi.switchToVendor();
      await persistAuth(tokens.accessToken, tokens.refreshToken);
      dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
      const me = await authApi.getMe();
      dispatch(setUser(me));
      router.replace('/(vendor)');
    } catch (e: any) {
      alert(`Failed to switch to Vendor Mode: ${e?.message || String(e)}`);
    } finally {
      setIsSwitching(false);
    }
  }

  async function doLogout() {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {}
    await wipeAuth();
    dispatch(clearAuth());
    router.replace('/(tabs)');
  }

  function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) doLogout();
    } else {
      Alert.alert('Confirm Logout', 'Are you sure you want to log out of your account?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout },
      ]);
    }
  }

  function handleChangeLocation() {
    dispatch(setShowLocationModal(true));
  }

  // ── Not logged in ──
  if (!accessToken) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" backgroundColor="#16a34a" translucent={false} />
        <LinearGradient colors={['#16a34a', '#15803d', '#14532d']} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Feather name="user" size={44} color="#fff" />
            </View>
            <Text style={{ fontSize: 24, fontFamily: fonts.bold, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Welcome!</Text>
            <Text style={{ fontSize: 15, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
              Login to view your orders, wishlist, and manage your profile.
            </Text>
            <Pressable
              style={{ backgroundColor: '#fff', paddingHorizontal: 36, paddingVertical: 14, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', gap: 8 }}
              onPress={() => router.push('/(auth)/login')}
            >
              <Feather name="log-in" size={18} color="#16a34a" />
              <Text style={{ color: '#16a34a', fontFamily: fonts.bold, fontSize: 16 }}>Login / Sign Up</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const initials = (user?.name ?? 'U').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" backgroundColor="#16a34a" translucent={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <LinearGradient colors={['#16a34a', '#15803d', '#14532d']} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={{ position: 'absolute', top: 12, right: 20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <View style={{ position: 'absolute', top: -16, right: 60, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)' }} />
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
              <View style={styles.activeDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: '#fff', marginBottom: 2 }} numberOfLines={1}>
                {user?.name ?? 'All Time Market User'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="check-circle" size={13} color="#86efac" />
                <Text style={{ fontSize: 12, fontFamily: fonts.medium, color: '#86efac' }}>Verified Customer</Text>
              </View>
              <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                {user?.phone || user?.email || ''}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>₹0</Text>
              <Text style={styles.statLabel}>Wallet</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Vendor Status Card ── */}
        {(() => {
          if (vendorRequest?.status === 'APPROVED') {
            return (
              <Pressable style={[styles.vendorCard, { borderColor: '#86efac' }]} onPress={handleSwitchToVendor}>
                <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.vendorGradient}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="home" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: '#14532d' }}>My Store is Live! 🎉</Text>
                      <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: '#166534', marginTop: 2 }}>Tap to manage products, orders & earnings</Text>
                    </View>
                    {isSwitching ? <ActivityIndicator size="small" color="#16a34a" /> : <Feather name="chevron-right" size={20} color="#16a34a" />}
                  </View>
                </LinearGradient>
              </Pressable>
            );
          }
          if (vendorRequest?.status === 'PENDING') {
            return (
              <Pressable style={[styles.vendorCard, { borderColor: '#fde68a' }]} onPress={() => router.push('/vendor-request')}>
                <LinearGradient colors={['#fffbeb', '#fef3c7']} style={styles.vendorGradient}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="clock" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: '#78350f' }}>Application Under Review ⏳</Text>
                      <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: '#92400e', marginTop: 2 }}>We'll notify you once it's approved</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#f59e0b" />
                  </View>
                </LinearGradient>
              </Pressable>
            );
          }
          if (vendorRequest?.status === 'REJECTED') {
            return (
              <Pressable style={[styles.vendorCard, { borderColor: '#fca5a5' }]} onPress={() => router.push('/vendor-request')}>
                <LinearGradient colors={['#fff1f2', '#fee2e2']} style={styles.vendorGradient}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="alert-circle" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: '#7f1d1d' }}>Application Rejected</Text>
                      <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: '#991b1b', marginTop: 2 }}>Tap to review remarks and re-apply</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#ef4444" />
                  </View>
                </LinearGradient>
              </Pressable>
            );
          }
          return (
            <Pressable style={[styles.vendorCard, { borderColor: '#a7f3d0' }]} onPress={() => router.push('/vendor-request')}>
              <LinearGradient colors={['#ecfdf5', '#d1fae5']} style={styles.vendorGradient}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="briefcase" size={24} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: '#064e3b' }}>
                      {vendorRequest?.status === 'DRAFT' ? 'Continue Application 📝' : 'Become a Vendor 🚀'}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: '#065f46', marginTop: 2 }}>
                      {vendorRequest?.status === 'DRAFT' ? 'Your draft is saved — complete to submit' : 'Start selling products on All Time Market'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#10b981" />
                </View>
              </LinearGradient>
            </Pressable>
          );
        })()}

        {/* ── Main Menu ── */}
        <View style={styles.menuCard}>
          <MenuItem icon="user" title="Account Info" subtitle="Manage your personal details" onPress={() => router.push('/account')} />
          <MenuItem icon="map-pin" title="Delivery Location" subtitle={areaName && districtName ? `${areaName}, ${districtName}` : displayName || 'Select your location'} onPress={handleChangeLocation} />
          <MenuItem icon="shopping-bag" title="My Orders" subtitle="Track your current and past orders" onPress={() => router.push('/(tabs)/orders')} />
          <MenuItem icon="heart" title="Wishlist" subtitle="View your saved items" onPress={() => router.push('/wishlist')} />
          <MenuItem icon="credit-card" title="Wallet" subtitle="Manage your balance & transactions" onPress={() => router.push('/wallet')} last />
        </View>

        {/* ── Support & Settings ── */}
        <View style={styles.menuCard}>
          <MenuItem icon="bell" title="Notifications" subtitle="Stay updated with orders & offers" onPress={() => router.push('/notifications')} />
          <MenuItem icon="headphones" title="Help & Support" subtitle="Get help & contact support" onPress={() => router.push('/support')} />
          {isLoggedIn && (
            <MenuItem icon="smartphone" title="Active Devices" subtitle="Manage your logged in devices" onPress={() => router.push('/devices')} last />
          )}
        </View>

        {/* ── Logout ── */}
        {isLoggedIn && (
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Feather name="log-out" size={18} color="#dc2626" />
            <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: '#dc2626' }}>Log Out</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── MenuItem ────────────────────────────────────────────────────────────────

function MenuItem({ icon, title, subtitle, onPress, last, loading }: {
  icon: string; title: string; subtitle: string; onPress: () => void; last?: boolean; loading?: boolean;
}) {
  return (
    <Pressable style={[styles.menuRow, !last && styles.menuDivider]} onPress={onPress} disabled={loading}>
      <View style={styles.iconSquare}>
        <Feather name={icon as any} size={19} color="#16a34a" />
      </View>
      <View style={styles.rowTextCol}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSub} numberOfLines={1}>{subtitle}</Text>
      </View>
      {loading ? <ActivityIndicator size="small" color="#16a34a" /> : <Feather name="chevron-right" size={18} color={colors.textMuted} />}
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 120 },

  headerGradient: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: 20,
  },

  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    position: 'relative',
  },
  avatarInitials: { fontSize: 22, fontFamily: fonts.bold, color: '#fff' },
  activeDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#86efac',
    borderWidth: 2, borderColor: '#15803d',
  },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.lg, padding: spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontFamily: fonts.bold, color: '#fff' },
  statLabel: { fontSize: 11, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

  vendorCard: {
    marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.xl, borderWidth: 1.5, overflow: 'hidden',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6,
  },
  vendorGradient: { padding: spacing.md },

  menuCard: {
    backgroundColor: '#fff', marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.xl, borderWidth: 1, borderColor: '#f1f5f9',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
    overflow: 'hidden',
  },

  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  iconSquare: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center',
  },
  rowTextCol: { flex: 1 },
  menuTitle: { fontSize: 14, fontFamily: fonts.bold, color: '#1e293b' },
  menuSub: { fontSize: 12, color: colors.textMuted, marginTop: 1, fontFamily: fonts.regular },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: spacing.md, marginTop: spacing.md,
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: radius.xl, paddingVertical: 14,
  },
});
