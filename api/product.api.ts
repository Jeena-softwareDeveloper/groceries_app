import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';
import type { Product, SearchResults } from '@/types/customer';

export const productApi = {
  fetchShopProducts: (shopId: string, categoryId?: string) =>
    unwrap<Product[]>(api.get(ENDPOINTS.CUSTOMER.SHOPS.PRODUCTS(shopId), { params: { categoryId } })),

  fetchProduct: (id: string) =>
    unwrap<Product>(api.get(ENDPOINTS.CUSTOMER.PRODUCTS.BY_ID(id))),

  fetchProducts: (params: { categoryId?: string; districtId?: string; sort?: string; page?: number; limit?: number }) =>
    unwrap<{ products: Product[]; total: number; page: number; totalPages: number }>(
      api.get(ENDPOINTS.CUSTOMER.PRODUCTS.LIST, { params })
    ),

  searchProducts: (q: string, districtId?: string, scope?: string) =>
    unwrap<SearchResults>(api.get(ENDPOINTS.CUSTOMER.SEARCH, { params: { q, districtId, scope } })),
};
