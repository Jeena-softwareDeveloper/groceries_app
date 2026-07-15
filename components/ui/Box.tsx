import React from 'react';
import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { spacing, radius, colors } from '@/constants/theme';

export type SpacingScale = keyof typeof spacing;
export type RadiusScale = keyof typeof radius;
export type ColorScale = keyof typeof colors;

export interface BoxProps extends ViewProps {
  p?: SpacingScale | number;
  px?: SpacingScale | number;
  py?: SpacingScale | number;
  pt?: SpacingScale | number;
  pb?: SpacingScale | number;
  pl?: SpacingScale | number;
  pr?: SpacingScale | number;
  m?: SpacingScale | number;
  mx?: SpacingScale | number;
  my?: SpacingScale | number;
  mt?: SpacingScale | number;
  mb?: SpacingScale | number;
  ml?: SpacingScale | number;
  mr?: SpacingScale | number;
  bg?: ColorScale | string;
  br?: RadiusScale | number;
  row?: boolean;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: ViewStyle['flexWrap'];
  flex?: number;
  gap?: SpacingScale | number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Box({
  p, px, py, pt, pb, pl, pr,
  m, mx, my, mt, mb, ml, mr,
  bg, br, row, align, justify, wrap, flex, gap,
  style, children, ...props
}: BoxProps) {
  const getSpacing = (val?: SpacingScale | number) => 
    typeof val === 'string' ? spacing[val] : val;

  const dynamicStyle: ViewStyle = {
    ...(p !== undefined && { padding: getSpacing(p) }),
    ...(px !== undefined && { paddingHorizontal: getSpacing(px) }),
    ...(py !== undefined && { paddingVertical: getSpacing(py) }),
    ...(pt !== undefined && { paddingTop: getSpacing(pt) }),
    ...(pb !== undefined && { paddingBottom: getSpacing(pb) }),
    ...(pl !== undefined && { paddingLeft: getSpacing(pl) }),
    ...(pr !== undefined && { paddingRight: getSpacing(pr) }),
    ...(m !== undefined && { margin: getSpacing(m) }),
    ...(mx !== undefined && { marginHorizontal: getSpacing(mx) }),
    ...(my !== undefined && { marginVertical: getSpacing(my) }),
    ...(mt !== undefined && { marginTop: getSpacing(mt) }),
    ...(mb !== undefined && { marginBottom: getSpacing(mb) }),
    ...(ml !== undefined && { marginLeft: getSpacing(ml) }),
    ...(mr !== undefined && { marginRight: getSpacing(mr) }),
    ...(bg && { backgroundColor: (colors as Record<string, string>)[bg] || bg }),
    ...(br !== undefined && { borderRadius: typeof br === 'string' ? radius[br] : br }),
    ...(row && { flexDirection: 'row' }),
    ...(align && { alignItems: align }),
    ...(justify && { justifyContent: justify }),
    ...(wrap && { flexWrap: wrap }),
    ...(flex !== undefined && { flex }),
    ...(gap !== undefined && { gap: getSpacing(gap) }),
  };

  return (
    <View style={[dynamicStyle, style]} {...props}>
      {children}
    </View>
  );
}
