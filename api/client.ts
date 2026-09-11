import axios, { AxiosError } from 'axios';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/storage';
import type { ApiResponse } from '@shared/types';
import { store } from '../store';
import { clearAuth, setTokens } from '../store/authSlice';

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export const TOKEN_KEY = 'accessToken';
export const REFRESH_KEY = 'refreshToken';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});


// ── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use(async (config) => {
  config.url = `/api/v1${config.url}`;
  
  // Try Redux first (in-memory, instant)
  let token = store.getState().auth.accessToken;
  
  // Fallback to SecureStore
  if (!token) {
    token = await getItemAsync(TOKEN_KEY);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Refresh queue ─────────────────────────────────────────────────────
let isRefreshing = false;
type QueueCallback = (token: string | null) => void;
let refreshQueue: QueueCallback[] = [];

function processQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

// ── Response interceptor: handle 401 → refresh and fix localhost URLs ────────
api.interceptors.response.use(
  (response) => {
    // Fix localhost URLs for images — happens when IMAGE_BASE_URL was not set on server
    // during upload, causing DB to store http://localhost:4000/... image URLs.
    // This rewrite ensures production APKs can still display those legacy images.
    if (response.data && typeof response.data === 'object' && API_BASE) {
      const str = JSON.stringify(response.data);
      if (str.includes('http://localhost:4000') || str.includes('http://localhost:3000')) {
        response.data = JSON.parse(
          str
            .replace(/http:\/\/localhost:4000/g, API_BASE)
            .replace(/http:\/\/localhost:3000/g, API_BASE)
        );
      }
    }
    return response;
  },
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
        refreshQueue.push((token: string | null) => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          } else {
            reject(error);
          }
        });
      });
    }

    isRefreshing = true;

    try {
      let refreshToken = store.getState().auth.refreshToken;
      if (!refreshToken) {
        refreshToken = await getItemAsync(REFRESH_KEY);
      }
      
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
      store.dispatch(setTokens({ accessToken: newAccess, refreshToken: newRefresh }));
      await saveTokens(newAccess, newRefresh);

      // Resolve all queued requests with the new token
      processQueue(newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshErr: any) {
      processQueue(null);

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
