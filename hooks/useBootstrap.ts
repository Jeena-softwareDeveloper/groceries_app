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
            getItemAsync(TOKEN_KEY),
            getItemAsync(REFRESH_KEY),
            getItemAsync(LOCATION_KEYS.districtId),
            getItemAsync(LOCATION_KEYS.districtName),
            getItemAsync(LOCATION_KEYS.areaId),
            getItemAsync(LOCATION_KEYS.areaName),
          ]);

        if (!mounted) return;

        if (accessToken && refreshToken) {
          dispatch(setTokens({ accessToken, refreshToken }));
          try {
            const user = await authApi.getMe();
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
