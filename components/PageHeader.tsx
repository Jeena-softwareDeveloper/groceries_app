import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  TextInput,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PageHeaderProps {
  /** Page title shown in the center */
  title?: string;
  /** Show back arrow button (default: true) */
  showBack?: boolean;
  /** Show search bar below the title row (default: false) */
  showSearch?: boolean;
  /** Called when search text changes (enables live input mode) */
  onSearch?: (text: string) => void;
  /** Placeholder hints to cycle through (typewriter effect) */
  searchHints?: string[];
  /** Right-side extra element (e.g. filter icon) */
  rightElement?: React.ReactNode;
  /** Called when back button pressed (default: router.back()) */
  onBack?: () => void;
  style?: ViewStyle;
}

export function PageHeader({
  title,
  showBack = true,
  showSearch = false,
  onSearch,
  searchHints = ['Search products...', 'Try "Milk"...', 'Try "Rice"...'],
  rightElement,
  onBack,
  style,
}: PageHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Animated glow border ─────────────────────────────────────────────────
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showSearch) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1400, useNativeDriver: false }),
      ])
    ).start();
  }, [showSearch]);

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e2e8f0', '#86efac'],
  });
  const glowShadow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.22],
  });

  // ── Typewriter placeholder (only when onSearch is NOT provided) ───────────
  const [hintIdx, setHintIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!showSearch || onSearch) return; // live input mode — no typewriter
    const hint = searchHints[hintIdx];
    let t: any;
    if (!deleting && typed.length < hint.length) {
      t = setTimeout(() => setTyped(hint.slice(0, typed.length + 1)), 60);
    } else if (!deleting && typed.length === hint.length) {
      t = setTimeout(() => setDeleting(true), 1400);
    } else if (deleting && typed.length > 0) {
      t = setTimeout(() => setTyped(typed.slice(0, -1)), 35);
    } else if (deleting && typed.length === 0) {
      setDeleting(false);
      setHintIdx((i) => (i + 1) % searchHints.length);
    }
    return () => clearTimeout(t);
  }, [typed, deleting, hintIdx, showSearch, onSearch]);

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    router.back();
  };

  const hasTopRow = showBack || title || rightElement;

  return (
    <View style={[styles.container, { paddingTop: insets.top > 0 ? insets.top + 4 : 12 }, style]}>
      {/* ── TOP ROW: Back | Title | Right ── */}
      {hasTopRow && (
      <View style={styles.topRow}>
        {/* Back Button */}
        {showBack ? (
          <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}

        {/* Title */}
        {title ? (
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {/* Right Element */}
        <View style={styles.rightSlot}>
          {rightElement ?? <View style={styles.backBtnPlaceholder} />}
        </View>
      </View>
      )}

      {/* ── SEARCH BAR ── */}
      {showSearch && (
        <View style={styles.searchWrap}>
          <Animated.View
            style={[
              styles.searchOuter,
              { borderColor: glowColor, shadowOpacity: glowShadow },
            ]}
          >
            {onSearch ? (
              // Live input mode
              <View style={styles.searchInner}>
                <Ionicons name="search-outline" size={18} color={colors.primary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={searchHints[0]}
                  placeholderTextColor="#94a3b8"
                  value={searchText}
                  onChangeText={(t) => { setSearchText(t); onSearch(t); }}
                  autoCorrect={false}
                />
                {searchText.length > 0 && (
                  <Pressable onPress={() => { setSearchText(''); onSearch(''); }}>
                    <Ionicons name="close-circle" size={18} color="#94a3b8" />
                  </Pressable>
                )}
              </View>
            ) : (
              // Typewriter / tap-to-search mode
              <Pressable
                style={styles.searchInner}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Ionicons name="search-outline" size={18} color={colors.primary} />
                <Text style={styles.searchPlaceholder}>
                  {typed}
                  <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>|</Text>
                </Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  backBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginHorizontal: 8,
  },
  rightSlot: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
  searchWrap: {
    marginTop: 8,
  },
  searchOuter: {
    borderRadius: radius.full,
    borderWidth: 1.5,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: '#fff',
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: 8,
    height: 46,
    borderRadius: radius.full,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#94a3b8',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
});
