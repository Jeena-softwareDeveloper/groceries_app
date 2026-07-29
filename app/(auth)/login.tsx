import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Image,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authApi } from '@/api';
import { colors, spacing, typography } from '@/constants/theme';
import { persistAuth } from '@/hooks/useBootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTokens, setUser } from '@/store/authSlice';
import { Feather, Ionicons } from '@expo/vector-icons';

import { Typography, Button, Input, Card, Badge } from '@/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { districtId } = useAppSelector((s) => s.location);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  async function handleRequestOtp() {
    const normalized = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(normalized)) {
      Alert.alert('Invalid phone', 'Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.requestOtp(normalized);
      setDevOtp(__DEV__ ? (result.otp ?? null) : null);
      setStep('otp');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const normalized = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(normalized)) {
      Alert.alert('Invalid phone', 'Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const tokens = await authApi.verifyOtp(normalized, otp);
      await persistAuth(tokens.accessToken, tokens.refreshToken);
      dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
      const user = await authApi.getMe();
      dispatch(setUser(user));
      router.replace(districtId ? '/(tabs)' : '/location');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.leaf1} pointerEvents="none" />
        <View style={styles.leaf2} pointerEvents="none" />
        <View style={styles.leaf3} pointerEvents="none" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Branding */}
          <View style={styles.brandSection}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Typography style={styles.brandText}>All Time Market</Typography>
            <View style={styles.underlineRow}>
              <View style={styles.underlineDash} />
              <View style={styles.underlineDot} />
            </View>
            <Typography style={styles.subtitle}>
              Fresh groceries from local stores
            </Typography>
          </View>

          {/* Auth card */}
          <Card style={styles.card}>
            {step === 'phone' ? (
              <>
                <View style={styles.cardHeader}>
                  <View style={styles.iconSquare}>
                    <Feather name="smartphone" size={24} color="#16a34a" />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Typography style={styles.cardTitle}>Enter your phone number</Typography>
                    <Typography style={styles.cardSubtitle}>
                      We'll send you a one-time password{'\n'}to verify your number
                    </Typography>
                  </View>
                </View>

                <Input
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  containerStyle={{ marginBottom: spacing.lg }}
                  style={{ letterSpacing: 1 }}
                  prefix={
                    <TouchableOpacity style={styles.countryCode}>
                      <Typography variant="subtitle1" style={{ marginRight: 6 }}>+91</Typography>
                      <Feather name="chevron-down" size={16} color={colors.textMuted} />
                      <View style={styles.inputDivider} />
                    </TouchableOpacity>
                  }
                />

                <Button
                  variant="primary"
                  onPress={handleRequestOtp}
                  loading={loading}
                  prefixIcon={<Feather name="send" size={18} color={colors.white} />}
                  style={styles.primaryBtn}
                >
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <View style={styles.cardHeader}>
                  <View style={styles.iconSquare}>
                    <Feather name="lock" size={24} color="#16a34a" />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Typography style={styles.cardTitle}>Verify your number</Typography>
                    <Typography style={styles.cardSubtitle}>
                      Enter the 6-digit OTP sent to +91 {phone}
                    </Typography>
                    {__DEV__ && devOtp ? (
                      <Typography variant="subtitle2" color="#16a34a" style={{ marginTop: 4 }}>
                        Dev OTP: {devOtp}
                      </Typography>
                    ) : null}
                  </View>
                </View>

                <Input
                  placeholder="------"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  textAlign="center"
                  containerStyle={{ marginBottom: spacing.lg }}
                  style={styles.otpInput}
                />

                <Button
                  variant="primary"
                  size="lg"
                  loading={loading}
                  onPress={handleVerifyOtp}
                  style={{ marginTop: spacing.md }}
                >
                  Verify & Continue
                </Button>

                <View style={styles.otpActions}>
                  <Pressable onPress={() => setStep('phone')} disabled={loading}>
                    <Typography variant="body2" color="#16a34a">Change number</Typography>
                  </Pressable>
                  <Pressable onPress={handleRequestOtp} disabled={loading}>
                    <Typography variant="body2" color="#16a34a">Resend OTP</Typography>
                  </Pressable>
                </View>
              </>
            )}
          </Card>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('@/assets/images/login-illustration.jpg')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Trust badges */}
          <View style={styles.badgesWrapper}>
            <Badge
              title="Secure"
              subtitle="& Private"
              icon={<Ionicons name="shield-checkmark-outline" size={22} color="#16a34a" />}
              style={styles.badgeItem}
            />
            <View style={styles.badgeDivider} />
            <Badge
              title="Fast"
              subtitle="Delivery"
              icon={<Ionicons name="flash-outline" size={22} color="#16a34a" />}
              style={styles.badgeItem}
            />
            <View style={styles.badgeDivider} />
            <Badge
              title="Quality"
              subtitle="Trusted"
              icon={<Ionicons name="ribbon-outline" size={22} color="#16a34a" />}
              style={styles.badgeItem}
            />
          </View>

          {/* Terms */}
          <View style={styles.termsSection}>
            <Typography style={styles.termsTextMuted}>By continuing, you agree to our</Typography>
            <View style={styles.termsRow}>
              <Typography style={styles.termsLink}>Terms of Service</Typography>
              <Typography style={styles.termsTextMuted}> and </Typography>
              <Typography style={styles.termsLink}>Privacy Policy</Typography>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  leaf1: {
    position: 'absolute',
    width: 60,
    height: 60,
    top: -10,
    left: -10,
    borderRadius: 30,
    backgroundColor: '#bbf7d0',
    opacity: 0.4,
  },
  leaf2: {
    position: 'absolute',
    width: 40,
    height: 40,
    top: 70,
    right: 10,
    borderRadius: 20,
    backgroundColor: '#bbf7d0',
    opacity: 0.3,
  },
  leaf3: {
    position: 'absolute',
    width: 20,
    height: 20,
    top: 150,
    left: 30,
    borderRadius: 10,
    backgroundColor: '#bbf7d0',
    opacity: 0.4,
  },

  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
  },
  brandText: {
    ...typography.h1,
    fontSize: 28,
    lineHeight: 36,
    color: '#0f172a',
    textAlign: 'center',
  },
  underlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    gap: 4,
  },
  underlineDash: {
    width: 36,
    height: 4,
    backgroundColor: '#16a34a',
    borderRadius: 2,
  },
  underlineDot: {
    width: 6,
    height: 4,
    backgroundColor: '#16a34a',
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    textAlign: 'center',
  },

  card: {
    padding: spacing.lg,
    borderRadius: 20,
    width: '100%',
    alignSelf: 'stretch',
    shadowColor: '#cbd5e1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    width: '100%',
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  cardHeaderText: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    ...typography.h3,
    fontSize: 17,
    lineHeight: 24,
    color: '#0f172a',
    marginBottom: 2,
  },
  cardSubtitle: {
    ...typography.body2,
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingLeft: spacing.md,
  },
  inputDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
    marginLeft: spacing.md,
  },
  otpInput: {
    fontSize: 20,
    letterSpacing: 6,
    fontWeight: 'bold',
  },
  primaryBtn: {
    backgroundColor: '#15803d',
    height: 50,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },

  illustrationContainer: {
    width: '100%',
    height: 110,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },

  badgesWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  badgeItem: {
    flex: 1,
    padding: 4,
    minWidth: 0,
  },
  badgeDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#bbf7d0',
    flexShrink: 0,
  },

  termsSection: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  termsTextMuted: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
  },
  termsLink: {
    fontSize: 12,
    lineHeight: 18,
    color: '#16a34a',
    fontFamily: typography.bold.fontFamily,
  },
});
