import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle, StyleProp } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { IMAGE_CACHE_POLICY } from '@/utils/constants';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SmartImageProps {
  source: ImageSource | null | undefined;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  onLoad?: () => void;
  onError?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const SmartImage: React.FC<SmartImageProps> = ({
  source,
  style,
  containerStyle,
  contentFit = 'cover',
  fallbackIcon = 'image-outline',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Validate source has a non-empty URI
  const hasValidUri =
    source != null &&
    typeof source === 'object' &&
    'uri' in source &&
    typeof (source as any).uri === 'string' &&
    (source as any).uri.length > 0;

  // Shimmer pulse animation while loading (Flipkart / Amazon skeleton style)
  useEffect(() => {
    if (!isLoaded && !hasError && hasValidUri) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 650, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isLoaded, hasError, hasValidUri]);

  return (
    <View style={[styles.container, containerStyle, style]}>
      {/* Skeleton shimmer — shown while valid image is loading */}
      {!isLoaded && !hasError && hasValidUri && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.skeleton, { opacity: pulseAnim }]} />
      )}

      {/* Fallback icon — no source provided or load error */}
      {!hasValidUri || hasError ? (
        <View style={[StyleSheet.absoluteFill, styles.errorBox]}>
          <Ionicons name={fallbackIcon} size={24} color="#94a3b8" />
        </View>
      ) : (
        <Image
          source={source as ImageSource}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          transition={250}
          // In dev: 'none' = always load fresh. In production: 'memory-disk' for speed.
          cachePolicy={IMAGE_CACHE_POLICY}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            setHasError(true);
            onError?.();
          }}
        />
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
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
