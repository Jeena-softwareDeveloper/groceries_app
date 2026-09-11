import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle, StyleProp } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

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

  // Extract URI for logging and validation
  const uri = source != null && typeof source === 'object' && 'uri' in source
    ? (source as any).uri as string | undefined
    : undefined;

  const hasValidUri = typeof uri === 'string' && uri.length > 0;

  // Reset state when source changes (prevents stale error from previous URL)
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [uri]);

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
          // 'disk' avoids in-memory stale cache; still fast on re-renders
          cachePolicy="disk"
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={(e) => {
            // Log the failing URL so we can diagnose production image issues
            console.warn('[SmartImage] Failed to load image:', uri, e?.error ?? '');
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
