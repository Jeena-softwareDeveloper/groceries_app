import { useState, useEffect, useRef } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Image,
  View,
  Pressable,
  Keyboard,
  Animated,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authApi } from '@/api';
import { colors, spacing, typography, radius } from '@/constants/theme';
import { persistAuth } from '@/hooks/useBootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTokens, setUser } from '@/store/authSlice';
import { Feather } from '@expo/vector-icons';

import { Typography, Button, Input } from '@/components/ui';

export default function LoginScreen(props: any = {}) {
  const isModalComponent = props?.isModalComponent || false;
  const onClose = props?.onClose;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { districtId } = useAppSelector((s) => s.location);
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'role'>('phone');
  const [loading, setLoading] = useState(false);
  const [tempAuth, setTempAuth] = useState<{ tokens: any; user: any } | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const androidKeyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
        Animated.timing(androidKeyboardHeight, { toValue: e.endCoordinates.height, duration: 200, useNativeDriver: false }).start();
      });
      const hideSub = Keyboard.addListener('keyboardDidHide', () => {
        Animated.timing(androidKeyboardHeight, { toValue: 0, duration: 200, useNativeDriver: false }).start();
      });
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }
  }, []);

  async function handleRequestOtp() {
    const normalized = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(normalized)) {
      Toast.show({ type: 'error', text1: 'Invalid phone', text2: 'Enter a valid 10-digit Indian mobile number.' });
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.requestOtp(normalized);
      if (result.autoLogin && result.tokens) {
        // Trusted device bypass!
        await persistAuth(result.tokens.accessToken, result.tokens.refreshToken);
        dispatch(setTokens({ accessToken: result.tokens.accessToken, refreshToken: result.tokens.refreshToken }));
        const user = await authApi.getMe();
        
        if (user.role === 'VENDOR') {
          dispatch(setUser(user));
          if (isModalComponent && onClose) {
            onClose();
            router.replace('/(vendor)');
          } else {
            router.replace('/(vendor)');
          }
        } else {
          // Auto login means existing user, so never show role selection
          dispatch(setUser(user));
          if (isModalComponent && onClose) {
            onClose();
          } else {
            router.replace('/(tabs)');
          }
        }
      } else {
        setStep('otp');
        setResendTimer(30);
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e instanceof Error ? e.message : 'Failed to send OTP' });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(autoOtp?: string | any) {
    const code = typeof autoOtp === 'string' ? autoOtp : otp;
    const normalized = phone.replace(/\D/g, '');
    if (!normalized || normalized.length < 10) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Invalid phone number.' });
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      Toast.show({ type: 'error', text1: 'Invalid OTP', text2: 'Enter the 6-digit code.' });
      return;
    }
    setLoading(true);
    try {
      const tokens = await authApi.verifyOtp(normalized, code);
      
      // FIX: Persist auth to local storage so axios interceptor can use it for getMe()
      await persistAuth(tokens.accessToken, tokens.refreshToken);
      dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
      
      const user = await authApi.getMe();
      
      if (user.role === 'VENDOR') {
        dispatch(setUser(user));
        router.replace('/(vendor)');
      } else {
        if (tokens.isNewUser) {
          setTempAuth({ tokens, user });
          setStep('role');
        } else {
          dispatch(setUser(user));
          if (isModalComponent && onClose) {
            onClose();
          } else {
            router.replace('/(tabs)');
          }
        }
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e instanceof Error ? e.message : 'Verification failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
          {renderContent()}
        </KeyboardAvoidingView>
      ) : (
        <Animated.View style={[styles.container, { paddingBottom: androidKeyboardHeight }]}>
          {renderContent()}
        </Animated.View>
      )}
    </>
  );

  function renderContent() {
    return (
      <>
        <Pressable style={styles.overlay} onPress={() => {
          if (isModalComponent && onClose) onClose();
          else if (router.canGoBack()) router.back();
          else router.replace('/(tabs)');
        }} />

        {/* Bottom Sheet */}
        <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom + spacing.sm, spacing.lg) }]}>
          <View style={styles.sheetHeaderRow}>
            {step === 'otp' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <TouchableOpacity onPress={() => setStep('phone')} style={styles.backBtn} hitSlop={10}>
                  <Feather name="arrow-left" size={20} color="#0f172a" />
                </TouchableOpacity>
                <Typography style={styles.sheetTitle}>Verify number</Typography>
              </View>
            ) : step === 'role' ? (
              <Typography style={styles.sheetTitle}>Choose your role</Typography>
            ) : (
              <Typography style={styles.sheetTitle}>Get started</Typography>
            )}
              <TouchableOpacity onPress={() => {
                if (isModalComponent && onClose) onClose();
                else if (router.canGoBack()) router.back();
                else router.replace('/(tabs)');
              }} style={styles.closeBtn}>
              <Feather name="x" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Typography style={[styles.sheetSubtitle, step === 'otp' && { marginLeft: 44 }]}>
            {step === 'phone'
              ? 'Enter your phone number to continue'
              : step === 'otp'
              ? `OTP sent to +91 ${phone}`
              : 'How would you like to continue?'}
          </Typography>

        {step === 'phone' ? (
          <>
            <Input
              placeholder="9876543210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              containerStyle={{ marginBottom: spacing.md }}
              style={{ letterSpacing: 1, fontSize: 18 }}
              prefix={
                <TouchableOpacity style={styles.countryCode}>
                  <Typography variant="subtitle1" style={{ marginRight: 6, fontSize: 18 }}>+91</Typography>
                  <Feather name="chevron-down" size={16} color={colors.textMuted} />
                  <View style={styles.inputDivider} />
                </TouchableOpacity>
              }
            />

            <Button
              variant="primary"
              onPress={handleRequestOtp}
              loading={loading}
              style={styles.primaryBtn}
            >
              Continue
            </Button>
          </>
        ) : step === 'role' ? (
          <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
            <Button
              variant="primary"
              size="lg"
              onPress={async () => {
                if (tempAuth) {
                  await persistAuth(tempAuth.tokens.accessToken, tempAuth.tokens.refreshToken);
                  dispatch(setTokens(tempAuth.tokens));
                  dispatch(setUser(tempAuth.user));
                  
                  if (isModalComponent && onClose) {
                    onClose();
                  } else {
                    router.replace('/(tabs)');
                  }
                }
              }}
              style={styles.primaryBtn}
            >
              Continue as Customer
            </Button>
            <Button
              variant="outline"
              size="lg"
              onPress={async () => {
                if (tempAuth) {
                  if (isModalComponent && onClose) {
                    onClose();
                  }
                  router.replace('/vendor-request');
                  setTimeout(async () => {
                    await persistAuth(tempAuth.tokens.accessToken, tempAuth.tokens.refreshToken);
                    dispatch(setTokens(tempAuth.tokens));
                    dispatch(setUser(tempAuth.user));
                  }, 100);
                }
              }}
              style={{ ...styles.primaryBtn, backgroundColor: colors.white, borderColor: colors.primary, borderWidth: 1 }}
            >
              Register as Vendor
            </Button>
          </View>
        ) : step === 'otp' ? (
          <>
            <Input
              placeholder="------"
              keyboardType="number-pad"
              value={otp}
              onChangeText={(v) => {
                const code = v.replace(/\D/g, '').slice(0, 6);
                setOtp(code);
                if (code.length === 6) {
                  Keyboard.dismiss();
                  handleVerifyOtp(code);
                }
              }}
              maxLength={6}
              textAlign="center"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              containerStyle={{ marginBottom: spacing.md }}
              style={styles.otpInput}
            />

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleVerifyOtp}
              style={styles.primaryBtn}
            >
              Verify & Continue
            </Button>

            <View style={styles.otpActions}>
              {resendTimer > 0 ? (
                <Typography style={styles.resendText}>Resend code in {resendTimer}s</Typography>
              ) : (
                <>
                  <Typography style={styles.resendText}>Didn't receive code?</Typography>
                  <Pressable onPress={handleRequestOtp} disabled={loading}>
                    <Typography style={styles.resendLink}>Resend OTP</Typography>
                  </Pressable>
                </>
              )}
            </View>
          </>
        ) : null}

        {/* Minimalist Trust Badges */}
        <View style={styles.trustBanner}>
          <Feather name="check-circle" size={14} color="#16a34a" />
          <Typography style={styles.trustText}>Superfast Delivery</Typography>
          <View style={styles.trustDot} />
          <Feather name="shield" size={14} color="#16a34a" />
          <Typography style={styles.trustText}>100% Secure</Typography>
        </View>

        <Typography style={styles.termsText}>
          By continuing, you agree to our <Typography style={styles.termsLink}>Terms</Typography> & <Typography style={styles.termsLink}>Privacy</Typography>
        </Typography>
      </View>
    </>
  );
}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  closeBtn: {
    padding: 4,
  },
  sheetTitle: {
    fontFamily: typography.bold.fontFamily,
    fontSize: 24,
    color: '#0f172a',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: spacing.lg,
  },

  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
  },
  inputDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
    marginLeft: spacing.md,
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 8,
    fontFamily: typography.bold.fontFamily,
  },
  primaryBtn: {
    backgroundColor: '#16a34a',
    height: 56,
    borderRadius: 16,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },

  backBtn: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  resendText: {
    fontSize: 14,
    color: '#64748b',
  },
  resendLink: {
    fontSize: 14,
    fontFamily: typography.bold.fontFamily,
    color: '#16a34a',
  },

  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 6,
    paddingVertical: spacing.sm,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  trustText: {
    fontSize: 12,
    fontFamily: typography.semiBold.fontFamily,
    color: '#334155',
  },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
  },

  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: spacing.md,
  },
  termsLink: {
    fontSize: 12,
    color: '#16a34a',
  },
});
