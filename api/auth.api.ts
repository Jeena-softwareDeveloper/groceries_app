import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';
import type { AuthTokens, CustomerProfile } from '@/types/customer';

export const authApi = {
  requestOtp: (phone: string) =>
    unwrap<{ message: string; otp?: string }>(api.post(ENDPOINTS.AUTH.OTP_REQUEST, { phone })),

  verifyOtp: (phone: string, otp: string) =>
    unwrap<AuthTokens>(api.post(ENDPOINTS.AUTH.OTP_VERIFY, { phone, otp })),

  getMe: () =>
    unwrap<CustomerProfile>(api.get(ENDPOINTS.AUTH.ME)),

  logout: (refreshToken: string) =>
    unwrap<{ message: string }>(api.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken })),

  switchToVendor: () =>
    unwrap<AuthTokens>(api.post(ENDPOINTS.AUTH.SWITCH_TO_VENDOR, {})),

  switchToCustomer: () =>
    unwrap<AuthTokens>(api.post(ENDPOINTS.AUTH.SWITCH_TO_CUSTOMER, {})),
};

