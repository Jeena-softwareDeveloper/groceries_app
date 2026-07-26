import { api, unwrap } from './client';

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

export const fetchAppSettings = () => unwrap(api.get<AppSettings>('/config/app-settings'));
