import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import type { Category } from '@/types/customer';

interface CategoryCardProps {
  category: Category;
  onPress?: () => void;
}

const GRADIENTS: [string, string][] = [
  ['#dcfce7', '#bbf7d0'],
  ['#dbeafe', '#bfdbfe'],
  ['#fef3c7', '#fde68a'],
  ['#fce7f3', '#fbcfe8'],
  ['#e0e7ff', '#c7d2fe'],
];

function hashIndex(id: string) {
  return id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % GRADIENTS.length;
}

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  const [from] = GRADIENTS[hashIndex(category.id)];
  // We'll use a placeholder image URL for the mockup if category.imageUrl is missing
  const imageUrl = (category as any).imageUrl || null;

  return (
    <Pressable style={styles.wrap} onPress={onPress}>
      <View style={[styles.circle, !imageUrl && { backgroundColor: from }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={styles.initial}>{category.name.charAt(0).toUpperCase()}</Text>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 72,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#e5e7eb', // subtle border
    overflow: 'hidden',
  },
  image: {
    width: 48,
    height: 48,
  },
  initial: { fontSize: 24, fontFamily: fonts.bold, color: colors.primaryDark },
  name: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
});
