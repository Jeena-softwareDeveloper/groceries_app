import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { Typography } from './Typography';

export interface BadgeProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  style?: StyleProp<ViewStyle>;
}

export function Badge({ title, subtitle, icon, variant = 'ghost', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`variant_${variant}`], style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.textContainer}>
        <Typography variant="caption" weight="bold" color={variant === 'primary' ? 'white' : 'text'}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color={variant === 'primary' ? 'white' : 'textMuted'} style={styles.subtitle}>
            {subtitle}
          </Typography>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    justifyContent: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  subtitle: {
    marginTop: -2,
    fontSize: 11,
    lineHeight: 14,
  },
  variant_primary: {
    backgroundColor: colors.primary,
  },
  variant_secondary: {
    backgroundColor: '#f0fdf4',
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  }
});
