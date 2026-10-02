import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';
import type { District, Area } from '@shared/types';
import type { HomeFeed, Shop, Address, Product, CustomerProfile } from '@/types/customer';

export const customerApi = {
  fetchHomeFeed: (districtId: string, areaId?: string, lat?: number | null, lng?: number | null) =>
    unwrap<HomeFeed>(api.get(ENDPOINTS.CUSTOMER.HOME_FEED, { params: { districtId, areaId, lat, lng } })),

  fetchHomeFeedByLocation: (lat: number, lng: number) =>
    unwrap<HomeFeed>(api.get(ENDPOINTS.CUSTOMER.HOME_FEED_BY_LOCATION, { params: { lat, lng } })),


  fetchShops: (districtId?: string, areaId?: string, categoryId?: string, lat?: number | null, lng?: number | null) =>
    unwrap<Shop[]>(api.get(ENDPOINTS.CUSTOMER.SHOPS.BASE, { params: { districtId, areaId, categoryId, lat, lng } })),

  fetchShop: (id: string, lat?: number | null, lng?: number | null) =>
    unwrap<Shop & { area?: { district?: { name: string } }; deliveryRadius?: number }>(
      api.get(ENDPOINTS.CUSTOMER.SHOPS.BY_ID(id), { params: { lat, lng } }),
    ),

  fetchProfile: () =>
    unwrap<CustomerProfile>(api.get(ENDPOINTS.CUSTOMER.PROFILE)),

  updateProfile: (data: { name?: string; email?: string }) =>
    unwrap<CustomerProfile>(api.put(ENDPOINTS.CUSTOMER.PROFILE, data)),

  fetchAddresses: () =>
    unwrap<Address[]>(api.get(ENDPOINTS.CUSTOMER.ADDRESSES)),

  createAddress: (data: Omit<Address, 'id'> & { lat?: number | null; lng?: number | null }) =>
    unwrap<Address>(api.post(ENDPOINTS.CUSTOMER.ADDRESSES, data)),

  updateAddress: (id: string, data: Partial<Omit<Address, 'id'>>) =>
    unwrap<Address>(api.put(`${ENDPOINTS.CUSTOMER.ADDRESSES}/${id}`, data)),

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

  reverseGeocode: (lat: number, lng: number) =>
    unwrap<{ displayName: string; locality: string; district: string }>(
      api.get(ENDPOINTS.CUSTOMER.REVERSE_GEOCODE, { params: { lat, lng } }),
    ),

  saveLocation: (data: {
    deviceId: string;
    displayName: string;
    latitude: number;
    longitude: number;
    districtId?: string;
    areaId?: string;
  }) => unwrap(api.post(ENDPOINTS.CUSTOMER.LOCATION, data)),

  fetchAppVersion: () =>
    unwrap<{ minVersion: string; playStoreUrl: string }>(api.get(ENDPOINTS.CUSTOMER.APP_VERSION)),

  logReferralInstall: (ref: string) =>
    unwrap(api.post('/customer/refer-install', { ref })),
};

