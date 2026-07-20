import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Image,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authApi } from '@/api';
import { colors, spacing, typography } from '@/constants/theme';
import { persistAuth } from '@/hooks/useBootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTokens, setUser } from '@/store/authSlice';
import { Feather, Ionicons } from '@expo/vector-icons';

import { Box, Typography, Button, Input, Card, Badge } from '@/components/ui';

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
      <SafeAreaView style={styles.safeArea}>
        
        {/* Floating Leaves Background (Absolute) */}
        <Box style={[styles.floatingLeaf, styles.leaf1]} />
        <Box style={[styles.floatingLeaf, styles.leaf2]} />
        <Box style={[styles.floatingLeaf, styles.leaf3]} />

        {/* Main Flex Layout without ScrollView */}
        <View style={styles.content}>

          {/* 1. Top Logo & Branding - Scales naturally */}
          <Box flex={1.2} justify="center" align="center" style={{ zIndex: 10, minHeight: 120 }}>
            <Box 
              w={80} h={80} 
              justify="center" align="center"  
              mb="md" 
            >
              <Image source={require('../../assets/images/logo.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
            </Box>
            <Box row align="center">
              <Typography style={styles.brandTextDark}>All Time Market</Typography>
            </Box>
            <Box row align="center" mt="xs" mb="sm" gap={4}>
              <Box style={styles.underlineDash} />
              <Box style={styles.underlineDot} />
            </Box>
            <Typography variant="body1" color="#64748b" style={styles.subtitle}>
              Fresh groceries from local stores
            </Typography>
          </Box>

          {/* 2. Main Card - Does not shrink aggressively to preserve readability */}
          <Box flexShrink={0} justify="center" align="center" style={{ width: '100%' }}>
            <Card style={styles.cardOverrides}>
              {step === 'phone' ? (
                <>
                  <Box row mb="lg" align="flex-start">
                    <Box style={styles.iconSquare}>
                      <Feather name="smartphone" size={24} color="#16a34a" />
                    </Box>
                    <Box flex={1} justify="center">
                      <Typography style={styles.cardTitle}>Enter your phone number</Typography>
                      <Typography style={styles.cardSubtitle}>
                        We'll send you a one-time password{'\n'}to verify your number
                      </Typography>
                    </Box>
                  </Box>

                  <Input
                    placeholder="98765 43210"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    maxLength={10}
                    containerStyle={{ marginBottom: spacing.lg }}
                    style={{ letterSpacing: 1 }}
                    prefix={
                      <TouchableOpacity style={styles.countryCode}>
                        <Typography variant="subtitle1" style={{ marginRight: 6 }}>+91</Typography>
                        <Feather name="chevron-down" size={16} color={colors.textMuted} />
                        <Box style={styles.inputDivider} />
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
                  <Box row mb="lg" align="flex-start">
                    <Box style={styles.iconSquare}>
                      <Feather name="lock" size={24} color="#16a34a" />
                    </Box>
                    <Box flex={1} justify="center">
                      <Typography style={styles.cardTitle}>Verify your number</Typography>
                      <Typography style={styles.cardSubtitle}>
                        Enter the 6-digit OTP sent to +91 {phone}
                      </Typography>
                      {devOtp ? <Typography variant="subtitle2" color="#16a34a" mt={4}>Dev OTP: {devOtp}</Typography> : null}
                    </Box>
                  </Box>

                  <Input
                    placeholder="123456"
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={setOtp}
                    maxLength={6}
                    textAlign="center"
                    containerStyle={{ marginBottom: spacing.lg }}
                    style={styles.otpInput}
                  />

                  <Button 
                    variant="primary" 
                    onPress={handleVerifyOtp} 
                    loading={loading}
                    prefixIcon={<Feather name="check-circle" size={18} color={colors.white} />}
                    style={styles.primaryBtn}
                  >
                    Verify & Continue
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onPress={() => { setStep('phone'); setOtp(''); }}
                    style={{ marginTop: -8 }}
                  >
                    <Typography variant="subtitle1" color="textMuted">Change number</Typography>
                  </Button>
                </>
              )}

              <Box row align="center" justify="center" gap={6} mt="xs">
                <Feather name="shield" size={14} color="#16a34a" />
                <Typography variant="body2" color="#64748b" style={{ fontSize: 13 }}>Your number is safe with us</Typography>
              </Box>
            </Card>
          </Box>

          {/* 3. Illustration - Shrinks aggressively on small screens */}
          <Box flex={1} style={styles.illustrationContainer}>
            <Image 
              source={require('@/assets/images/login-illustration.png')} 
              style={styles.illustration} 
              resizeMode="contain" 
            />
          </Box>

          {/* 4. Footer Badges - Flex layout adapts to width */}
          <Box row justify="space-between" align="center" p="sm" py="md" mb="md" br={16} bg="#f0fdf4" style={styles.badgesWrapper}>
            <Badge 
              title="Secure" 
              subtitle="& Private" 
              icon={<Ionicons name="shield-checkmark-outline" size={24} color="#16a34a" />} 
              style={{ padding: 4 }}
            />
            <Box style={styles.badgeDivider} />
            <Badge 
              title="Quick" 
              subtitle="Verification" 
              icon={<Ionicons name="flash-outline" size={24} color="#16a34a" />} 
              style={{ padding: 4 }}
            />
            <Box style={styles.badgeDivider} />
            <Badge 
              title="100%" 
              subtitle="Trusted" 
              icon={<Ionicons name="ribbon-outline" size={24} color="#16a34a" />} 
              style={{ padding: 4 }}
            />
          </Box>

          {/* 5. Terms & Conditions */}
          <Box align="center" flexShrink={0}>
            <Typography variant="body2" color="#64748b" mb={2} style={styles.termsText}>
              By continuing, you agree to our
            </Typography>
            <Box row align="center">
              <Typography variant="body2" color="#16a34a" weight="bold" style={styles.termsText}>Terms of Service</Typography>
              <Typography variant="body2" color="#64748b" style={styles.termsText}> and </Typography>
              <Typography variant="body2" color="#16a34a" weight="bold" style={styles.termsText}>Privacy Policy</Typography>
            </Box>
          </Box>

        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  safeArea: { flex: 1, overflow: 'hidden' }, // overflow: hidden disables scrolling
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Floating Leaf Elements (Mimicked)
  floatingLeaf: { position: 'absolute', backgroundColor: '#bbf7d0', opacity: 0.4, borderRadius: 50 },
  leaf1: { width: 60, height: 60, top: -10, left: -10, borderRadius: 30 },
  leaf2: { width: 40, height: 40, top: 70, right: 10, borderRadius: 20, opacity: 0.3 },
  leaf3: { width: 20, height: 20, top: 150, left: 30, borderRadius: 10 },
  
  bubble1: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#86efac', top: 5, left: -15 },
  bubble2: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#bbf7d0', bottom: 10, left: -25 },
  bubble3: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#86efac', top: -5, right: -15 },
  bubble4: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#dcfce7', bottom: 20, right: -25 },
  
  brandTextDark: { ...typography.h1, fontSize: 32, color: '#0f172a' },
  brandTextPrimary: { ...typography.h1, fontSize: 32, color: '#16a34a' },
  underlineDash: { width: 36, height: 4, backgroundColor: '#16a34a', borderRadius: 2 },
  underlineDot: { width: 6, height: 4, backgroundColor: '#16a34a', borderRadius: 2 },
  subtitle: { fontSize: 14, textAlign: 'center' },
  
  cardOverrides: {
    padding: spacing.lg,
    borderRadius: 20,
    width: '100%',
    shadowColor: '#cbd5e1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  iconSquare: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdf4',
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
    borderWidth: 1, borderColor: '#dcfce7',
  },
  cardTitle: { ...typography.h3, fontSize: 17, color: '#0f172a', marginBottom: 2 },
  cardSubtitle: { ...typography.body2, fontSize: 12, color: '#64748b', lineHeight: 16 },
  countryCode: { flexDirection: 'row', alignItems: 'center', height: '100%', paddingLeft: spacing.md },
  inputDivider: { width: 1, height: 28, backgroundColor: '#e2e8f0', marginLeft: spacing.md },
  otpInput: { fontSize: 20, letterSpacing: 6, fontWeight: 'bold' },
  primaryBtn: { backgroundColor: '#15803d', height: 50, shadowColor: '#15803d', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  
  illustrationContainer: { 
    width: '100%', 
    minHeight: 0, 
    maxHeight: 120, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginVertical: -10,
    zIndex: 1
  },
  illustration: { width: '100%', height: '100%' },
  
  badgesWrapper: { borderWidth: 1, borderColor: '#dcfce7', width: '100%' },
  badgeDivider: { width: 1, height: 32, backgroundColor: '#bbf7d0' },
  
  termsText: { fontSize: 12 },
});
