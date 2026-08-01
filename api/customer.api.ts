import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';
import type { District, Area } from '@shared/types';
import type { HomeFeed, Shop, Address, Product, CustomerProfile } from '@/types/customer';

export const customerApi = {
  fetchHomeFeed: (districtId: string, areaId?: string) =>
    unwrap<HomeFeed>(api.get(ENDPOINTS.CUSTOMER.HOME_FEED, { params: { districtId, areaId } })).then(res => {
      console.log('--- HOME FEED RESPONSE ---');
      console.log(JSON.stringify(res, null, 2));
      console.log('--------------------------');
      return res;
    }),

  fetchShops: (districtId: string, areaId?: string, categoryId?: string) =>
    unwrap<Shop[]>(api.get(ENDPOINTS.CUSTOMER.SHOPS.BASE, { params: { districtId, areaId, categoryId } })),

  fetchShop: (id: string) =>
    unwrap<Shop & { area?: { district?: { name: string } } }>(api.get(ENDPOINTS.CUSTOMER.SHOPS.BY_ID(id))),

  fetchProfile: () =>
    unwrap<CustomerProfile>(api.get(ENDPOINTS.CUSTOMER.PROFILE)),

  updateProfile: (data: { name?: string; email?: string }) =>
    unwrap<CustomerProfile>(api.put(ENDPOINTS.CUSTOMER.PROFILE, data)),

  fetchAddresses: () =>
    unwrap<Address[]>(api.get(ENDPOINTS.CUSTOMER.ADDRESSES)),

  createAddress: (data: Omit<Address, 'id'>) =>
    unwrap<Address>(api.post(ENDPOINTS.CUSTOMER.ADDRESSES, data)),

  fetchWishlist: () =>
    unwrap<Array<{ id: string; product: Product }>>(api.get(ENDPOINTS.CUSTOMER.WISHLIST.BASE)),

  addToWishlist: (productId: string) =>
    unwrap(api.post(ENDPOINTS.CUSTOMER.WISHLIST.BASE, { productId })),

  removeFromWishlist: (productId: string) =>
    unwrap(api.delete(ENDPOINTS.CUSTOMER.WISHLIST.BY_ID(productId))),

  createSupportTicket: (subject: string, message: string, orderId?: string) =>
    unwrap(api.post(ENDPOINTS.CUSTOMER.SUPPORT, { subject, message, orderId })),

  submitReview: (orderId: string, rating: number, comment?: string, productId?: string) =>
    unwrap(api.post(ENDPOINTS.CUSTOMER.REVIEWS, { orderId, rating, comment, productId })),

  fetchDistricts: () =>
    unwrap<District[]>(api.get(ENDPOINTS.CUSTOMER.DISTRICTS)),

  fetchAreas: (districtId: string) =>
    unwrap<Area[]>(api.get(ENDPOINTS.CUSTOMER.AREAS, { params: { districtId } })),

  lookupPincode: (pincode: string) =>
    unwrap<{ district: string; state: string }>(api.get(`/customer/pincode/${pincode}`)),
};
