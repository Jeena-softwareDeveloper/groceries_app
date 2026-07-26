import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export type DeviceSignature = {
  deviceId?: string;
  deviceModel?: string;
  osVersion?: string;
};

export async function getDeviceSignature(): Promise<DeviceSignature> {
  let deviceId: string | undefined;

  try {
    if (Platform.OS === 'android') {
      deviceId = Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      deviceId = await Application.getIosIdForVendorAsync() || undefined;
    }
  } catch (err) {
    console.warn('Could not get device ID', err);
  }

  return {
    deviceId,
    deviceModel: Device.modelName || 'Unknown Device',
    osVersion: Device.osVersion || 'Unknown OS',
  };
}
