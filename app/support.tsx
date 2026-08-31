import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customerApi } from '@/api';
import { Button } from '@/components/Button';
import { PageHeader } from '@/components/PageHeader';
import { SuccessState } from '@/components/ui';
import { colors, radius, spacing , fonts} from '@/constants/theme';
import Toast from 'react-native-toast-message';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setShowLoginModal } from '@/store/authSlice';

export default function SupportScreen() {
  const { accessToken } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!accessToken) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <PageHeader title="Help & Support" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 16, color: colors.textMuted, textAlign: 'center' }}>Please sign in to view this page</Text>
        </View>
      </SafeAreaView>
    );
  }


  async function handleSubmit() {
    const subjectValue = subject.trim();
    const messageValue = message.trim();
    if (subjectValue.length < 3) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Subject must be at least 3 characters.' });
      return;
    }
    if (messageValue.length < 10) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Message must be at least 10 characters.' });
      return;
    }
    setLoading(true);
    try {
      await customerApi.createSupportTicket(subjectValue, messageValue);
      setIsSuccess(true);
      setSubject('');
      setMessage('');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e instanceof Error ? e.message : 'Could not submit ticket' });
    } finally {
      setLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <SuccessState
        title="Ticket Submitted!"
        message="Our team will get back to you soon."
        buttonText="Back to Support"
        onButtonPress={() => setIsSuccess(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>

      <PageHeader title="Help & Support" showBack />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.form}>
        <Text style={styles.label}>Subject</Text>
        <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="What do you need help with?" />
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue"
          multiline
          numberOfLines={5}
        />
        <Button title="Submit ticket" loading={loading} onPress={handleSubmit} style={{ marginHorizontal: spacing.md, marginTop: spacing.lg }} />
      </View>
          </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0fdf4' },
  form: { paddingVertical: spacing.md },
  label: { marginHorizontal: spacing.md, fontFamily: fonts.medium, color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
  },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
});
