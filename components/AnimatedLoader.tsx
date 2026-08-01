import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface AnimatedLoaderProps {
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export function AnimatedLoader({ color = colors.primary, size = 'medium' }: AnimatedLoaderProps) {
  const waveAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const createWave = () => {
      const animations = waveAnims.map((anim, index) => {
        return Animated.sequence([
          Animated.delay(index * 120),
          Animated.timing(anim, {
            toValue: -12, // bounce up
            duration: 250,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 250,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
      });

      return Animated.loop(Animated.stagger(0, animations));
    };

    const waveLoop = createWave();
    waveLoop.start();

    return () => waveLoop.stop();
  }, []);

  const icons = ['restaurant-outline', 'basket-outline', 'storefront-outline', 'cart-outline'] as const;

  const getSizing = () => {
    switch (size) {
      case 'small': return { circle: 36, icon: 18, gap: 10 };
      case 'large': return { circle: 52, icon: 24, gap: 16 };
      case 'medium': 
      default:
        return { circle: 44, icon: 20, gap: 12 };
    }
  };

  const sizing = getSizing();

  return (
    <View style={[styles.iconsRow, { gap: sizing.gap }]}>
      {icons.map((icon, index) => (
        <Animated.View 
          key={icon}
          style={{ transform: [{ translateY: waveAnims[index] }] }}
        >
          <View style={[styles.iconCircle, { width: sizing.circle, height: sizing.circle, borderRadius: sizing.circle / 2 }]}>
            <Ionicons name={icon as any} size={sizing.icon} color={color} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  }
});
