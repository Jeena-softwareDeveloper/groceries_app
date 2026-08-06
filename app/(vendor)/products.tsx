import React, { useState, useCallback } from 'react';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, ActivityIndicator, RefreshControl, Modal, ScrollView, Alert, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { vendorApi, type VendorProduct } from '@/api/vendor.api';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { api } from '@/api/client';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'PUBLISHED', label: 'Active' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PENDING_REVIEW', label: 'Pending' },
  { key: 'REJECTED', label: 'Rejected' },
];

function getStatusStyle(s: string) {
  const map: Record<string, { bg: string; color: string; label: string; icon: string }> = {
    DRAFT: { bg: '#f3f4f6', color: '#4b5563', label: 'Draft', icon: 'file-text' },
    PENDING_REVIEW: { bg: '#fef3c7', color: '#d97706', label: 'Pending Approval', icon: 'clock' },
    PUBLISHED: { bg: '#dcfce7', color: '#16a34a', label: 'Active', icon: 'check-circle' },
    REJECTED: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected', icon: 'alert-circle' },
    UNPUBLISHED: { bg: '#f3f4f6', color: '#4b5563', label: 'Unpublished', icon: 'eye-off' },
  };
  return map[s] ?? { bg: '#f3f4f6', color: '#4b5563', label: s, icon: 'info' };
}

// ─── Product Form Modal ───────────────────────────────────────────────────────

