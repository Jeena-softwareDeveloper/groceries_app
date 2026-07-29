import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customerApi } from '@/api';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { SuccessState } from '@/components/ui';
import { colors, radius, spacing , fonts} from '@/constants/theme';

export default function SupportScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);


  async function handleSubmit() {
    const subjectValue = subject.trim();
    const messageValue = message.trim();
    if (subjectValue.length < 3) {
      Alert.alert('Validation', 'Subject must be at least 3 characters.');
      return;
    }
    if (messageValue.length < 10) {
      Alert.alert('Validation', 'Message must be at least 10 characters.');
      return;
    }
    setLoading(true);
    try {
      await customerApi.createSupportTicket(subjectValue, messageValue);
      setIsSuccess(true);
      setSubject('');
      setMessage('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not submit ticket');
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
    <SafeAreaView style={styles.safe} edges={['top']}>

      <Header title="Help & Support" showBack />
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
        <Button title="Submit ticket" loading={loading} onPress={handleSubmit} style={{ marginTop: spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  form: { padding: spacing.md },
  label: { fontFamily: fonts.medium, color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
  },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
});
