import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image, Easing } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedLoader } from '@/components/AnimatedLoader';

export function CustomSplashScreen({ ready, onFinish }: { ready: boolean; onFinish: () => void }) {
  const logoScale = useRef(new Animated.Value(1)).current; // Start at 1 to match native splash perfectly
  const logoOpacity = useRef(new Animated.Value(1)).current; // Start fully visible to match native splash
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hide the native splash screen now that our custom identical one is rendered
    SplashScreen.hideAsync();

    // Start a subtle heartbeat/bounce for the logo while loading
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  // When ready becomes true, exit animation
  useEffect(() => {
    if (ready) {
      Animated.sequence([
        // Small pause to let user see it
        Animated.delay(300),
        // Zoom in massively and fade out
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 20,
            duration: 600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(containerOpacity, {
            toValue: 0,
            duration: 500,
            delay: 100, // fade out slightly after zooming starts
            useNativeDriver: true,
          })
        ])
      ]).start(() => {
        onFinish();
      });
    }
  }, [ready]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity, alignItems: 'center' }}>
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        
        <AnimatedLoader size="large" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Match app.json native splash background perfectly!
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 50,
  }
});