function ProductFormModal({
  visible,
  onClose,
  product,
  categories,
}: {
  visible: boolean;
  onClose: () => void;
  product: VendorProduct | null;
  categories: { id: string; name: string }[];
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: product?.name ?? '',
    categoryId: product?.categoryId ?? '',
    description: product?.description ?? '',
    mrp: product?.mrp ? String(product.mrp) : '',
    sellingPrice: product?.sellingPrice ? String(product.sellingPrice) : '',
    unit: product?.unit ?? 'piece',
    stock: product?.inventory?.stock ? String(product.inventory.stock) : '0',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);

  // reset form when product changes
  React.useEffect(() => {
    if (visible) {
      setForm({
        name: product?.name ?? '',
        categoryId: product?.categoryId ?? '',
        description: product?.description ?? '',
        mrp: product?.mrp ? String(product.mrp) : '',
        sellingPrice: product?.sellingPrice ? String(product.sellingPrice) : '',
        unit: product?.unit ?? 'piece',
        stock: product?.inventory?.stock ? String(product.inventory.stock) : '0',
      });
      if (product?.images?.length) {
        setImages(product.images.map((img: any) => img.url));
        const pIndex = product.images.findIndex((img: any) => img.isPrimary);
        setPrimaryIndex(pIndex >= 0 ? pIndex : 0);
      } else {
        setImages([]);
        setPrimaryIndex(0);
      }
    }
  }, [product, visible]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newUris]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (primaryIndex === index) {
      setPrimaryIndex(0);
    } else if (primaryIndex > index) {
      setPrimaryIndex(p => p - 1);
    }
  };

  const handleSave = async () => {
    try {
      if (!form.name || !form.categoryId || !form.mrp || !form.sellingPrice || !form.unit) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }
      setLoading(true);

      // Upload images to Cloudinary
      const uploadedImages = [];
      if (images.length > 0) {
        let sigData: any = null;
        for (let i = 0; i < images.length; i++) {
          const uri = images[i];
          if (uri.startsWith('http')) {
            uploadedImages.push({ id: '', url: uri, isPrimary: i === primaryIndex });
            continue;
          }
          if (!sigData) {
            const sigRes = await api.get<{ data: { signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string } }>('/upload/signature?folder=districtmart/products');
            sigData = sigRes.data.data;
          }
          const formBody = new FormData();
          if (Platform.OS === 'web') {
            const response = await fetch(uri);
            const blob = await response.blob();
            formBody.append('file', blob, 'upload.jpg');
          } else {
            formBody.append('file', { uri, name: 'upload.jpg', type: 'image/jpeg' } as any);
          }
          formBody.append('api_key', sigData.apiKey);
          formBody.append('timestamp', sigData.timestamp.toString());
          formBody.append('signature', sigData.signature);
          formBody.append('folder', sigData.folder);

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
            method: 'POST',
            body: formBody,
          });
          if (!uploadRes.ok) throw new Error('Cloudinary upload failed');
          const uploadData = await uploadRes.json();
          uploadedImages.push({ id: '', url: uploadData.secure_url, isPrimary: i === primaryIndex });
        }
      }

      const data = {
        ...form,
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        mrp: Number(form.mrp),
        sellingPrice: Number(form.sellingPrice),
        stock: Number(form.stock),
        images: uploadedImages,
      };

      if (product) {
        await vendorApi.updateProduct(product.id, data);
      } else {
        await vendorApi.createProduct(data);
      }
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={modalStyles.safe} edges={['top', 'bottom']}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{product ? 'Edit Product' : 'Add Product'}</Text>
          <Pressable onPress={onClose} style={modalStyles.closeBtn}>
            <Feather name="x" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView style={modalStyles.body} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          {product && product.status !== 'DRAFT' && (
            <View style={modalStyles.warningBanner}>
              <Feather name="info" size={16} color="#d97706" />
              <Text style={modalStyles.warningText}>Editing this product will reset its status to Draft and require re-approval.</Text>
            </View>
          )}

          <Input
            label="Product Name *"
            value={form.name}
            onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
            placeholder="e.g. Organic Tomatoes"
          />

          <Select
            label="Category *"
            options={(categories ?? []).map((c) => ({ label: c.name, value: c.id }))}
            value={form.categoryId}
            onSelect={(v) => setForm((f) => ({ ...f, categoryId: v }))}
            placeholder="Select a category"
          />

          <Input
            label="Description"
            value={form.description}
            onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
            placeholder="Product details..."
            multiline
            style={{ height: 80, textAlignVertical: 'top' }}
          />

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Input
              label="MRP (₹) *"
              value={form.mrp}
              onChangeText={(t) => setForm((f) => ({ ...f, mrp: t }))}
              placeholder="0.00"
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Selling Price (₹) *"
              value={form.sellingPrice}
              onChangeText={(t) => setForm((f) => ({ ...f, sellingPrice: t }))}
              placeholder="0.00"
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Input
              label="Unit *"
              value={form.unit}
              onChangeText={(t) => setForm((f) => ({ ...f, unit: t }))}
              placeholder="e.g. 1 kg, piece"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Stock Quantity"
              value={form.stock}
              onChangeText={(t) => setForm((f) => ({ ...f, stock: t }))}
              placeholder="0"
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <Text style={{ fontSize: 14, color: colors.text, marginBottom: spacing.sm, fontFamily: fonts.medium }}>Product Photos (Tap to set primary)</Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {images.map((uri, index) => (
                <Pressable key={index} style={{ position: 'relative' }} onPress={() => setPrimaryIndex(index)}>
                  <Image 
                    source={{ uri }} 
                    style={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: radius.md, 
                      backgroundColor: colors.surface,
                      borderWidth: primaryIndex === index ? 2 : 0,
                      borderColor: colors.primary
                    }} 
                  />
                  {primaryIndex === index && (
                    <View style={{ position: 'absolute', top: -5, left: -5, backgroundColor: colors.primary, borderRadius: 12, padding: 4 }}>
                      <Feather name="star" size={12} color="#fff" />
                    </View>
                  )}
                  <Pressable 
                    onPress={() => removeImage(index)}
                    style={{ position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 12, padding: 2 }}
                  >
                    <Feather name="x" size={14} color="#fff" />
                  </Pressable>
                </Pressable>
              ))}
              
              <Pressable 
                onPress={pickImages}
                style={{ width: 80, height: 80, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}
              >
                <Feather name="plus" size={24} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

        </ScrollView>

        <View style={modalStyles.footer}>
          <Button title={product ? 'Save Changes' : 'Create Product'} onPress={handleSave} loading={loading} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VendorProducts() {
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();

  const queryClient = useQueryClient();

  // Queries
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-products', activeTab, search, page],
    queryFn: () => vendorApi.listProducts({ status: activeTab || undefined, search: search || undefined, page }),
    staleTime: 0,
  });

  // Refetch every time the screen is focused so status changes (e.g. approved) are visible immediately
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const { data: categories } = useQuery({
    queryKey: ['vendor-categories'],
    queryFn: vendorApi.getCategories,
    staleTime: 300000,
  });

  // Mutations
  const submitMutation = useMutation({
    mutationFn: (id: string) => vendorApi.submitForApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message ?? 'Submission failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message ?? 'Deletion failed'),
  });

  const handleEdit = (product: VendorProduct) => {
    setSelectedProduct(product);
    setIsModalVisible(true);
  };

  const handleView = (product: VendorProduct) => {
    router.push(`/product/${product.id}`);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this product?');
      if (confirmed) {
        deleteMutation.mutate(id);
      }
    } else {
      Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]);
    }
  };

  const products: VendorProduct[] = data?.data ?? [];
  const meta = data?.meta;
  const onRefresh = useCallback(() => { setPage(1); refetch(); }, [refetch]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 }}>
                <View style={[styles.searchBar, { flex: 1, marginHorizontal: 0, marginTop: 0 }]}>
                  <Feather name="search" size={16} color={colors.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { paddingVertical: 6, fontSize: 14 }]}
                    placeholder="Search products..."
                    placeholderTextColor={colors.textMuted}
                    value={search}
                    onChangeText={(t) => {
                      setSearch(t);
                      setPage(1);
                    }}
                  />
                  {search !== '' && (
                    <Pressable onPress={() => setSearch('')}>
                      <Feather name="x" size={16} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>
                <Pressable
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.primary,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 20,
                    gap: 6,
                  }}
                  onPress={handleAdd}
                >
                  <Feather name="plus" size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontFamily: fonts.semiBold, fontSize: 13 }}>Add</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          ),
        }}
      />

      {/* Status Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {STATUS_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label} {activeTab === tab.key && meta ? `(${meta.total})` : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Products List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <Feather name="box" size={42} color={colors.primary} />
          </View>
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubText}>
            {search || activeTab
              ? 'No matching products for your search or category filter.'
              : 'You have not added any products to your catalog yet.'}
          </Text>
          {(search !== '' || activeTab !== '') && (
            <Pressable
              style={styles.resetBtn}
              onPress={() => {
                setSearch('');
                setActiveTab('');
              }}
            >
              <Feather name="refresh-cw" size={14} color={colors.white} />
              <Text style={styles.resetBtnText}>Reset Filters</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const st = getStatusStyle(item.status);
            const approval = item.approvals?.[0]; // latest approval if any
            return (
              <View style={cardStyles.card}>
                <View style={cardStyles.topRow}>
                  <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', gap: spacing.md }}>
                    {item.images?.[0] ? (
                      <Image source={{ uri: item.images[0].url }} style={{ width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.surface }} />
                    ) : (
                      <View style={{ width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="image" size={20} color={colors.border} />
                      </View>
                    )}
                    <View style={{ flex: 1, paddingRight: spacing.sm }}>
                      <Text style={cardStyles.name} numberOfLines={1}>{item.name}</Text>
                      <Text style={cardStyles.category}>{item.category?.name ?? 'Uncategorized'}</Text>
                    </View>
                  </View>
                  <View style={[cardStyles.badge, { backgroundColor: st.bg, flexDirection: 'row', alignItems: 'center' }]}>
                    <Feather name={st.icon as any} size={12} color={st.color} />
                    {item.status !== 'DRAFT' && (
                      <Text style={[cardStyles.badgeText, { color: st.color, marginLeft: 4 }]}>{st.label}</Text>
                    )}
                  </View>
                </View>

                <View style={cardStyles.divider} />

                <View style={cardStyles.midRow}>
                  <Text style={cardStyles.price}>₹{Number(item.sellingPrice).toFixed(0)} <Text style={cardStyles.unit}>/ {item.unit}</Text></Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Text style={cardStyles.stock}>Stock: <Text style={{ fontFamily: fonts.bold }}>{item.inventory?.stock ?? 0}</Text></Text>
                    
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable style={cardStyles.smallIconBtn} onPress={() => handleView(item)}>
                        <Feather name="eye" size={14} color={colors.text} />
                      </Pressable>
                      <Pressable style={cardStyles.smallIconBtn} onPress={() => handleEdit(item)}>
                        <Feather name="edit-2" size={14} color={colors.text} />
                      </Pressable>
                      <Pressable style={[cardStyles.smallIconBtn, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]} onPress={() => handleDelete(item.id)}>
                        <Feather name="trash-2" size={14} color="#dc2626" />
                      </Pressable>
                    </View>
                  </View>
                </View>

                {item.status === 'REJECTED' && approval?.rejectionReason && (
                  <View style={cardStyles.rejectBanner}>
                    <Feather name="alert-circle" size={14} color="#dc2626" />
                    <Text style={cardStyles.rejectText}>{approval.rejectionReason}</Text>
                  </View>
                )}

                {item.status === 'DRAFT' && (
                  <View style={cardStyles.actions}>
                    <Pressable
                      style={cardStyles.submitBtn}
                      onPress={() => submitMutation.mutate(item.id)}
                      disabled={submitMutation.isPending}
                    >
                      <Text style={cardStyles.submitBtnText}>Submit for Approval</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />}
          onEndReached={() => { if (meta && page * meta.limit < meta.total) setPage(p => p + 1); }}
          onEndReachedThreshold={0.3}
        />
      )}

      {/* Product Modal */}
      <ProductFormModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        product={selectedProduct}
        categories={categories ?? []}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  total: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.medium, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    gap: 6,
  },
  addBtnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: radius.xl,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, fontFamily: fonts.regular },
  tabsWrapper: {
    height: 56,
    maxHeight: 56,
    marginTop: 8,
    flexGrow: 0,
    flexShrink: 0,
  },
  tabsContainer: { flexGrow: 0, height: 56 },
  tabsContent: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: 8,
    height: 56,
  },
  tab: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, fontFamily: fonts.medium, color: '#64748b' },
  tabTextActive: { color: colors.white, fontFamily: fonts.bold },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  loadingText: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.medium, marginTop: 4 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  emptySubText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19, maxWidth: 260 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  resetBtnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, marginBottom: 2 },
  category: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.medium },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontFamily: fonts.bold },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: spacing.sm },
  midRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 18, fontFamily: fonts.bold, color: colors.primary },
  unit: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.regular },
  stock: { fontSize: 13, color: '#334155', fontFamily: fonts.medium },
  rejectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rejectText: { fontSize: 12, color: '#dc2626', flex: 1 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  submitBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  submitBtnText: { color: colors.white, fontSize: 12, fontFamily: fonts.bold },
  smallIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});

const modalStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: spacing.md },
  warningBanner: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#fffbeb', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
  warningText: { fontSize: 12, color: '#b45309', flex: 1 },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
});
