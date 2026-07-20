import React from 'react';
import { Header } from './Header';
import type { ViewStyle } from 'react-native';

interface InnerHeaderProps {
  title: string;
  showCart?: boolean;
  showSearch?: boolean;
  showBack?: boolean;
  style?: ViewStyle;
}

export function InnerHeader({
  title,
  showCart = true,
  showSearch = true,
  showBack = false,
  style,
}: InnerHeaderProps) {
  return (
    <Header
      title={title}
      showLocation={false}
      showCart={showCart}
      showSearch={showSearch}
      showBack={showBack}
      darkIcons={true}
      style={style}
    />
  );
}
