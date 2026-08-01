import { useEffect } from 'react';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/storage';
import { clearTokens, REFRESH_KEY, saveTokens, TOKEN_KEY } from '@/api/client';
import { authApi } from '@/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearAuth,
  setHydrated as setAuthHydrated,
  setTokens,
  setUser,
} from '@/store/authSlice';
import {
  setLocation,
  setLocationHydrated,
  clearLocation,
} from '@/store/locationSlice';
import { fetchAppSettings } from '@/api/config.api';
import { setAppSettings } from '@/store/configSlice';

const LOCATION_KEYS = {
  districtId: 'districtId',
  districtName: 'districtName',
  areaId: 'areaId',
  areaName: 'areaName',
} as const;

export function useBootstrap() {
  const dispatch = useAppDispatch();
  const { isHydrated: authHydrated } = useAppSelector((s) => s.auth);
  const { isHydrated: locationHydrated } = useAppSelector((s) => s.location);
  const { appSettings } = useAppSelector((s) => s.config);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const [accessToken, refreshToken, districtId, districtName, areaId, areaName] =
          await Promise.all([
            getItemAsync(TOKEN_KEY),
            getItemAsync(REFRESH_KEY),
            getItemAsync(LOCATION_KEYS.districtId),
            getItemAsync(LOCATION_KEYS.districtName),
            getItemAsync(LOCATION_KEYS.areaId),
            getItemAsync(LOCATION_KEYS.areaName),
          ]);

        if (!mounted) return;

        if (accessToken && refreshToken) {
          try {
            // First set tokens so the api interceptor can attach the Authorization header
            dispatch(setTokens({ accessToken, refreshToken }));
            const user = await authApi.getMe();
            // Confirmed valid — keep tokens and set user
            dispatch(setUser(user));
          } catch (getMeErr: any) {
            // Distinguish network errors from genuine auth failures
            const statusCode = getMeErr?.response?.status;
            const isNetworkError = !getMeErr?.response;

            if (isNetworkError) {
              // User is offline at startup — keep them logged in (tokens still valid)
              console.warn('[Bootstrap] Network error during getMe — keeping session');
            } else if (statusCode === 401 || statusCode === 403) {
              // Token genuinely rejected — try was already made, clear everything
              await clearTokens();
              dispatch(clearAuth());
            } else {
              // Server error (5xx) or other — keep session, don't punish user
              console.warn('[Bootstrap] Server error during getMe — keeping session');
            }
          }
        }

        if (districtId && districtName && areaId && areaName) {
          dispatch(
            setLocation({ districtId, districtName, areaId, areaName }),
          );
        }

        try {
          const config = await fetchAppSettings();
          dispatch(setAppSettings(config));
        } catch (e) {
          console.error('Failed to fetch app settings, using fallback defaults', e);
          // Dispatch fallback defaults so the app doesn't stay stuck on the loading spinner
          dispatch(setAppSettings({
            roles: {
              CUSTOMER: {
                defaultRoute: '/(tabs)',
                allowedRoutes: ['/(tabs)', '/orders', '/wishlist', '/wallet'],
                features: { canAddToCart: true, canCheckout: true, canManageProducts: false, showWishlist: true },
              },
              VENDOR: {
                defaultRoute: '/(vendor)',
                allowedRoutes: ['/(vendor)'],
                features: { canAddToCart: false, canCheckout: false, canManageProducts: true, showWishlist: false },
              },
              GUEST: {
                defaultRoute: '/(tabs)',
                allowedRoutes: ['/(tabs)'],
                features: { canAddToCart: false, canCheckout: false, canManageProducts: false, showWishlist: false },
              },
            },
          }));
        }
      } finally {
        if (mounted) {
          dispatch(setAuthHydrated(true));
          dispatch(setLocationHydrated(true));
        }
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return { ready: authHydrated && locationHydrated && appSettings !== null };
}

export async function persistAuth(accessToken: string, refreshToken: string) {
  await saveTokens(accessToken, refreshToken);
}

export async function persistLocation(data: {
  districtId: string;
  districtName: string;
  areaId: string;
  areaName: string;
}) {
  await Promise.all([
    setItemAsync(LOCATION_KEYS.districtId, data.districtId),
    setItemAsync(LOCATION_KEYS.districtName, data.districtName),
    setItemAsync(LOCATION_KEYS.areaId, data.areaId),
    setItemAsync(LOCATION_KEYS.areaName, data.areaName),
  ]);
}

export async function wipeLocation() {
  await Promise.all(
    Object.values(LOCATION_KEYS).map((key) => deleteItemAsync(key)),
  );
}

export async function wipeAuth() {
  const refreshToken = await getItemAsync(REFRESH_KEY);
  await clearTokens();
  return refreshToken;
}

export { clearLocation };
