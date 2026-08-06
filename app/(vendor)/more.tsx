import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/Input';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { authApi } from '@/api';
import { vendorApi } from '@/api/vendor.api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTokens, setUser } from '@/store/authSlice';
import { wipeAuth, persistAuth } from '@/hooks/useBootstrap';
import Toast from 'react-native-toast-message';

// ─── Modals ───────────────────────────────────────────────────────────────────

function ProfileModal({ visible, onClose, profile }: { visible: boolean; onClose: () => void; profile: any }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shopName: profile?.shopName ?? '',
    description: profile?.description ?? '',
    phone: profile?.phone ?? '',
    address: profile?.address ?? '',
  });

  React.useEffect(() => {
    if (visible && profile) {
      setForm({
        shopName: profile?.shopName ?? '',
        description: profile?.description ?? '',
        phone: profile?.phone ?? '',
        address: profile?.address ?? '',
      });
    }
  }, [profile, visible]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await vendorApi.updateProfile(form);
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully' });
      onClose();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message ?? 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={modalStyles.safe} edges={['top', 'bottom']}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Store Profile</Text>
          <Pressable onPress={onClose} style={modalStyles.closeBtn}>
            <Feather name="x" size={22} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView style={modalStyles.body}>
          <Input label="Shop Name" value={form.shopName} onChangeText={(t) => setForm(f => ({ ...f, shopName: t }))} />
          <Input label="Phone Number" value={form.phone} onChangeText={(t) => setForm(f => ({ ...f, phone: t }))} keyboardType="phone-pad" />
          <Input label="Shop Address" value={form.address} onChangeText={(t) => setForm(f => ({ ...f, address: t }))} multiline style={{ height: 60 }} />
          <Input label="Description" value={form.description} onChangeText={(t) => setForm(f => ({ ...f, description: t }))} multiline style={{ height: 80 }} />
        </ScrollView>
        <View style={modalStyles.footer}>
          <Button title="Save Changes" onPress={handleSave} loading={loading} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function SettingsModal({ visible, onClose, profile }: { visible: boolean; onClose: () => void; profile: any }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    isOpen: profile?.isOpen ?? false,
    minOrderValue: profile?.minOrderValue ? String(profile.minOrderValue) : '0',
    deliveryRadius: profile?.deliveryRadius ? String(profile.deliveryRadius) : '5',
    operatingHours: profile?.operatingHours ?? '09:00 AM - 09:00 PM',
  });

  React.useEffect(() => {
    if (visible && profile) {
      setForm({
        isOpen: profile?.isOpen ?? false,
        minOrderValue: profile?.minOrderValue ? String(profile.minOrderValue) : '0',
        deliveryRadius: profile?.deliveryRadius ? String(profile.deliveryRadius) : '5',
        operatingHours: profile?.operatingHours ?? '09:00 AM - 09:00 PM',
      });
    }
  }, [profile, visible]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await vendorApi.updateProfile({
        ...form,
        minOrderValue: Number(form.minOrderValue),
        deliveryRadius: Number(form.deliveryRadius),
      });
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Settings updated' });
      onClose();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message ?? 'Failed to update settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={modalStyles.safe} edges={['top', 'bottom']}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Store Settings</Text>
          <Pressable onPress={onClose} style={modalStyles.closeBtn}>
            <Feather name="x" size={22} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView style={modalStyles.body}>
          {/* Toggle IsOpen */}
          <View style={modalStyles.toggleRow}>
            <View>
              <Text style={modalStyles.toggleLabel}>Store is Open</Text>
              <Text style={modalStyles.toggleSub}>Accepting new orders</Text>
            </View>
            <Pressable
              style={[modalStyles.toggleBtn, form.isOpen && modalStyles.toggleBtnActive]}
              onPress={() => setForm(f => ({ ...f, isOpen: !f.isOpen }))}
            >
              <View style={[modalStyles.toggleKnob, form.isOpen && modalStyles.toggleKnobActive]} />
            </Pressable>
          </View>
          <Input label="Minimum Order Value (₹)" value={form.minOrderValue} onChangeText={(t) => setForm(f => ({ ...f, minOrderValue: t }))} keyboardType="numeric" />
          <Input label="Delivery Radius (km)" value={form.deliveryRadius} onChangeText={(t) => setForm(f => ({ ...f, deliveryRadius: t }))} keyboardType="numeric" />
          <Input label="Operating Hours" value={form.operatingHours} onChangeText={(t) => setForm(f => ({ ...f, operatingHours: t }))} />
        </ScrollView>
        <View style={modalStyles.footer}>
          <Button title="Save Settings" onPress={handleSave} loading={loading} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VendorMore() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [activeModal, setActiveModal] = useState<'profile' | 'settings' | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: vendorApi.getProfile,
  });

  async function handleSwitchToCustomer() {
    try {
      const tokens = await authApi.switchToCustomer();
      await persistAuth(tokens.accessToken, tokens.refreshToken);
      dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
      const me = await authApi.getMe();
      dispatch(setUser(me));
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to switch role', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to switch to Customer Mode' });
    }
  }

  async function handleLogout() {
    await wipeAuth();
    dispatch(setTokens({ accessToken: '', refreshToken: '' }));
    dispatch(setUser(null));
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Store Profile Header Card */}
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
                  {profile?.shopName ?? user?.shopName ?? 'My Shop'}
                </Text>
                <View style={[styles.openPill, { backgroundColor: profile?.isOpen ? '#dcfce7' : '#fee2e2' }]}>
                  <Text style={[styles.openPillText, { color: profile?.isOpen ? '#16a34a' : '#dc2626' }]}>
                    {profile?.isOpen ? 'Open' : 'Closed'}
                  </Text>
                </View>
              </View>
              <View style={styles.verifiedRow}>
                <View style={styles.verifiedPill}>
                  <Feather name="check-circle" size={12} color="#16a34a" />
                  <Text style={styles.verifiedText}>Verified Vendor</Text>
                </View>
              </View>
              <Text style={styles.ratingSub}>
                ⭐ {profile?.rating ? Number(profile.rating).toFixed(1) : '4.8'} • Min. Order ₹
                {profile?.minOrderValue ?? 0}
              </Text>
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
                <Text style={styles.rowSub}>{profile?.phone ?? user?.phone ?? '+91 —'}</Text>
              </View>
              <Pressable onPress={() => setActiveModal('profile')}>
                <Feather name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* Delivery & Operating Settings Card */}
          <View style={styles.card}>
            <View style={styles.cardIconRow}>
              <View style={styles.iconSquare}>
                <Feather name="map-pin" size={20} color="#16a34a" />
              </View>
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>Delivery settings</Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {profile?.deliveryRadius ? `${profile.deliveryRadius} km radius` : '5 km radius'} •{' '}
                  {profile?.operatingHours ?? '09:00 AM - 09:00 PM'}
                </Text>
              </View>
              <Pressable style={styles.changeLocBtn} onPress={() => setActiveModal('settings')}>
                <Text style={styles.changeLocText}>Change settings</Text>
              </Pressable>
            </View>
          </View>

          {/* Grouped Menu Card */}
          <View style={styles.card}>
            <MenuItem
              icon="user"
              title="Store Profile"
              subtitle="Update shop name, address & contact"
              onPress={() => setActiveModal('profile')}
            />
            <MenuItem
              icon="settings"
              title="Store Settings"
              subtitle="Manage store status, radius & min order"
              onPress={() => setActiveModal('settings')}
            />
            <MenuItem
              icon="tag"
              title="Offers & Discounts"
              subtitle="Create coupons & store promotions"
              onPress={() => Toast.show({ type: 'error', text1: 'Coming Soon', text2: 'Offers module is currently under development.' })}
            />
            <MenuItem
              icon="help-circle"
              title="Help & Support"
              subtitle="Contact All Time Market admin team"
              onPress={() => Toast.show({ type: 'error', text1: 'Support', text2: 'Contact admin at support@alltimemarket.com' })}
            />
            <MenuItem
              icon="shopping-bag"
              title="Switch to Customer Mode"
              subtitle="Browse products & shop as a customer"
              onPress={handleSwitchToCustomer}
              last
            />
          </View>

          {/* Log Out Card */}
          <Pressable style={styles.logoutCard} onPress={handleLogout}>
            <View style={styles.cardIconRow}>
              <View style={styles.logoutIconSquare}>
                <Feather name="log-out" size={20} color="#dc2626" />
              </View>
              <View style={styles.rowTextCol}>
                <Text style={styles.logoutTitle}>Log out</Text>
                <Text style={styles.logoutSub}>Securely log out from your vendor account</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#dc2626" />
            </View>
          </Pressable>
        </ScrollView>
      )}

      {/* Modals */}
      <ProfileModal visible={activeModal === 'profile'} onClose={() => setActiveModal(null)} profile={profile} />
      <SettingsModal visible={activeModal === 'settings'} onClose={() => setActiveModal(null)} profile={profile} />
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
  openPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full },
  openPillText: { fontSize: 12, fontFamily: fonts.bold },
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

const modalStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: spacing.md },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  toggleLabel: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  toggleSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  toggleBtn: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#d1d5db', padding: 2 },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  toggleKnobActive: { transform: [{ translateX: 20 }] },
});
