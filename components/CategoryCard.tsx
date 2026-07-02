import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
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

  return (
    <Pressable style={styles.wrap} onPress={onPress}>
      <View style={[styles.circle, { backgroundColor: from }]}>
        <Text style={styles.initial}>{category.name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 80,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  initial: { fontSize: 24, fontWeight: '700', color: colors.primaryDark },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
});
