import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, fonts, typography } from '@/constants/theme';
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
  const imageUrl = (category as any).imageUrl || null;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.imageWrap, !imageUrl && { backgroundColor: from }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={styles.initial}>{category.name.charAt(0).toUpperCase()}</Text>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {category.name.replace(' & ', '\n& ')} 
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 76,
    alignItems: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xs,
    paddingBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  imageWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  image: {
    width: 40,
    height: 40,
  },
  initial: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#333',
  },
  name: {
    ...typography.caption,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 12,
    fontSize: 10,
    height: 24, // force 2 lines
  },
});
