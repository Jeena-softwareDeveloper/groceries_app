import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ViewProps } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  outlined?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ elevated = true, outlined = true, children, style, ...props }: CardProps) {
  return (
    <View 
      style={[
        styles.card,
        elevated && styles.elevated,
        outlined && styles.outlined,
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
  },
  elevated: {
    shadowColor: '#cbd5e1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 8,
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#f1f5f9',
  }
});
