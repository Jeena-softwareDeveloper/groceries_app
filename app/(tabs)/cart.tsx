import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { cartApi, orderApi, customerApi } from '@/api';
import { Button } from '@/components/Button';
import { SuccessState } from '@/components/ui';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setItemCount } from '@/store/cartSlice';
import type { Address } from '@/types/customer';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated } from 'react-native';

function formatPrice(n: number) {
  return `₹${n.toFixed(0)}`;
}

export default function CartScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const appSettings = useAppSelector((s) => s.config.appSettings);
  const [showCheckout, setShowCheckout] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutAddressId, setCheckoutAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    line1: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isChangingAddress, setIsChangingAddress] = useState(false);

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.fetchCart,
  });

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: customerApi.fetchAddresses,
    enabled: true,
  });

  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      )
    ]).start();
  }, []);

  useEffect(() => {
    if (addressForm.pincode.length === 6) {
      customerApi.lookupPincode(addressForm.pincode).then(data => {
        if (data.district && data.state) {
          setAddressForm(f => ({ ...f, city: data.district, state: data.state }));
        }
      }).catch(console.error);
    }
  }, [addressForm.pincode]);

  useEffect(() => {
    if (addressesQuery.data && addressesQuery.data.length > 0 && !selectedAddressId) {
      const defaultAddr = addressesQuery.data.find((a: Address) => a.isDefault) || addressesQuery.data[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addressesQuery.data, selectedAddressId]);

  useEffect(() => {
    const count = cartQuery.data?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
    dispatch(setItemCount(count));
  }, [cartQuery.data, dispatch]);

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartApi.updateCartItem(productId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => cartApi.removeFromCart(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const checkoutMutation = useMutation({
    mutationFn: (addressId: string) => orderApi.checkout(addressId, 'COD'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowCheckoutModal(false);
      setIsSuccess(true);
    },
    onError: (e) => Alert.alert('Checkout failed', e instanceof Error ? e.message : 'Try again'),
  });

  const createAddressMutation = useMutation({
    mutationFn: () => customerApi.createAddress(addressForm),
    onSuccess: (newAddress) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setAddressForm({ label: 'Home', line1: '', city: '', state: '', pincode: '' });
      setShowAddressForm(false);
      setIsChangingAddress(false);
      if (newAddress && newAddress.id) {
        setSelectedAddressId(newAddress.id);
      }
    },
  });

  if (isSuccess) {
    return (
      <SuccessState
        title="Order Placed!"
        message="Your order has been placed successfully."
        buttonText="View Orders"
        onButtonPress={() => {
          setIsSuccess(false);
          router.push('/(tabs)/orders');
        }}
      />
    );
  }

  if (cartQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const allItems = cartQuery.data?.items ?? [];
  const itemsCount = allItems.reduce((acc, item) => acc + item.quantity, 0);

  if (!allItems.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Animated.View 
            style={{ 
              opacity: fadeAnim, 
              transform: [{ translateY: floatAnim }],
              marginBottom: spacing.xl,
              backgroundColor: '#dcfce7',
              padding: 30,
              borderRadius: 100,
            }}
          >
            <Ionicons name="cart-outline" size={70} color={colors.primary} />
          </Animated.View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyDesc}>Browse shops and add items to get started.</Text>
          <Button title="Browse stores" onPress={() => router.push('/(tabs)')} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const subtotal = allItems.reduce((s, i) => s + Number(i.product.mrp || i.product.sellingPrice) * i.quantity, 0);
  const totalSellingPrice = allItems.reduce((s, i) => s + Number(i.product.sellingPrice) * i.quantity, 0);
  const savings = subtotal - totalSellingPrice;
  const platformFee = appSettings?.platformFee ?? 0;
  const taxPercent = appSettings?.taxPercent ?? 0;
  const gst = Math.round(totalSellingPrice * taxPercent / 100);
  const deliveryFee = appSettings?.deliveryFee ?? 0;
  const minOrderValue = appSettings?.minOrderValue ?? 0;
  const toPay = totalSellingPrice + platformFee + gst + deliveryFee;

  const selectedAddrObj = addressesQuery.data?.find((a: Address) => a.id === selectedAddressId);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Sticky Header */}
      <LinearGradient colors={['#e0f2e9', '#d1fae5']} style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#d1fae5', '#f9fafb']}
          style={styles.headerGradient}
        >



          <View style={styles.deliveryBox}>
             <View style={styles.deliveryLeft}>
                <View style={styles.pinIconWrap}>
                   <Ionicons name="location" size={16} color="#15803d" />
                </View>
                <View style={{ flexShrink: 1 }}>
                   <Text style={styles.deliveringTo}>Delivering to</Text>
                   {selectedAddrObj ? (
                     <>
                        <Text style={styles.deliveryAddressText} numberOfLines={1}>
                           {selectedAddrObj.line1}, {selectedAddrObj.city} {selectedAddrObj.pincode}
                        </Text>
                        <View style={styles.deliveryActions}>
                           <Text style={styles.deliveryLabel}>{selectedAddrObj.label}</Text>
                           <Text style={styles.deliveryDivider}>|</Text>
                           <TouchableOpacity onPress={() => setIsChangingAddress(true)}>
                              <Text style={styles.changeText}>Change</Text>
                           </TouchableOpacity>
                        </View>
                     </>
                   ) : (
                     <TouchableOpacity onPress={() => setShowAddressForm(true)}>
                        <Text style={styles.changeText}>+ Add Address</Text>
                     </TouchableOpacity>
                   )}
                </View>
             </View>
             <View style={styles.deliveryRight}>
               <Ionicons name="bicycle" size={32} color={colors.primary} />
             </View>
          </View>
        </LinearGradient>

        {(isChangingAddress || (!selectedAddressId && showAddressForm)) && (
          <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.lg }}>
             {isChangingAddress && addressesQuery.data?.map((addr: Address) => (
               <TouchableOpacity 
                 key={addr.id} 
                 style={[styles.addressCard, addr.id === selectedAddressId && { borderColor: colors.primary }]}
                 onPress={() => {
                   setSelectedAddressId(addr.id);
                   setIsChangingAddress(false);
                 }}
               >
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <Text style={styles.addrLabel}>{addr.label}</Text>
                   {addr.id === selectedAddressId && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                 </View>
                 <Text style={styles.addrLine}>{addr.line1}</Text>
                 <Text style={styles.addrLine}>{addr.city}, {addr.state} – {addr.pincode}</Text>
               </TouchableOpacity>
             ))}
             {!showAddressForm && (
               <Button title="+ Add new address" variant="ghost" onPress={() => setShowAddressForm(true)} />
             )}
             {showAddressForm && (
               <View style={styles.addressFormBox}>
                  <Text style={styles.formTitle}>Add new address</Text>
                  <TextInput style={styles.input} placeholder="Address line" value={addressForm.line1} onChangeText={(v) => setAddressForm((f) => ({ ...f, line1: v }))} />
                  <TextInput style={styles.input} placeholder="Pincode" keyboardType="number-pad" maxLength={6} value={addressForm.pincode} onChangeText={(v) => setAddressForm((f) => ({ ...f, pincode: v }))} />
                  <TextInput style={styles.input} placeholder="City" value={addressForm.city} onChangeText={(v) => setAddressForm((f) => ({ ...f, city: v }))} />
                  <TextInput style={styles.input} placeholder="State" value={addressForm.state} onChangeText={(v) => setAddressForm((f) => ({ ...f, state: v }))} />
                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                    <Button title="Cancel" variant="ghost" onPress={() => setShowAddressForm(false)} style={{ flex: 1 }} />
                    <Button title="Save" variant="primary" loading={createAddressMutation.isPending} onPress={() => createAddressMutation.mutate()} style={{ flex: 1 }} />
                  </View>
               </View>
             )}
          </View>
        )}

        <View style={styles.section}>
          {allItems.map((item) => (
             <View key={item.id} style={styles.productCard}>
                <View style={styles.productImageWrap}>
                   {item.product.images?.[0]?.url ? (
                     <Image source={{ uri: item.product.images[0].url }} style={styles.productImage} />
                   ) : (
                     <View style={styles.itemImagePlaceholder}>
                       <Text style={styles.itemImagePlaceholderText}>No image</Text>
                     </View>
                   )}
                </View>
                <View style={styles.productInfo}>
                   <View style={styles.productHeaderRow}>
                      <Text style={styles.productName} numberOfLines={1}>{item.product.name}</Text>
                      <TouchableOpacity onPress={() => removeMutation.mutate(item.productId)} style={styles.trashBtn}>
                         <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                   </View>
                   <Text style={styles.productWeight}>{item.product.unit || '1 pc'}</Text>
                   <View style={styles.tagWrap}>
                      <Ionicons name="leaf" size={10} color={colors.primary} style={{ marginRight: 2 }} />
                      <Text style={styles.tagText}>Fresh</Text>
                   </View>
                   
                   <View style={styles.productFooterRow}>
                      <View style={styles.priceBlock}>
                         <Text style={styles.productPrice}>{formatPrice(Number(item.product.sellingPrice))}</Text>
                         {Number(item.product.mrp) > Number(item.product.sellingPrice) && (
                            <>
                               <Text style={styles.productMrp}>{formatPrice(Number(item.product.mrp))}</Text>
                               <Text style={styles.productDiscount}>
                                 {Math.round(((Number(item.product.mrp) - Number(item.product.sellingPrice)) / Number(item.product.mrp)) * 100)}% OFF
                               </Text>
                            </>
                         )}
                      </View>
                      
                      <View style={styles.qtyPill}>
                         <TouchableOpacity onPress={() => updateMutation.mutate({ productId: item.productId, quantity: item.quantity - 1 })} style={styles.qtyBtnIcon}>
                            <Text style={styles.qtyBtnText}>−</Text>
                         </TouchableOpacity>
                         <Text style={styles.qtyText}>{item.quantity}</Text>
                         <TouchableOpacity onPress={() => updateMutation.mutate({ productId: item.productId, quantity: item.quantity + 1 })} style={styles.qtyBtnIcon}>
                            <Text style={styles.qtyBtnText}>+</Text>
                         </TouchableOpacity>
                      </View>
                   </View>
                </View>
             </View>
          ))}
        </View>

        <View style={styles.couponSection}>
           <View style={styles.couponLeft}>
              <MaterialCommunityIcons name="ticket-percent-outline" size={24} color={colors.primary} />
              <View style={styles.couponTexts}>
                 <Text style={styles.couponTitle}>Apply Coupon</Text>
                 <Text style={styles.couponSub}>Save more on your order</Text>
              </View>
           </View>
           <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>



        <View style={styles.billSection}>
           <Text style={styles.sectionTitle}>Bill Details</Text>
           <View style={styles.billRow}>
              <Text style={styles.billLabel}>Items Total ({itemsCount})</Text>
              <Text style={styles.billValue}>{formatPrice(subtotal)}</Text>
           </View>
           {savings > 0 && (
            <View style={styles.billRow}>
               <Text style={[styles.billLabel, { color: colors.primary }]}>Savings</Text>
               <Text style={[styles.billValue, { color: colors.primary }]}>-{formatPrice(savings)}</Text>
            </View>
            )}
            <View style={styles.billRow}>
               <Text style={styles.billLabel}>Delivery Fee</Text>
               <Text style={[styles.billValue, { color: deliveryFee === 0 ? colors.primary : colors.text }]}>
                 {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
               </Text>
            </View>
            {platformFee > 0 && (
            <View style={styles.billRow}>
               <Text style={styles.billLabel}>Platform Fee</Text>
               <Text style={styles.billValue}>{formatPrice(platformFee)}</Text>
            </View>
            )}
            {taxPercent > 0 && (
            <View style={styles.billRow}>
               <Text style={styles.billLabel}>GST ({taxPercent}%)</Text>
               <Text style={styles.billValue}>{formatPrice(gst)}</Text>
            </View>
            )}
           
           <View style={styles.billDivider} />
           
           <View style={styles.billRowBold}>
              <Text style={styles.billLabelBold}>To Pay</Text>
              <Text style={styles.billValueBold}>{formatPrice(toPay)}</Text>
           </View>

           {savings > 0 && (
             <View style={styles.savingsHighlight}>
                <Ionicons name="pricetag" size={16} color={colors.primary} />
                <Text style={styles.savingsText}>Yay! You're saving <Text style={{ fontFamily: fonts.bold }}>{formatPrice(savings)}</Text> on this order 🎉</Text>
             </View>
           )}
           {minOrderValue > 0 && totalSellingPrice < minOrderValue && (
             <View style={[styles.savingsHighlight, { backgroundColor: '#fff7ed', marginTop: spacing.sm }]}>
                <Ionicons name="alert-circle-outline" size={16} color="#ea580c" />
                <Text style={[styles.savingsText, { color: '#ea580c' }]}>Add items worth <Text style={{ fontFamily: fonts.bold }}>{formatPrice(minOrderValue - totalSellingPrice)}</Text> more for minimum order</Text>
             </View>
           )}
        </View>

      </ScrollView>

      <View style={styles.stickyFooterWrapper}>
         <View style={styles.stickyFooter}>
            <View style={styles.footerLeft}>
               <Text style={styles.footerToPayLabel}>To Pay</Text>
               <Text style={styles.footerTotalAmount}>{formatPrice(toPay)}</Text>
            </View>
            <TouchableOpacity 
               style={styles.checkoutBtn}
               disabled={checkoutMutation.isPending}
               onPress={() => {
                  if (minOrderValue > 0 && totalSellingPrice < minOrderValue) {
                    Alert.alert('Minimum order not met', `Add items worth ${formatPrice(minOrderValue - totalSellingPrice)} more to place this order.`);
                    return;
                  }
                  // pre-select current address in modal
                  setCheckoutAddressId(selectedAddressId);
                  setShowCheckoutModal(true);
               }}
            >
               {checkoutMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
               ) : (
                  <>
                     <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                     <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 4 }} />
                  </>
               )}
            </TouchableOpacity>
         </View>
         <View style={styles.secureWrap}>
            <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
            <Text style={styles.secureText}>Secure Payments • 100% Safe & Reliable</Text>
         </View>
      </View>

      {/* Checkout Address Selection Modal */}
      <Modal visible={showCheckoutModal} transparent animationType="slide" onRequestClose={() => setShowCheckoutModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCheckoutModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Select Delivery Address</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {addressesQuery.data?.map((addr: Address) => {
                const isSelected = checkoutAddressId === addr.id;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[styles.modalAddrCard, isSelected && styles.modalAddrCardSelected]}
                    onPress={() => setCheckoutAddressId(addr.id)}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <View style={[styles.modalAddrIcon, isSelected && { backgroundColor: colors.primary }]}>
                          <Ionicons name={addr.label === 'Home' ? 'home' : 'business'} size={14} color={isSelected ? '#fff' : colors.textMuted} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.modalAddrLabel, isSelected && { color: colors.primary }]}>{addr.label}</Text>
                          <Text style={styles.modalAddrLine} numberOfLines={2}>{addr.line1}, {addr.city}, {addr.state} – {addr.pincode}</Text>
                        </View>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.modalAddNew}
                onPress={() => {
                  setShowCheckoutModal(false);
                  setShowAddressForm(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontFamily: fonts.medium, marginLeft: 6 }}>Add new address</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Bill summary strip */}
            <View style={styles.modalBillStrip}>
              <Text style={styles.modalBillLabel}>To Pay</Text>
              <Text style={styles.modalBillAmount}>{formatPrice(toPay)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.modalPlaceBtn, (!checkoutAddressId || checkoutMutation.isPending) && { opacity: 0.6 }]}
              disabled={!checkoutAddressId || checkoutMutation.isPending}
              onPress={() => {
                if (checkoutAddressId) {
                  // also update the main selected address
                  setSelectedAddressId(checkoutAddressId);
                  checkoutMutation.mutate(checkoutAddressId);
                }
              }}
            >
              {checkoutMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalPlaceBtnText}>Place Order</Text>
              )}
            </TouchableOpacity>

            <View style={[styles.secureWrap, { paddingBottom: spacing.md }]}>
              <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
              <Text style={styles.secureText}>Secure Payments • 100% Safe & Reliable</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { paddingBottom: 120 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  emptyTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  emptyDesc: { fontSize: 15, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  
  stickyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  headerGradient: {
     paddingTop: spacing.xs,
     paddingHorizontal: spacing.md,
     paddingBottom: spacing.md,
     borderBottomLeftRadius: radius.xl,
     borderBottomRightRadius: radius.xl,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  
  titleArea: { marginBottom: spacing.lg },
  pageTitle: { fontSize: 24, fontFamily: fonts.bold, color: colors.text },
  pageTitleCount: { fontSize: 16, fontFamily: fonts.regular, color: colors.textMuted },
  pageSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  
  deliveryBox: { backgroundColor: '#eef8f2', borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deliveryLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  pinIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  deliveringTo: { fontSize: 12, color: colors.textMuted, marginBottom: 2, fontFamily: fonts.medium },
  deliveryAddressText: { fontSize: 15, fontFamily: fonts.bold, color: colors.text, marginBottom: 4 },
  deliveryActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deliveryLabel: { fontSize: 12, color: colors.text, fontFamily: fonts.medium, backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  deliveryDivider: { color: colors.border, fontSize: 12 },
  changeText: { fontSize: 13, color: colors.primary, fontFamily: fonts.medium },
  deliveryRight: { paddingLeft: spacing.sm },
  
  addressCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.white },
  addrLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, marginBottom: 4 },
  addrLine: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  
  addressFormBox: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm },
  formTitle: { fontFamily: fonts.bold, fontSize: 16, marginBottom: spacing.sm },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, fontFamily: fonts.regular, outlineStyle: 'none' as any },
  
  section: { padding: spacing.md, backgroundColor: '#fff', marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.sm },
  
  productCard: { flexDirection: 'row', marginBottom: spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: spacing.md },
  productImageWrap: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: '#f9fafb', padding: 8, marginRight: spacing.md },
  productImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  itemImagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', borderRadius: radius.md },
  itemImagePlaceholderText: { fontSize: 10, color: colors.textMuted },
  
  productInfo: { flex: 1 },
  productHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productName: { fontSize: 15, fontFamily: fonts.bold, color: colors.text, flex: 1, marginRight: spacing.sm },
  trashBtn: { padding: 4 },
  productWeight: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  tagWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  tagText: { fontSize: 10, color: colors.primary, fontFamily: fonts.medium },
  
  productFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
  priceBlock: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  productPrice: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, marginRight: 6 },
  productMrp: { fontSize: 13, color: colors.textMuted, textDecorationLine: 'line-through', marginRight: 6 },
  productDiscount: { fontSize: 11, color: '#ea580c', fontFamily: fonts.bold, backgroundColor: '#ffedd5', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  
  qtyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.primary, borderRadius: 20 },
  qtyBtnIcon: { paddingHorizontal: 12, paddingVertical: 6 },
  qtyBtnText: { color: colors.primary, fontSize: 16, fontFamily: fonts.bold },
  qtyText: { fontSize: 14, fontFamily: fonts.bold, color: colors.text, paddingHorizontal: 8 },
  
  couponSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: spacing.md, marginVertical: spacing.sm, borderWidth: 1, borderColor: '#eef8f2', borderRadius: radius.lg, marginHorizontal: spacing.md },
  couponLeft: { flexDirection: 'row', alignItems: 'center' },
  couponTexts: { marginLeft: spacing.sm },
  couponTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  couponSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  
  recHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  viewAllText: { fontSize: 14, color: colors.primary, fontFamily: fonts.medium },
  recCard: { width: 120, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.sm },
  recImg: { width: 80, height: 80, resizeMode: 'contain', alignSelf: 'center' },
  recName: { fontSize: 14, fontFamily: fonts.medium, color: colors.text, marginTop: 8 },
  recWeight: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  recFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  recPrice: { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  recAddBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  recAddText: { color: colors.primary, fontSize: 11, fontFamily: fonts.bold },
  
  billSection: { padding: spacing.md, backgroundColor: '#fff', marginTop: spacing.sm, borderRadius: radius.lg, marginHorizontal: spacing.md, marginBottom: spacing.xl },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  billLabel: { fontSize: 14, color: colors.textMuted },
  billValue: { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  billDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  billRowBold: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  billLabelBold: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  billValueBold: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  savingsHighlight: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef8f2', padding: spacing.sm, borderRadius: radius.md, marginTop: spacing.md, justifyContent: 'center' },
  savingsText: { color: colors.primary, fontSize: 13, marginLeft: 6 },
  
  stickyFooterWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
  stickyFooter: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, paddingBottom: spacing.sm },
  footerLeft: { flex: 1 },
  footerToPayLabel: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.medium },
  footerTotalAmount: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  checkoutBtn: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: 14, borderRadius: radius.full },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontFamily: fonts.bold },
  secureWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: spacing.md },
  secureText: { fontSize: 11, color: colors.textMuted, marginLeft: 4 },

  // Checkout Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingTop: spacing.sm },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.md },
  modalAddrCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, backgroundColor: '#fafafa' },
  modalAddrCardSelected: { borderColor: colors.primary, backgroundColor: '#f0fdf4' },
  modalAddrIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  modalAddrLabel: { fontSize: 14, fontFamily: fonts.bold, color: colors.text, marginBottom: 2 },
  modalAddrLine: { fontSize: 12, color: colors.textMuted },
  modalAddNew: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm },
  modalBillStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: radius.md, padding: spacing.md, marginVertical: spacing.md },
  modalBillLabel: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.medium },
  modalBillAmount: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  modalPlaceBtn: { backgroundColor: colors.primary, borderRadius: radius.full, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  modalPlaceBtnText: { color: '#fff', fontSize: 16, fontFamily: fonts.bold },
});
