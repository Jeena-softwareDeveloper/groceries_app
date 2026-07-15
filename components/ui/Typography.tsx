import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { typography, colors } from '@/constants/theme';

export type TypographyVariant = keyof typeof typography;
export type TypographyColor = keyof typeof colors;

export interface TypographyProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TypographyColor | string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: 'normal' | 'bold' | '500' | '600' | '700';
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export function Typography({
  variant = 'body1',
  color = 'text',
  align = 'auto',
  weight,
  style,
  children,
  ...props
}: TypographyProps) {
  // Use theme color if it matches a key in colors, otherwise use the string directly
  const textColor = (colors as Record<string, string>)[color] || color;
  
  return (
    <RNText
      style={[
        typography[variant],
        { color: textColor, textAlign: align },
        weight ? { fontWeight: weight } : null,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}
