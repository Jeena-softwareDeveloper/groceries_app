import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InnerHeader } from '@/components/InnerHeader';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '@/api/category.api';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CategoriesScreen() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.fetchCategories,
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const selectedCategory = categories?.find(c => c.id === selectedCategoryId);
  const subCategories = selectedCategory?.children || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <InnerHeader title="All Categories" />
      
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.splitContainer}>
          {/* Left Side: Parent Categories */}
          <View style={styles.sidebar}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarContent}>
              {categories?.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <Pressable
                    key={cat.id}
                    style={[styles.parentItem, isSelected && styles.parentItemSelected]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <View style={styles.parentIconBox}>
                      {cat.imageUrl ? (
                        <Image source={{ uri: cat.imageUrl }} style={styles.parentIcon} resizeMode="contain" />
                      ) : (
                        <Ionicons name="basket-outline" size={24} color={isSelected ? colors.primary : colors.textMuted} />
                      )}
                    </View>
                    <Text style={[styles.parentName, isSelected && styles.parentNameSelected]}>
                      {cat.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} style={styles.chevron} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Right Side: Subcategories */}
          <View style={styles.mainContent}>
            {selectedCategory && (
              <Text style={styles.subHeader}>{selectedCategory.name} Subcategories</Text>
            )}
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.subGrid}>
              {subCategories.length > 0 ? (
                subCategories.map((sub) => (
                  <Pressable
                    key={sub.id}
                    style={styles.subCard}
                    onPress={() => router.push(`/(tabs)/search?q=${encodeURIComponent(sub.name)}&categoryId=${sub.id}`)}
                  >
                    <View style={styles.subImageBox}>
                      {sub.imageUrl ? (
                        <Image source={{ uri: sub.imageUrl }} style={styles.subImage} resizeMode="contain" />
                      ) : (
                        <Ionicons name="image-outline" size={32} color={colors.border} />
                      )}
                    </View>
                    <Text style={styles.subName} numberOfLines={2}>
                      {sub.name}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No subcategories found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splitContainer: { flex: 1, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  
  // Sidebar
  sidebar: {
    width: 130,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  sidebarContent: {
    paddingVertical: spacing.sm,
    paddingBottom: 100, // Added to clear bottom tabs
  },
  parentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  parentItemSelected: {
    backgroundColor: '#f0fdf4', // light green
  },
  parentIconBox: {
    width: 32,
    height: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  parentIcon: {
    width: 20,
    height: 20,
  },
  parentName: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  parentNameSelected: {
    color: colors.primary,
  },
  chevron: {
    marginLeft: 4,
  },

  // Main Content
  mainContent: {
    flex: 1,
    backgroundColor: '#f8fafc', // light gray background for right side
    padding: spacing.md,
  },
  subHeader: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  subGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 120, // Added to clear bottom tabs properly
  },
  subCard: {
    width: '48%', // two columns
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subImageBox: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  subImage: {
    width: '100%',
    height: '100%',
  },
  subName: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text,
    textAlign: 'center',
  },
  
  emptyBox: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 13,
  }
});
