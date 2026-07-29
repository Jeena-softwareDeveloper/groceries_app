import axios, { AxiosError } from 'axios';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/storage';
import type { ApiResponse } from '@shared/types';
import { store } from '../store';
import { clearAuth } from '../store/authSlice';

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export const TOKEN_KEY = 'accessToken';
export const REFRESH_KEY = 'refreshToken';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  config.url = `/api/v1${config.url}`;
  const token = await getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    if (data?.error?.message) return data.error.message;
    if (typeof data?.error === 'string') return data.error;
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Request failed';
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/otp')
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getItemAsync(REFRESH_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        // Must include /api/v1 — request interceptor is bypassed for raw axios.post
        const res = await axios.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
          `${API_BASE}/api/v1/auth/refresh`,
          { refreshToken }
        );
        if (res.data?.success && res.data?.data?.accessToken) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data.data;
          await saveTokens(newAccessToken, newRefreshToken);
          onRefreshed(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshErr) {
        await clearTokens();
        store.dispatch(clearAuth());
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const { data } = await promise;
    if (!data.success || data.data === null) {
      throw new Error(data.error?.message ?? 'Request failed');
    }
    return data.data;
  } catch (error) {
    if (error instanceof Error && !(error instanceof AxiosError)) {
      throw error;
    }
    throw new Error(extractApiErrorMessage(error));
  }
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await setItemAsync(TOKEN_KEY, accessToken);
  await setItemAsync(REFRESH_KEY, refreshToken);
}

export async function clearTokens() {
  await deleteItemAsync(TOKEN_KEY);
  await deleteItemAsync(REFRESH_KEY);
}
