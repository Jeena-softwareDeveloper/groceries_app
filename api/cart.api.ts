import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';
import type { CartResponse } from '@/types/customer';

export const cartApi = {
  fetchCart: () =>
    unwrap<CartResponse>(api.get(ENDPOINTS.CUSTOMER.CART.BASE)),

  addToCart: (productId: string, quantity = 1) =>
    unwrap(api.post(ENDPOINTS.CUSTOMER.CART.BASE, { productId, quantity })),

  updateCartItem: (productId: string, quantity: number) =>
    unwrap(api.put(ENDPOINTS.CUSTOMER.CART.BY_ID(productId), { quantity })),

  removeFromCart: (productId: string) =>
    unwrap(api.delete(ENDPOINTS.CUSTOMER.CART.BY_ID(productId))),
};
