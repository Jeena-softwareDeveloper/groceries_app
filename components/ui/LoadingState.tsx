import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { AnimatedLoader } from '@/components/AnimatedLoader';
import { colors, fonts, spacing } from '@/constants/theme';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message, fullScreen = true }: LoadingStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <AnimatedLoader />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
  },
  text: {
    marginTop: spacing.lg,
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 14,
  }
});
