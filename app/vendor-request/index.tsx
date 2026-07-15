import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { vendorRequestApi, type VendorRequest, type VendorRequestStatus } from '@/api/vendor-request.api';
import { authApi } from '@/api';
import { persistAuth } from '@/hooks/useBootstrap';
import { useAppDispatch } from '@/store/hooks';
import { setTokens, setUser } from '@/store/authSlice';
import { colors, spacing, radius, fonts, typography } from '@/constants/theme';

const STATUS_CONFIG: Record<VendorRequestStatus, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  DRAFT: {
    label: 'Draft',
    color: '#6b7280',
    bg: '#f9fafb',
    icon: 'edit-3',
    desc: 'Your application is saved as a draft. Complete all steps and submit.',
  },
  PENDING: {
    label: 'Pending Approval',
    color: '#d97706',
    bg: '#fffbeb',
    icon: 'clock',
    desc: 'Your application has been submitted and is under review by our team.',
  },
  MORE_INFO_REQUIRED: {
    label: 'More Information Required',
    color: '#2563eb',
    bg: '#eff6ff',
    icon: 'info',
    desc: 'Our team needs more information. Please review the admin remarks and update your application.',
  },
  APPROVED: {
    label: 'Approved! 🎉',
    color: '#16a34a',
    bg: '#f0fdf4',
    icon: 'check-circle',
    desc: 'Congratulations! Your vendor account is active. You can now access the Vendor Panel.',
  },
  REJECTED: {
    label: 'Not Approved',
    color: '#dc2626',
    bg: '#fef2f2',
    icon: 'x-circle',
    desc: 'Your application was not approved. Please review the reason below and reapply.',
  },
};

export default function VendorRequestStatusScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [request, setRequest] = useState<VendorRequest | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    vendorRequestApi
      .getMyRequest()
      .then((r) => setRequest(r))
      .catch(() => setRequest(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // No application yet — show CTA
  if (!request) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Feather name="shopping-bag" size={40} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Become a Vendor</Text>
            <Text style={styles.heroSubtitle}>
              Join DistrictMart as a vendor and reach thousands of customers in your area. Sell your products online with ease.
            </Text>
          </View>

          <View style={styles.featureRow}>
            {[
              { icon: 'users', label: 'Reach local customers' },
              { icon: 'trending-up', label: 'Grow your sales' },
              { icon: 'shield', label: 'Secure payments' },
            ].map((f) => (
              <View key={f.label} style={styles.feature}>
                <Feather name={f.icon as any} size={20} color={colors.primary} />
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/vendor-request/form')}>
            <Feather name="arrow-right-circle" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Start Application</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const cfg = STATUS_CONFIG[request.status];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Badge */}
        <View style={[styles.statusCard, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
          <Feather name={cfg.icon as any} size={28} color={cfg.color} />
          <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={styles.statusDesc}>{cfg.desc}</Text>
        </View>

        {/* Admin Remarks */}
        {request.adminRemarks ? (
          <View style={styles.remarksCard}>
            <Text style={styles.remarksTitle}>📋 Admin Remarks</Text>
            <Text style={styles.remarksText}>{request.adminRemarks}</Text>
          </View>
        ) : null}

        {/* Rejection Reason */}
        {request.rejectionReason ? (
          <View style={[styles.remarksCard, { borderLeftColor: '#dc2626' }]}>
            <Text style={[styles.remarksTitle, { color: '#dc2626' }]}>❌ Rejection Reason</Text>
            <Text style={styles.remarksText}>{request.rejectionReason}</Text>
          </View>
        ) : null}

        {/* Application Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Application Details</Text>
          {[
            { label: 'Shop Name', value: request.shopName },
            { label: 'Owner Name', value: request.ownerName },
            { label: 'Mobile', value: request.mobileNumber },
            { label: 'Email', value: request.email },
            { label: 'Category', value: request.shopCategory },
            { label: 'District', value: request.district?.name },
            { label: 'Area', value: request.area?.name },
            { label: 'Submitted', value: request.submittedAt ? new Date(request.submittedAt).toLocaleDateString('en-IN') : '—' },
            { label: 'Last Updated', value: new Date(request.updatedAt).toLocaleDateString('en-IN') },
          ].map((row) =>
            row.value ? (
              <View key={row.label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{row.label}</Text>
                <Text style={styles.summaryValue}>{row.value}</Text>
              </View>
            ) : null,
          )}
        </View>

        {/* Actions */}
        {request.status === 'APPROVED' && (
          <Pressable
            style={[styles.primaryButton, { backgroundColor: '#16a34a' }]}
            onPress={handleSwitchToVendor}
          >
            <Feather name="log-in" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Open Vendor Portal</Text>
          </Pressable>
        )}

        {(request.status === 'DRAFT' || request.status === 'MORE_INFO_REQUIRED' || request.status === 'REJECTED') && (
          <Pressable style={styles.primaryButton} onPress={() => router.push('/vendor-request/form')}>
            <Feather name="edit-3" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>
              {request.status === 'DRAFT' ? 'Continue Application' : 'Update & Resubmit'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, gap: spacing.md },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  heroSubtitle: { ...typography.body1, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feature: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
  },
  featureText: { ...typography.caption, color: colors.text, textAlign: 'center', fontSize: 12 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { ...typography.button, color: colors.white, fontSize: 16, fontFamily: fonts.bold },
  statusCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  statusLabel: { ...typography.h3, fontSize: 18, fontFamily: fonts.bold },
  statusDesc: { ...typography.body2, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  remarksCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    borderWidth: 1,
    borderColor: colors.border,
  },
  remarksTitle: { ...typography.subtitle1, color: '#2563eb', marginBottom: 4 },
  remarksText: { ...typography.body2, color: colors.text, lineHeight: 20 },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: { ...typography.h3, fontSize: 15, color: colors.text, marginBottom: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: { ...typography.body2, color: colors.textMuted },
  summaryValue: { ...typography.body2, color: colors.text, fontFamily: fonts.medium, flex: 1, textAlign: 'right' },
});
