import { api, unwrap } from './client';
import type { ApiResponse } from '@shared/types';

export interface AppSettings {
  minOrderValue?: number;
  taxPercent?: number;
  platformFee?: number;
  deliveryFee?: number;
  roles: Record<string, {
    defaultRoute: string;
    allowedRoutes: string[];
    features: {
      canAddToCart: boolean;
      canCheckout: boolean;
      canManageProducts: boolean;
      showWishlist: boolean;
    };
  }>;
}

export const fetchAppSettings = () => unwrap(api.get<ApiResponse<AppSettings>>('/config/app-settings'));
