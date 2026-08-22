import { useEffect } from 'react';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/storage';
import { clearTokens, REFRESH_KEY, saveTokens, TOKEN_KEY } from '@/api/client';
import { authApi, customerApi } from '@/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearAuth,
  setHydrated as setAuthHydrated,
  setTokens,
  setUser,
} from '@/store/authSlice';
import {
  setLocation,
  setHydrated,
  clearLocation,
  setLocationResolved,
} from '@/store/locationSlice';
import { fetchAppSettings } from '@/api/config.api';
import { setAppSettings } from '@/store/configSlice';
import * as Location from 'expo-location';

const LOCATION_KEYS = {
  districtId: 'districtId',
  districtName: 'districtName',
  areaId: 'areaId',
  areaName: 'areaName',
} as const;

/** Tries GPS auto-detect and resolves a location from DB. Returns true on success. */
async function tryGPSAutoDetect(
  dispatch: ReturnType<typeof useAppDispatch>,
): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    let [addressData] = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    let address: any = addressData;
    if (!addressData) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}`
        );
        const nominatim = await res.json();
        if (nominatim?.address) {
          address = {
            city: nominatim.address.city || nominatim.address.town || nominatim.address.village || '',
            subregion: nominatim.address.county || nominatim.address.state_district || '',
            region: nominatim.address.state || '',
            street: nominatim.address.road || nominatim.address.neighbourhood || '',
            name: nominatim.address.suburb || '',
            district: nominatim.address.city_district || '',
          };
        }
      } catch {}
    }

    if (!address || Object.keys(address).length === 0) return false;

    const districts = await customerApi.fetchDistricts();
    const userCity = (address.city || address.subregion || address.region || '').toLowerCase();

    const matchedDistrict = districts.find(
      (d) =>
        d.name.toLowerCase() === userCity ||
        userCity.includes(d.name.toLowerCase()) ||
        d.name.toLowerCase().includes(userCity)
    );

    const isFallback = !matchedDistrict;
    const finalDistrict = matchedDistrict || districts[0];
    if (!finalDistrict) return false;

    const areas = await customerApi.fetchAreas(finalDistrict.id);
    const userStreet = (address.street || address.name || address.district || '').toLowerCase();

    const matchedArea =
      areas.find(
        (a) =>
          a.name.toLowerCase() === userStreet ||
          userStreet.includes(a.name.toLowerCase()) ||
          a.name.toLowerCase().includes(userStreet) ||
          a.name.toLowerCase().includes(userCity)
      ) || areas[0];

    if (!matchedArea) return false;

    const payload = {
      districtId: finalDistrict.id,
      districtName: finalDistrict.name,
      areaId: matchedArea.id,
      areaName: matchedArea.name,
      latitude: isFallback ? undefined : loc.coords.latitude,
      longitude: isFallback ? undefined : loc.coords.longitude,
    };

    await persistLocation(payload);
    dispatch(setLocation(payload)); // also sets locationResolved=true inside slice
    return true;
  } catch {
    return false;
  }
}

export function useBootstrap() {
  const dispatch = useAppDispatch();
  const { isHydrated: authHydrated } = useAppSelector((s) => s.auth);
  const { isHydrated: locationHydrated, locationResolved } = useAppSelector((s) => s.location);
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
            dispatch(setTokens({ accessToken, refreshToken }));
            const user = await authApi.getMe();
            dispatch(setUser(user));
          } catch (getMeErr: any) {
            const statusCode = getMeErr?.response?.status;
            const isNetworkError = !getMeErr?.response;
            if (isNetworkError) {
              console.warn('[Bootstrap] Network error during getMe — keeping session');
            } else if (statusCode === 401 || statusCode === 403) {
              await clearTokens();
              dispatch(clearAuth());
            } else {
              console.warn('[Bootstrap] Server error during getMe — keeping session');
            }
          }
        }

        // If saved location exists, load it (locationResolved is set by setLocation in the slice)
        if (districtId && districtName && areaId && areaName) {
          dispatch(setLocation({ districtId, districtName, areaId, areaName }));
        } else {
          // No saved location → try GPS auto-detect silently during splash
          const gpsSuccess = await tryGPSAutoDetect(dispatch);
          if (!mounted) return;
          if (!gpsSuccess) {
            // GPS failed or denied — mark resolved so splash can exit, location modal will open
            dispatch(setLocationResolved(true));
          }
          // If GPS succeeded, setLocation() already set locationResolved=true in the slice
        }

        try {
          const config = await fetchAppSettings();
          dispatch(setAppSettings(config));
        } catch (e) {
          console.error('Failed to fetch app settings, using fallback defaults', e);
          dispatch(
            setAppSettings({
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
            })
          );
        }
      } finally {
        if (mounted) {
          dispatch(setAuthHydrated(true));
          dispatch(setHydrated(true));
        }
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  // Splash exits only after: auth hydrated + location hydrated + location resolved + app settings loaded
  return {
    ready: authHydrated && locationHydrated && locationResolved && appSettings !== null,
  };
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
  await Promise.all(Object.values(LOCATION_KEYS).map((key) => deleteItemAsync(key)));
}

export async function wipeAuth() {
  const refreshToken = await getItemAsync(REFRESH_KEY);
  await clearTokens();
  return refreshToken;
}

export { clearLocation };
