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
  setGPSLocation,
  setHydrated,
  clearLocation,
  setLocationResolved,
} from '@/store/locationSlice';
import { fetchAppSettings } from '@/api/config.api';
import { setAppSettings } from '@/store/configSlice';
import * as Location from 'expo-location';
import { getDeviceId } from '@/utils/deviceId';

const LOCATION_KEYS = {
  districtId: 'districtId',
  districtName: 'districtName',
  areaId: 'areaId',
  areaName: 'areaName',
  latitude: 'loc_lat',
  longitude: 'loc_lng',
  displayName: 'loc_displayName',
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
            // Timeout after 8s — don't let a slow server block app startup
            const user = await Promise.race([
              authApi.getMe(),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('getMe timeout')), 8000)
              ),
            ]);
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

        // Restore saved location
        if (districtId && districtName && areaId && areaName) {
          // Manual selection restored
          const lat = await getItemAsync(LOCATION_KEYS.latitude);
          const lng = await getItemAsync(LOCATION_KEYS.longitude);
          dispatch(setLocation({
            districtId, districtName, areaId, areaName,
            latitude: lat ? parseFloat(lat) : null,
            longitude: lng ? parseFloat(lng) : null,
          }));
        } else {
          // Try restoring GPS location (lat/lng + displayName)
          const lat = await getItemAsync(LOCATION_KEYS.latitude);
          const lng = await getItemAsync(LOCATION_KEYS.longitude);
          const displayName = await getItemAsync(LOCATION_KEYS.displayName);
          if (lat && lng && displayName) {
            dispatch(setGPSLocation({
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
              displayName,
            }));
          } else {
            // No saved location — let modal open
            dispatch(setLocationResolved(true));
          }
        }

        try {
          // Timeout after 6s — don't let config API block app startup
          const config = await Promise.race([
            fetchAppSettings(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('appSettings timeout')), 6000)
            ),
          ]);
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
  latitude?: number | null;
  longitude?: number | null;
}) {
  const displayName = `${data.areaName}, ${data.districtName}`;
  await Promise.all([
    setItemAsync(LOCATION_KEYS.districtId, data.districtId),
    setItemAsync(LOCATION_KEYS.districtName, data.districtName),
    setItemAsync(LOCATION_KEYS.areaId, data.areaId),
    setItemAsync(LOCATION_KEYS.areaName, data.areaName),
    data.latitude != null ? setItemAsync(LOCATION_KEYS.latitude, String(data.latitude)) : Promise.resolve(),
    data.longitude != null ? setItemAsync(LOCATION_KEYS.longitude, String(data.longitude)) : Promise.resolve(),
    setItemAsync(LOCATION_KEYS.displayName, displayName),
  ]);

  // Sync to database table for this mobile device
  if (data.latitude != null && data.longitude != null) {
    getDeviceId().then((deviceId) => {
      customerApi.saveLocation({
        deviceId,
        displayName,
        latitude: data.latitude!,
        longitude: data.longitude!,
        districtId: data.districtId,
        areaId: data.areaId,
      }).catch((err) => console.warn('[persistLocation] DB sync error:', err));
    }).catch(() => {});
  }
}

/** Persist GPS-detected location (no DB IDs — just coordinates + display name) */
export async function persistGPSLocation(data: {
  latitude: number;
  longitude: number;
  displayName: string;
}) {
  // Clear any old manual district/area keys
  await Promise.all([
    deleteItemAsync(LOCATION_KEYS.districtId),
    deleteItemAsync(LOCATION_KEYS.districtName),
    deleteItemAsync(LOCATION_KEYS.areaId),
    deleteItemAsync(LOCATION_KEYS.areaName),
    setItemAsync(LOCATION_KEYS.latitude, String(data.latitude)),
    setItemAsync(LOCATION_KEYS.longitude, String(data.longitude)),
    setItemAsync(LOCATION_KEYS.displayName, data.displayName),
  ]);

  // Sync to database table for this mobile device
  getDeviceId().then((deviceId) => {
    customerApi.saveLocation({
      deviceId,
      displayName: data.displayName,
      latitude: data.latitude,
      longitude: data.longitude,
    }).catch((err) => console.warn('[persistGPSLocation] DB sync error:', err));
  }).catch(() => {});
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
