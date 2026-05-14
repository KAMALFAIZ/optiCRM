import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { API_URL, API_TIMEOUT } from '../config/api';
import { useAuthStore } from '../stores/authStore';
import type { ApiResponse } from '../types/api';
import type { TokenResponse } from '../types/auth';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Raw client for token refresh (no interceptors to avoid loops)
const rawAxios = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Token refresh queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Response interceptor: handle 401 refresh, offline, conflicts
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Offline detection (NetInfo unreliable on web — use navigator.onLine instead)
    const isOnline =
      typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
        ? navigator.onLine
        : (await NetInfo.fetch()).isConnected !== false;

    const isNetworkError =
      !error.response &&
      !isOnline &&
      (error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.message === 'Network Error');

    if (isNetworkError) {
      const offlineError = new Error('OFFLINE') as Error & { isOffline: boolean };
      offlineError.isOffline = true;
      return Promise.reject(offlineError);
    }

    // Version conflict (409)
    if (error.response?.status === 409) {
      const apiData = error.response.data as ApiResponse<unknown>;
      const conflictError = new Error('VERSION_CONFLICT') as Error & {
        isConflict: boolean;
        serverData: unknown;
      };
      conflictError.isConflict = true;
      conflictError.serverData = apiData?.data;
      return Promise.reject(conflictError);
    }

    // Token refresh on 401 ou 403 (backend peut renvoyer 403 pour token expiré)
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    if (isAuthError && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        await useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const response = await rawAxios.post<ApiResponse<TokenResponse>>('/auth/refresh', {
          refreshToken,
        });
        const data = response.data.data!;
        await useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        await useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;

export const handleApiError = (error: unknown): string => {
  if (error instanceof Error && (error as Error & { isOffline?: boolean }).isOffline) {
    return 'Vous êtes hors ligne. Vérifiez votre connexion.';
  }
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiResponse<unknown>;
    if (apiError?.error?.message) return apiError.error.message;
    if (error.message) return error.message;
  }
  return 'Une erreur inattendue est survenue';
};
