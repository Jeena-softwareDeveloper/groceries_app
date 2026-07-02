import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { clearTokens, REFRESH_KEY, saveTokens, TOKEN_KEY } from '@/api/client';
import { getMe } from '@/api/auth';
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

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const [accessToken, refreshToken, districtId, districtName, areaId, areaName] =
          await Promise.all([
            SecureStore.getItemAsync(TOKEN_KEY),
            SecureStore.getItemAsync(REFRESH_KEY),
            SecureStore.getItemAsync(LOCATION_KEYS.districtId),
            SecureStore.getItemAsync(LOCATION_KEYS.districtName),
            SecureStore.getItemAsync(LOCATION_KEYS.areaId),
            SecureStore.getItemAsync(LOCATION_KEYS.areaName),
          ]);

        if (!mounted) return;

        if (accessToken && refreshToken) {
          dispatch(setTokens({ accessToken, refreshToken }));
          try {
            const user = await getMe();
            dispatch(setUser(user));
          } catch {
            await clearTokens();
            dispatch(clearAuth());
          }
        }

        if (districtId && districtName && areaId && areaName) {
          dispatch(
            setLocation({ districtId, districtName, areaId, areaName }),
          );
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

  return { ready: authHydrated && locationHydrated };
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
    SecureStore.setItemAsync(LOCATION_KEYS.districtId, data.districtId),
    SecureStore.setItemAsync(LOCATION_KEYS.districtName, data.districtName),
    SecureStore.setItemAsync(LOCATION_KEYS.areaId, data.areaId),
    SecureStore.setItemAsync(LOCATION_KEYS.areaName, data.areaName),
  ]);
}

export async function wipeLocation() {
  await Promise.all(
    Object.values(LOCATION_KEYS).map((key) => SecureStore.deleteItemAsync(key)),
  );
}

export async function wipeAuth() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  await clearTokens();
  return refreshToken;
}

export { clearLocation };
