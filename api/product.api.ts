import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';
import type { Product, SearchResults } from '@/types/customer';

export const productApi = {
  fetchShopProducts: (shopId: string, categoryId?: string) =>
    unwrap<Product[]>(api.get(ENDPOINTS.CUSTOMER.SHOPS.PRODUCTS(shopId), { params: { categoryId } })),

  fetchProduct: (id: string) =>
    unwrap<Product>(api.get(ENDPOINTS.CUSTOMER.PRODUCTS.BY_ID(id))),

  searchProducts: (q: string, districtId?: string, scope?: string) =>
    unwrap<SearchResults>(api.get(ENDPOINTS.CUSTOMER.SEARCH, { params: { q, districtId, scope } })),
};
