import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';
import type { Order } from '@/types/customer';

export const orderApi = {
  checkout: (addressId: string, paymentMethod: 'COD' | 'RAZORPAY' = 'COD', couponCode?: string) =>
    unwrap(api.post(ENDPOINTS.CUSTOMER.CHECKOUT, { addressId, paymentMethod, couponCode })),

  fetchOrders: (page = 1) =>
    unwrap<Order[]>(api.get(ENDPOINTS.CUSTOMER.ORDERS.BASE, { params: { page } })),

  fetchOrder: (id: string) =>
    unwrap<Order>(api.get(ENDPOINTS.CUSTOMER.ORDERS.BY_ID(id))),

  cancelOrder: (id: string, reason: string = 'Customer cancelled') =>
    unwrap(api.post(ENDPOINTS.CUSTOMER.ORDERS.CANCEL(id), { reason })),
};
