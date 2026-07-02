import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createSupportTicket } from '@/api/customer';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { colors, radius, spacing } from '@/constants/theme';

export default function SupportScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    try {
      await createSupportTicket(subject.trim(), message.trim());
      Alert.alert('Ticket submitted', 'Our team will get back to you soon.');
      setSubject('');
      setMessage('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not submit ticket');
    } finally {
      setLoading(false);
    }
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
  label: { fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
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
