/**
 * IMAGE_CACHE_POLICY
 *
 * Controls expo-image cachePolicy based on environment:
 *   - Development: 'none' — always load fresh from server so changes
 *     (product photos, banners, logos) are immediately visible without restart.
 *   - Production: 'memory-disk' — cache in both RAM and disk for fast loads
 *     and offline resilience.
 *
 * Usage:
 *   import { IMAGE_CACHE_POLICY } from '@/utils/constants';
 *   <Image cachePolicy={IMAGE_CACHE_POLICY} ... />
 */
export const IMAGE_CACHE_POLICY: 'none' | 'memory-disk' =
  __DEV__ ? 'none' : 'memory-disk';

/**
 * STALE_TIMES — Industry-standard React Query cache strategy
 *
 * In dev: always 0 (always fetch fresh — see live server changes immediately)
 * In production: tiered by data volatility
 *
 *  STATIC   — Rarely changes (categories, districts, app settings)
 *  CONTENT  — Changes occasionally (home feed, banners, shop/product detail)
 *  LIST     — Changes often (product lists, shop lists, search results)
 *  PERSONAL — User-specific but not critical (profile, wishlist, orders list)
 *  REALTIME — Must always be fresh (cart, active order detail, wallet balance)
 */
const ms = (minutes: number) => minutes * 60 * 1000;

export const STALE_TIMES = {
  STATIC:   ms(10),   // 10 min — categories, districts, areas, app config
  CONTENT:  ms(3),    //  3 min — home feed, shop detail, product detail
  LIST:     ms(2),    //  2 min — product lists, shop lists, search, vendor products
  PERSONAL: ms(1),    //  1 min — profile/me, wishlist, orders history
  REALTIME: 0,        //  0 sec — cart, wallet, active order, notifications
} as const;
