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
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
  },
  timeout: 20000,
});

// ── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use(async (config) => {
  config.url = `/api/v1${config.url}`;
  const token = await getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Refresh queue ─────────────────────────────────────────────────────────────
let isRefreshing = false;
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void };
let refreshQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(token!);
    }
  });
  refreshQueue = [];
}

// ── Response interceptor: handle 401 → refresh ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Not a 401, or already retried, or it's a public auth route → skip
    const skipRefresh =
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/otp');

    if (skipRefresh) {
      return Promise.reject(error);
    }

    // Network error (no response) — don't log out, just propagate
    if (!error.response) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = await getItemAsync(REFRESH_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token stored');
      }

      // Bypass our interceptor by using raw axios so we don't double-prefix /api/v1
      const res = await axios.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
        `${API_BASE}/api/v1/auth/refresh`,
        { refreshToken },
        { timeout: 15000 }
      );

      if (!res.data?.success || !res.data?.data?.accessToken) {
        throw new Error('Refresh response invalid');
      }

      const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
      await saveTokens(newAccess, newRefresh);

      // Resolve all queued requests with the new token
      processQueue(null, newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshErr: any) {
      processQueue(refreshErr, null);

      // Only hard-logout on explicit auth rejection (401/403) or truly missing token.
      // Network timeouts, 500s, etc. should NOT log the user out.
      const isAuthRejection =
        refreshErr.message === 'No refresh token stored' ||
        refreshErr.message === 'Refresh response invalid' ||
        refreshErr.response?.status === 401 ||
        refreshErr.response?.status === 403;

      if (isAuthRejection) {
        await clearTokens();
        store.dispatch(clearAuth());
      }

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── Helpers ───────────────────────────────────────────────────────────────────
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
