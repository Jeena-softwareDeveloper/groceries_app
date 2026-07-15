import axios from 'axios';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/storage';
import type { ApiResponse } from '@shared/types';

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1';

export const TOKEN_KEY = 'accessToken';
export const REFRESH_KEY = 'refreshToken';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await promise;
  if (!data.success || data.data === null) {
    throw new Error(data.error?.message ?? 'Request failed');
  }
  return data.data;
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await setItemAsync(TOKEN_KEY, accessToken);
  await setItemAsync(REFRESH_KEY, refreshToken);
}

export async function clearTokens() {
  await deleteItemAsync(TOKEN_KEY);
  await deleteItemAsync(REFRESH_KEY);
}
