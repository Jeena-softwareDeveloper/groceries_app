import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface AnimatedLoaderProps {
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export function AnimatedLoader({ color = colors.primary, size = 'large' }: AnimatedLoaderProps) {
  const orbits = ['basket-outline', 'fast-food-outline', 'pricetags-outline', 'cart-outline', 'bag-handle-outline'] as const;
  
  // One animation value for each orbiting icon (0 means far away, 1 means sucked into the center)
  const animsRef = useRef<Animated.Value[]>([]);
  if (animsRef.current.length !== orbits.length) {
    animsRef.current = orbits.map(() => new Animated.Value(0));
  }
  const anims = animsRef.current;
  
  const homePulse = useRef(new Animated.Value(1)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Staggered fly-in for the icons
    const flyInAnimations = anims.map((anim) => {
      return Animated.sequence([
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1600, // Slower, more visible pull
          easing: Easing.in(Easing.cubic), // Smooth acceleration instead of abrupt snap
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.loop(
      Animated.stagger(600, flyInAnimations)
    ).start();

    // 2. Continuous pulse for the home icon to simulate absorbing/pulling
    // Total cycle time = 600ms to perfectly sync with the 600ms stagger!
    Animated.loop(
      Animated.sequence([
        Animated.timing(homePulse, { toValue: 1.15, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(homePulse, { toValue: 1, duration: 350, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // 3. Slow global rotation for a magical/dynamic feel
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 12000, // Slightly slower rotation for a calmer vibe
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const getSizing = () => {
    switch (size) {
      case 'small': return { center: 48, orbitRadius: 55, satellite: 28, icon: 14 };
      case 'medium': return { center: 64, orbitRadius: 75, satellite: 36, icon: 18 };
      case 'large': 
      default:
        // Nice and big for the landing page
        return { center: 86, orbitRadius: 95, satellite: 48, icon: 24 };
    }
  };

  const sizing = getSizing();
  
  const globalSpin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ width: sizing.orbitRadius * 2 + sizing.satellite, height: sizing.orbitRadius * 2 + sizing.satellite, justifyContent: 'center', alignItems: 'center' }}>
      
      {/* Container for orbiting icons with a slow spin */}
      <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', transform: [{ rotate: globalSpin }] }]}>
        {orbits.map((iconName, index) => {
          // Calculate initial position on the circle
          const angle = (index * (360 / orbits.length) - 90) * (Math.PI / 180);
          const startX = Math.cos(angle) * sizing.orbitRadius;
          const startY = Math.sin(angle) * sizing.orbitRadius;
          const anim = anims[index];

          const translateX = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [startX, 0], // Move from outer rim to center
          });
          
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [startY, 0],
          });
          
          const scale = anim.interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, 1, 1, 0.2], // Pop in, stay size, then shrink as it drops into home
          });
          
          const opacity = anim.interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, 1, 1, 0], // Fade in, then fade out exactly as it hits center
          });

          return (
            <Animated.View 
              key={iconName}
              style={[
                styles.satelliteCircle,
                { 
                  width: sizing.satellite, 
                  height: sizing.satellite, 
                  borderRadius: sizing.satellite / 2,
                  position: 'absolute',
                  opacity,
                  transform: [
                    { translateX },
                    { translateY },
                    { scale }
                  ]
                }
              ]}
            >
              <Ionicons name={iconName} size={sizing.icon} color={color} />
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Central Home Icon */}
      <Animated.View style={{ zIndex: 10 }}>
        <Animated.View style={[styles.centerCircle, { width: sizing.center, height: sizing.center, borderRadius: sizing.center / 2, transform: [{ scale: homePulse }] }]}>
          <Ionicons name="storefront" size={sizing.center * 0.55} color="#fff" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerCircle: {
    backgroundColor: colors.primary, // Back to green/primary theme for the home
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  satelliteCircle: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  }
});
