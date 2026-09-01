import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface AnimatedLoaderProps {
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export function AnimatedLoader({ color = colors.primary, size = 'large' }: AnimatedLoaderProps) {
  // ── Animation values ─────────────────────────────────────────────
  const ring1Spin   = useRef(new Animated.Value(0)).current; // outer ring — slow CW
  const ring2Spin   = useRef(new Animated.Value(0)).current; // mid ring   — medium CCW
  const ring3Spin   = useRef(new Animated.Value(0)).current; // inner ring — fast CW
  const glowPulse   = useRef(new Animated.Value(0)).current; // center glow breath
  const centerScale = useRef(new Animated.Value(1)).current; // center logo heartbeat

  const getSizing = () => {
    switch (size) {
      case 'small':  return { total: 120, center: 40, r1: 52, r2: 38, r3: 26, dot: 8,  icon: 18 };
      case 'medium': return { total: 160, center: 54, r1: 68, r2: 52, r3: 36, dot: 10, icon: 24 };
      case 'large':
      default:       return { total: 220, center: 72, r1: 92, r2: 70, r3: 48, dot: 13, icon: 32 };
    }
  };
  const s = getSizing();

  useEffect(() => {
    // Ring 1: slow clockwise (14s)
    Animated.loop(
      Animated.timing(ring1Spin, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Ring 2: medium counter-clockwise (9s)
    Animated.loop(
      Animated.timing(ring2Spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Ring 3: fast clockwise (5s)
    Animated.loop(
      Animated.timing(ring3Spin, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Glow pulse: breath in/out
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Center icon: double-beat heartbeat
    Animated.loop(
      Animated.sequence([
        Animated.timing(centerScale, { toValue: 1.12, duration: 380, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(centerScale, { toValue: 1.0,  duration: 260, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
        Animated.timing(centerScale, { toValue: 1.06, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(centerScale, { toValue: 1.0,  duration: 540, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const cw  = (val: Animated.Value) => val.interpolate({ inputRange: [0, 1], outputRange: ['0deg',    '360deg'] });
  const ccw = (val: Animated.Value) => val.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] });
  const glowScale   = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.2] });

  return (
    <View style={{ width: s.total, height: s.total, justifyContent: 'center', alignItems: 'center' }}>

      {/* ── BREATHING GLOW HALO behind center ─────────────────── */}
      <Animated.View style={[
        StyleSheet.absoluteFill,
        { justifyContent: 'center', alignItems: 'center', opacity: glowOpacity, transform: [{ scale: glowScale }] }
      ]}>
        <View style={{
          width: s.center * 2.4, height: s.center * 2.4,
          borderRadius: s.center * 1.2,
          backgroundColor: color,
          opacity: 0.18,
        }} />
      </Animated.View>

      {/* ── RING 1: outer arc (slow CW, two visible quarter arcs) */}
      <Animated.View style={[
        styles.ringBase,
        {
          width: s.r1 * 2, height: s.r1 * 2, borderRadius: s.r1,
          borderColor: color,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          opacity: 0.4,
          transform: [{ rotate: cw(ring1Spin) }],
        }
      ]} />
      {/* Ring 1 glowing leading dot */}
      <Animated.View style={{
        position: 'absolute',
        width: s.dot + 4, height: s.dot + 4, borderRadius: (s.dot + 4) / 2,
        backgroundColor: color,
        shadowColor: color, shadowOpacity: 1, shadowRadius: 10, elevation: 8,
        transform: [{ rotate: cw(ring1Spin) }, { translateY: -s.r1 }],
      }} />

      {/* ── RING 2: mid arc (medium CCW) ─────────────────────── */}
      <Animated.View style={[
        styles.ringBase,
        {
          width: s.r2 * 2, height: s.r2 * 2, borderRadius: s.r2,
          borderColor: color,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          opacity: 0.6,
          borderWidth: 2,
          transform: [{ rotate: ccw(ring2Spin) }],
        }
      ]} />
      {/* Ring 2 white leading dot */}
      <Animated.View style={{
        position: 'absolute',
        width: s.dot + 2, height: s.dot + 2, borderRadius: (s.dot + 2) / 2,
        backgroundColor: '#fff',
        shadowColor: '#fff', shadowOpacity: 0.9, shadowRadius: 8, elevation: 6,
        transform: [{ rotate: ccw(ring2Spin) }, { translateY: -s.r2 }],
      }} />

      {/* ── RING 3: inner arc (fast CW) ──────────────────────── */}
      <Animated.View style={[
        styles.ringBase,
        {
          width: s.r3 * 2, height: s.r3 * 2, borderRadius: s.r3,
          borderColor: '#fff',
          borderTopColor: 'transparent',
          borderLeftColor: 'transparent',
          opacity: 0.75,
          borderWidth: 1.5,
          transform: [{ rotate: cw(ring3Spin) }],
        }
      ]} />

      {/* ── CENTER: green glowing storefront button ───────────── */}
      <Animated.View style={{
        position: 'absolute',
        width: s.center, height: s.center, borderRadius: s.center / 2,
        backgroundColor: color,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: color,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6, shadowRadius: 20, elevation: 16,
        transform: [{ scale: centerScale }],
      }}>
        <Ionicons name="storefront" size={s.icon} color="#fff" />
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  ringBase: {
    position: 'absolute',
    borderWidth: 2.5,
  },
});



