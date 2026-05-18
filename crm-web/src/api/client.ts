import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { store } from '@/store';
import { logout, refreshAccessToken } from '@/features/auth/authSlice';
import type { ApiResponse } from '@/types/api';
import { queueMutation } from '@/db/offlineDb';

// Méthodes d'écriture interceptées en mode offline
const MUTATION_METHODS = ['post', 'put', 'patch', 'delete'] as const;
type MutationMethod = typeof MUTATION_METHODS[number];

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token + tenant header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.accessToken;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Inject tenant ID so the backend always knows which tenant to target.
    // Priority: resolved publicInfo > full tenant > persisted in localStorage
    const tenantId =
      (state as any).tenant?.publicInfo?.id ??
      (state as any).tenant?.tenant?.id ??
      localStorage.getItem('opticrm_tenant_id');
    if (tenantId && config.headers) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ── Offline : mettre les mutations en file d'attente ────────────────────
    const isNetworkError = !error.response && (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error' ||
      !navigator.onLine
    );

    // URLs temps-réel : jamais mise en queue offline (Sage SQL, imports, requêtes longues)
    const NON_QUEUEABLE = ['/sage/', '/integration/execute-query', '/integration/import'];
    const isNonQueueable = NON_QUEUEABLE.some(p => (originalRequest?.url ?? '').includes(p));

    if (isNetworkError && originalRequest && !isNonQueueable) {
      const method = (originalRequest.method?.toLowerCase() ?? '') as MutationMethod;
      if (MUTATION_METHODS.includes(method)) {
        const url = originalRequest.url ?? '';
        const body = originalRequest.data
          ? (typeof originalRequest.data === 'string'
              ? JSON.parse(originalRequest.data)
              : originalRequest.data)
          : undefined;

        // Extraire les métadonnées de version du body si présentes
        const meta = body && typeof body === 'object' ? {
          entityVersion: (body as Record<string, unknown>).version as number | undefined,
          entityType: detectEntityType(url),
          entityId: extractEntityId(url),
        } : undefined;

        await queueMutation(method.toUpperCase() as 'POST' | 'PUT' | 'PATCH' | 'DELETE', url, body, meta);

        // Rejeter avec une erreur lisible par l'UI
        const offlineError = new Error('OFFLINE_QUEUED');
        (offlineError as Error & { isOfflineQueued: boolean }).isOfflineQueued = true;
        return Promise.reject(offlineError);
      }
    }
    // ───────────────────────────────────────────────────────────────────────

    // ── Conflit de version (409) ─────────────────────────────────────────
    if (error.response?.status === 409) {
      const apiData = error.response.data as ApiResponse<unknown>;
      const conflictError = new Error('VERSION_CONFLICT') as Error & {
        isConflict: boolean;
        serverData: unknown;
        errorCode: string;
      };
      conflictError.isConflict = true;
      conflictError.serverData = apiData?.data;
      conflictError.errorCode = (apiData?.error as { code?: string })?.code ?? 'VERSION_CONFLICT';
      return Promise.reject(conflictError);
    }
    // ───────────────────────────────────────────────────────────────────────

    const isAuthEndpoint = (originalRequest?.url ?? '').startsWith('/auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
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
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const state = store.getState();
      const refreshToken = state.auth.refreshToken;

      if (!refreshToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        const result = await store.dispatch(refreshAccessToken(refreshToken));

        if (refreshAccessToken.fulfilled.match(result)) {
          const newToken = result.payload.accessToken;
          processQueue(null, newToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          return apiClient(originalRequest);
        } else {
          processQueue(new Error('Refresh token failed'), null);
          store.dispatch(logout());
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

export const handleApiError = (error: unknown): string => {
  // Mutation mise en file d'attente offline
  if (error instanceof Error && (error as Error & { isOfflineQueued?: boolean }).isOfflineQueued) {
    return 'OFFLINE_QUEUED';
  }
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiResponse<unknown>;
    if (apiError?.error?.message) {
      return apiError.error.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  return 'Une erreur inattendue est survenue';
};

/** Retourne true si l'erreur est une mutation mise en attente offline */
export const isOfflineQueued = (error: unknown): boolean =>
  error instanceof Error && !!(error as Error & { isOfflineQueued?: boolean }).isOfflineQueued;

/** Retourne true si l'erreur est un conflit de version (409) */
export const isVersionConflict = (error: unknown): boolean =>
  error instanceof Error && !!(error as Error & { isConflict?: boolean }).isConflict;

/** Extrait les données serveur d'une erreur de conflit */
export const getConflictServerData = (error: unknown): unknown =>
  error instanceof Error ? (error as Error & { serverData?: unknown }).serverData : undefined;

// ── Helpers internes ──────────────────────────────────────────────────────────

/** Détecte le type d'entité à partir de l'URL */
function detectEntityType(url: string): string | undefined {
  const match = url.match(/\/(accounts|contacts|leads|opportunities)(\/|$)/);
  return match ? match[1].replace(/s$/, '') : undefined; // 'account', 'contact', etc.
}

/** Extrait l'ID de l'entité depuis l'URL (ex: /accounts/uuid → uuid) */
function extractEntityId(url: string): string | undefined {
  const match = url.match(/\/(accounts|contacts|leads|opportunities)\/([a-f0-9-]+)/);
  return match ? match[2] : undefined;
}
