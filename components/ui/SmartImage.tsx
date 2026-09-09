import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle, StyleProp } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface SmartImageProps extends Omit<ImageProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  source,
  style,
  containerStyle,
  contentFit = 'cover',
  fallbackIcon = 'image-outline',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Pulse shimmer animation for skeleton state (Flipkart / Amazon style)
  useEffect(() => {
    if (!isLoaded && !hasError) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 650, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isLoaded, hasError]);

  const uri = typeof source === 'object' && source !== null && 'uri' in source ? (source as any).uri : null;

  return (
    <View style={[styles.container, containerStyle, style]}>
      {/* ── Skeleton Placeholder ── */}
      {(!isLoaded && !hasError) && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.skeleton,
            { opacity: pulseAnim }
          ]}
        />
      )}

      {/* ── Error Fallback ── */}
      {hasError || !uri ? (
        <View style={[StyleSheet.absoluteFill, styles.errorBox]}>
          <Ionicons name={fallbackIcon} size={24} color="#94a3b8" />
        </View>
      ) : (
        <Image
          source={source}
          style={[StyleSheet.absoluteFill, style]}
          contentFit={contentFit}
          transition={250}
          cachePolicy="memory-disk"
          onLoad={(e) => {
            setIsLoaded(true);
            if (onLoad) onLoad(e);
          }}
          onError={(e) => {
            setHasError(true);
            if (onError) onError(e);
          }}
          {...props}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  skeleton: {
    backgroundColor: '#e2e8f0',
  },
  errorBox: {
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
