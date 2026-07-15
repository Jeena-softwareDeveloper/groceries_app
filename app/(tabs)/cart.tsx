import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cartApi, orderApi, customerApi } from '@/api';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { SuccessState } from '@/components/ui';
import { colors, radius, spacing , fonts} from '@/constants/theme';
import { useAppDispatch } from '@/store/hooks';
import { setItemCount } from '@/store/cartSlice';
import type { Address } from '@/types/customer';

function formatPrice(n: number) {
  return `₹${n.toFixed(0)}`;
}

export default function CartScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    line1: '',
    city: '',
    pincode: '',
  });


  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.fetchCart,
  });

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: customerApi.fetchAddresses,
    enabled: showCheckout,
  });

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
      setShowCheckout(false);
      setIsSuccess(true);
    },

    onError: (e) => Alert.alert('Checkout failed', e instanceof Error ? e.message : 'Try again'),
  });

  const createAddressMutation = useMutation({
    mutationFn: () => customerApi.createAddress(addressForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setAddressForm({ label: 'Home', line1: '', city: '', pincode: '' });
    },
  });

  const groups = cartQuery.data?.byVendor ?? [];
  const subtotal =
    cartQuery.data?.items.reduce(
      (s, i) => s + Number(i.product.sellingPrice) * i.quantity,
      0,
    ) ?? 0;

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
        <Header showCart={false} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!groups.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header showCart={false} />
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyDesc}>Browse shops and add items to get started.</Text>
          <Button title="Browse stores" onPress={() => router.push('/(tabs)')} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header showCart={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {groups.map((group) => (
          <View key={group.vendorId} style={styles.vendorBlock}>
            <Text style={styles.vendorName}>{group.vendor.shopName}</Text>
            {group.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatPrice(Number(item.product.sellingPrice))} × {item.quantity}
                  </Text>
                </View>
                <View style={styles.qtyRow}>
                  <Button
                    title="−"
                    variant="secondary"
                    onPress={() =>
                      updateMutation.mutate({
                        productId: item.productId,
                        quantity: item.quantity - 1,
                      })
                    }
                    style={styles.qtyBtn}
                    textStyle={styles.qtyBtnText}
                  />
                  <Text style={styles.qty}>{item.quantity}</Text>
                  <Button
                    title="+"
                    variant="secondary"
                    onPress={() =>
                      updateMutation.mutate({
                        productId: item.productId,
                        quantity: item.quantity + 1,
                      })
                    }
                    style={styles.qtyBtn}
                    textStyle={styles.qtyBtnText}
                  />
                </View>
                <Button
                  title="Remove"
                  variant="ghost"
                  onPress={() => removeMutation.mutate(item.productId)}
                  style={styles.removeBtn}
                  textStyle={{ fontSize: 13 }}
                />
              </View>
            ))}
          </View>
        ))}

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>

        {!showCheckout ? (
          <Button title="Proceed to checkout" onPress={() => setShowCheckout(true)} />
        ) : (
          <View style={styles.checkout}>
            <Text style={styles.checkoutTitle}>Delivery address</Text>
            {addressesQuery.data?.map((addr: Address) => (
              <View key={addr.id} style={styles.addressCard}>
                <Text style={styles.addrLabel}>{addr.label}</Text>
                <Text style={styles.addrLine}>{addr.line1}</Text>
                <Text style={styles.addrLine}>
                  {addr.city} – {addr.pincode}
                </Text>
                <Button
                  title="Place order (COD)"
                  loading={checkoutMutation.isPending}
                  onPress={() => checkoutMutation.mutate(addr.id)}
                  style={{ marginTop: spacing.sm }}
                />
              </View>
            ))}

            <Text style={[styles.checkoutTitle, { marginTop: spacing.lg }]}>Add new address</Text>
            <TextInput
              style={styles.input}
              placeholder="Address line"
              value={addressForm.line1}
              onChangeText={(v) => setAddressForm((f) => ({ ...f, line1: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="City"
              value={addressForm.city}
              onChangeText={(v) => setAddressForm((f) => ({ ...f, city: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Pincode"
              keyboardType="number-pad"
              value={addressForm.pincode}
              onChangeText={(v) => setAddressForm((f) => ({ ...f, pincode: v }))}
            />
            <Button
              title="Save address"
              variant="secondary"
              loading={createAddressMutation.isPending}
              onPress={() => createAddressMutation.mutate()}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  emptyTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  emptyDesc: { fontSize: 15, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  vendorBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vendorName: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.md },
  itemRow: { marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemInfo: { marginBottom: spacing.sm },
  itemName: { fontSize: 15, fontFamily: fonts.medium, color: colors.text },
  itemPrice: { fontSize: 14, color: colors.primary, marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: { minHeight: 36, paddingVertical: 4, paddingHorizontal: spacing.md, flex: 0 },
  qtyBtnText: { fontSize: 18 },
  qty: { fontSize: 16, fontFamily: fonts.medium, minWidth: 24, textAlign: 'center' },
  removeBtn: { alignSelf: 'flex-start', marginTop: spacing.xs, minHeight: 32, paddingVertical: 4 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  summaryLabel: { fontSize: 16, color: colors.textMuted },
  summaryValue: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  checkout: { marginTop: spacing.md },
  checkoutTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.md },
  addressCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addrLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  addrLine: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 15,
  },
});
