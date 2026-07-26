import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';
import type { AuthTokens, CustomerProfile } from '@/types/customer';
import { getDeviceSignature } from '@/utils/deviceInfo';

export const authApi = {
  requestOtp: (phone: string) =>
    unwrap<{ message: string; otp?: string }>(api.post(ENDPOINTS.AUTH.OTP_REQUEST, { phone })),

  verifyOtp: async (phone: string, otp: string) => {
    const device = await getDeviceSignature();
    return unwrap<AuthTokens>(api.post(ENDPOINTS.AUTH.OTP_VERIFY, { phone, otp, ...device }));
  },

  getMe: () =>
    unwrap<CustomerProfile>(api.get(ENDPOINTS.AUTH.ME)),

  logout: (refreshToken: string) =>
    unwrap<{ message: string }>(api.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken })),

  switchToVendor: async () => {
    const device = await getDeviceSignature();
    return unwrap<AuthTokens>(api.post(ENDPOINTS.AUTH.SWITCH_TO_VENDOR, { ...device }));
  },

  switchToCustomer: async () => {
    const device = await getDeviceSignature();
    return unwrap<AuthTokens>(api.post(ENDPOINTS.AUTH.SWITCH_TO_CUSTOMER, { ...device }));
  },

  getSessions: () =>
    unwrap<any[]>(api.get(ENDPOINTS.AUTH.SESSIONS)),

  revokeSession: (id: string) =>
    unwrap<{ success: boolean }>(api.delete(ENDPOINTS.AUTH.DELETE_SESSION(id))),
};
