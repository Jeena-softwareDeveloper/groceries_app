import React, { useState } from 'react';
import { 
  TextInput, 
  TextInputProps, 
  StyleSheet, 
  View, 
  StyleProp, 
  ViewStyle 
} from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { Typography } from './Typography';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  helperText,
  prefix,
  suffix,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Typography variant="subtitle2" color="text" style={styles.label}>
          {label}
        </Typography>
      )}
      
      <View 
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {prefix && <View style={styles.prefix}>{prefix}</View>}
        
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {suffix && <View style={styles.suffix}>{suffix}</View>}
      </View>

      {(error || helperText) && (
        <Typography 
          variant="caption" 
          color={error ? 'error' : 'textMuted'} 
          style={styles.helpText}
        >
          {error || helperText}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    height: 48,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  prefix: {
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  suffix: {
    paddingRight: spacing.md,
    paddingLeft: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.body1,
    color: colors.text,
    height: '100%',
    paddingHorizontal: spacing.md,
  },
  helpText: {
    marginTop: spacing.xs,
  },
});
