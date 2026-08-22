import { customerApi } from '@/api';
import * as Location from 'expo-location';

/**
 * High-accuracy reverse geocoder for Indian locations (Localities, Towns, Districts).
 * 1. Server Reverse Geocode API (handles external requests with zero CORS/network issues)
 * 2. BigDataCloud / Nominatim fallback
 * 3. Native Expo reverse geocode fallback
 */
export async function resolveAddressFromCoords(lat: number, lng: number): Promise<string> {
  // Strategy 1: Call Backend Server Reverse Geocode API
  try {
    const res = await customerApi.reverseGeocode(lat, lng);
    if (res?.displayName) {
      return res.displayName;
    }
  } catch (e) {
    console.warn('[Geocode] Server reverse-geocode failed, trying client fallbacks...', e);
  }

  // Strategy 2: BigDataCloud Client API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data: any = await res.json();
      const adminList = Array.isArray(data.localityInfo?.administrative)
        ? [...data.localityInfo.administrative].sort((a, b) => (b.order || 0) - (a.order || 0))
        : [];

      let local = '';
      for (const a of adminList) {
        if (a.adminLevel >= 6 && a.name && !a.name.toLowerCase().includes('taluk') && !a.name.toLowerCase().includes('district')) {
          local = a.name.trim();
          break;
        }
      }
      if (!local) local = data.locality || data.city || '';

      let district = '';
      const distObj = adminList.find(
        (a: any) => a.adminLevel === 5 || a.name?.toLowerCase().includes('district')
      );
      if (distObj) {
        district = distObj.name.replace(/ district/i, '').replace(/ taluk/i, '').trim();
      }
      if (!district) district = (data.principalSubdivision || '').trim();

      if (local && district && local.toLowerCase() !== district.toLowerCase()) {
        return `${local}, ${district}`;
      } else if (local) {
        return local;
      }
    }
  } catch (e) {
    console.warn('[Geocode] BigDataCloud fallback failed...', e);
  }

  // Strategy 3: Native Expo Geocoder fallback
  try {
    const [addr] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (addr) {
      const local = addr.city || (addr as any).subLocality || addr.district || addr.name || '';
      const dist = (addr.subregion || addr.region || '').replace(/ district/i, '').trim();
      if (local && dist && local.toLowerCase() !== dist.toLowerCase()) {
        return `${local}, ${dist}`;
      }
      return local || dist || 'Current Location';
    }
  } catch (e) {
    console.warn('[Geocode] Native geocode fallback failed...', e);
  }

  return 'Current Location';
}
