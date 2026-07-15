import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '@/api';
import { colors, radius, spacing, fonts, typography } from '@/constants/theme';
import { persistAuth } from '@/hooks/useBootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTokens, setUser } from '@/store/authSlice';
import { Feather } from '@expo/vector-icons';

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
    if (normalized.length < 10) {
      Alert.alert('Invalid phone', 'Enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.requestOtp(normalized);
      setDevOtp(result.otp ?? '123456');
      setStep('otp');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const normalized = phone.replace(/\D/g, '');
    if (otp.length !== 6) {
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Logo & Branding */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIconWrapper}>
            <Feather name="shopping-bag" size={56} color={colors.primary} />
            <Feather name="map-pin" size={18} color={colors.primary} style={styles.logoInnerPin} />
          </View>
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandTextDark}>District</Text>
            <Text style={styles.brandTextPrimary}>Mart</Text>
          </View>
          <View style={styles.brandUnderline}>
            <View style={styles.underlineDash} />
            <View style={styles.underlineDot} />
          </View>
          <Text style={styles.subtitle}>Fresh groceries from local stores</Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          {step === 'phone' ? (
            <>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Feather name="smartphone" size={24} color={colors.primary} />
                </View>
                <View style={styles.headerTextWrapper}>
                  <Text style={styles.cardTitle}>Enter your phone number</Text>
                  <Text style={styles.cardSubtitle}>
                    We'll send you a one-time password to verify your number
                  </Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                  <Feather name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>
                <View style={styles.inputDivider} />
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                />
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                onPress={handleRequestOtp} 
                disabled={loading}
              >
                <Feather name="send" size={18} color={colors.white} style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Feather name="lock" size={24} color={colors.primary} />
                </View>
                <View style={styles.headerTextWrapper}>
                  <Text style={styles.cardTitle}>Verify your number</Text>
                  <Text style={styles.cardSubtitle}>
                    Enter the 6-digit OTP sent to +91 {phone}
                  </Text>
                  {devOtp ? <Text style={styles.hintText}>Dev OTP: {devOtp}</Text> : null}
                </View>
              </View>

              <TextInput
                style={[styles.inputContainer, styles.otpInput]}
                placeholder="123456"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
                textAlign="center"
              />

              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                onPress={handleVerifyOtp} 
                disabled={loading}
              >
                <Feather name="check-circle" size={18} color={colors.white} style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.ghostButton}
                onPress={() => {
                  setStep('phone');
                  setOtp('');
                }}
              >
                <Text style={styles.ghostButtonText}>Change number</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.safeNumberWrapper}>
            <Feather name="shield" size={14} color={colors.primary} />
            <Text style={styles.safeNumberText}>Your number is safe with us</Text>
          </View>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image 
            source={require('@/assets/images/login-illustration.png')} 
            style={styles.illustration} 
            resizeMode="contain" 
          />
        </View>

        {/* Footer Badges */}
        <View style={styles.badgesContainer}>
          <View style={styles.badge}>
            <Feather name="shield" size={24} color={colors.primary} />
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeTitle}>Secure</Text>
              <Text style={styles.badgeSubtitle}>& Private</Text>
            </View>
          </View>
          <View style={styles.badgeDivider} />
          <View style={styles.badge}>
            <Feather name="zap" size={24} color={colors.primary} />
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeTitle}>Quick</Text>
              <Text style={styles.badgeSubtitle}>Verification</Text>
            </View>
          </View>
          <View style={styles.badgeDivider} />
          <View style={styles.badge}>
            <Feather name="award" size={24} color={colors.primary} />
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeTitle}>100%</Text>
              <Text style={styles.badgeSubtitle}>Trusted</Text>
            </View>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>By continuing, you agree to our</Text>
          <View style={styles.termsLinks}>
            <Text style={styles.termsLink}>Terms of Service</Text>
            <Text style={styles.termsText}> and </Text>
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  
  // Top Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoIconWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 24,
    marginBottom: spacing.md,
  },
  logoInnerPin: {
    position: 'absolute',
    top: 36,
  },
  brandTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextDark: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text,
  },
  brandTextPrimary: {
    ...typography.h1,
    fontSize: 32,
    color: colors.primary,
  },
  brandUnderline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    gap: 4,
  },
  underlineDash: {
    width: 30,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  underlineDot: {
    width: 5,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textMuted,
  },

  // Main Card
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    paddingTop: spacing.lg + 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: spacing.sm,
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...typography.body2,
    color: colors.textMuted,
  },
  hintText: {
    ...typography.subtitle2,
    color: colors.primary,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    height: 56,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: '100%',
  },
  countryCodeText: {
    ...typography.subtitle1,
    fontSize: 16,
    color: colors.text,
    marginRight: spacing.xs,
  },
  inputDivider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.border,
  },
  input: {
    flex: 1,
    ...typography.subtitle1,
    fontSize: 16,
    color: colors.text,
    paddingHorizontal: spacing.md,
    height: '100%',
  },
  otpInput: {
    paddingHorizontal: spacing.md,
    fontSize: 20,
    fontFamily: fonts.bold,
    letterSpacing: 4,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  primaryButtonText: {
    ...typography.button,
    fontSize: 16,
    color: colors.white,
  },
  ghostButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ghostButtonText: {
    ...typography.subtitle1,
    color: colors.textMuted,
  },
  safeNumberWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  safeNumberText: {
    ...typography.subtitle2,
    color: colors.textMuted,
  },

  // Illustration
  illustrationContainer: {
    width: '100%',
    height: 140,
    marginTop: -20,
    marginBottom: -10,
    zIndex: 1,
    alignItems: 'center',
  },
  illustration: {
    width: '120%',
    height: '100%',
    opacity: 0.9,
  },

  // Footer Badges
  badgesContainer: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  badgeTextContainer: {
    justifyContent: 'center',
  },
  badgeTitle: {
    ...typography.caption,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  badgeSubtitle: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  badgeDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#dcfce7',
  },

  // Terms
  termsContainer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  termsText: {
    ...typography.subtitle2,
    color: colors.textMuted,
    marginBottom: 2,
  },
  termsLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsLink: {
    ...typography.subtitle2,
    color: colors.primary,
  },
});

