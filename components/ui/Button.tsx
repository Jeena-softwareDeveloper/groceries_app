import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  ActivityIndicator, 
  StyleSheet, 
  View 
} from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { Typography } from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  prefixIcon,
  suffixIcon,
  children,
  style,
  ...props
}: ButtonProps) {
  const getContainerStyles = () => {
    let stylesArr = [styles.base];
    
    // Size styles
    stylesArr.push(styles[`size_${size}`]);
    
    // Variant styles
    stylesArr.push(styles[`variant_${variant}`]);
    
    if (disabled || loading) {
      stylesArr.push(styles.disabled);
    }
    
    return stylesArr;
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary': return colors.white;
      case 'secondary': return colors.primary;
      case 'outline': return colors.text;
      case 'ghost': return colors.text;
      default: return colors.white;
    }
  };

  return (
    <TouchableOpacity
      style={[getContainerStyles(), style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} style={styles.loader} />
      ) : (
        <View style={styles.content}>
          {prefixIcon && <View style={styles.prefix}>{prefixIcon}</View>}
          {typeof children === 'string' ? (
            <Typography variant="button" color={getTextColor()}>
              {children}
            </Typography>
          ) : (
            children
          )}
          {suffixIcon && <View style={styles.suffix}>{suffixIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sizes
  size_sm: {
    height: 36,
    paddingHorizontal: spacing.md,
  },
  size_md: {
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  size_lg: {
    height: 56,
    paddingHorizontal: spacing.xl,
  },
  // Variants
  variant_primary: {
    backgroundColor: colors.primary,
  },
  variant_secondary: {
    backgroundColor: '#f0fdf4', // light green surface
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  loader: {
    marginRight: spacing.sm,
  },
  prefix: {
    marginRight: spacing.sm,
  },
  suffix: {
    marginLeft: spacing.sm,
  },
});
