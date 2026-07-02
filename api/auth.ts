import type { District, Area } from '@shared/types';
import { api, unwrap } from './client';
import type { AuthTokens, CustomerProfile } from '@/types/customer';

export async function requestOtp(phone: string) {
  return unwrap<{ message: string; otp?: string }>(
    api.post('/auth/customer/otp/request', { phone }),
  );
}

export async function verifyOtp(phone: string, otp: string) {
  return unwrap<AuthTokens>(api.post('/auth/customer/otp/verify', { phone, otp }));
}

export async function getMe() {
  return unwrap<CustomerProfile>(api.get('/auth/me'));
}

export async function logout(refreshToken: string) {
  return unwrap<{ message: string }>(api.post('/auth/logout', { refreshToken }));
}

export async function fetchDistricts() {
  return unwrap<District[]>(api.get('/customer/districts'));
}

export async function fetchAreas(districtId: string) {
  return unwrap<Area[]>(api.get('/customer/areas', { params: { districtId } }));
}
