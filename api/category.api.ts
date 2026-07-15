import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';
import type { Category } from '@/types/customer';

export const categoryApi = {
  fetchCategories: () =>
    unwrap<Category[]>(api.get(ENDPOINTS.CUSTOMER.CATEGORIES)),
};
