import { getItemAsync, setItemAsync } from './storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'dm_persistent_device_id';

/**
 * Returns a persistent unique device ID for this phone/device.
 */
export async function getDeviceId(): Promise<string> {
  try {
    const existing = await getItemAsync(DEVICE_ID_KEY);
    if (existing) return existing;

    let id: string | null = null;
    if (Platform.OS === 'android') {
      id = Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      id = await Application.getIosIdForVendorAsync();
    }

    if (!id) {
      // Fallback: generate persistent random ID
      id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    await setItemAsync(DEVICE_ID_KEY, id);
    return id;
  } catch (e) {
    const fallback = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return fallback;
  }
}
