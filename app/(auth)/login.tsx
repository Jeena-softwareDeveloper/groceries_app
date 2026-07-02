import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { requestOtp, verifyOtp, getMe } from '@/api/auth';
import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/constants/theme';
import { persistAuth } from '@/hooks/useBootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTokens, setUser } from '@/store/authSlice';

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
      const result = await requestOtp(normalized);
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
      const tokens = await verifyOtp(normalized, otp);
      await persistAuth(tokens.accessToken, tokens.refreshToken);
      dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
      const user = await getMe();
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
      <View style={styles.hero}>
        <Text style={styles.brand}>DistrictMart</Text>
        <Text style={styles.subtitle}>Fresh groceries from local stores</Text>
      </View>

      <View style={styles.card}>
        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
            />
            <Button title="Send OTP" onPress={handleRequestOtp} loading={loading} />
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter OTP sent to {phone}</Text>
            {devOtp ? <Text style={styles.hint}>Dev OTP: {devOtp}</Text> : null}
            <TextInput
              style={styles.input}
              placeholder="123456"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
            <Button title="Verify & Continue" onPress={handleVerifyOtp} loading={loading} />
            <Button
              title="Change number"
              variant="ghost"
              onPress={() => {
                setStep('phone');
                setOtp('');
              }}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  hero: { marginBottom: spacing.xl },
  brand: { fontSize: 32, fontWeight: '800', color: colors.primary },
  subtitle: { fontSize: 16, color: colors.textMuted, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  hint: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
});
