import { create } from 'zustand';
import { secureStorage } from '../utils/secureStorage';
import type { User } from '../types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
}

interface AuthActions {
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  isHydrated: false,

  setTokens: async (accessToken: string, refreshToken: string) => {
    await secureStorage.setItem('accessToken', accessToken);
    await secureStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  setUser: (user: User) => {
    set({ user });
  },

  logout: async () => {
    await secureStorage.deleteItem('accessToken');
    await secureStorage.deleteItem('refreshToken');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    try {
      const accessToken = await secureStorage.getItem('accessToken');
      const refreshToken = await secureStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        set({ accessToken, refreshToken, isAuthenticated: true });
        // Restore user profile from /auth/me
        try {
          const { default: apiClient } = await import('../api/client');
          const response = await apiClient.get('/auth/me');
          const userData = response.data?.data;
          if (userData) set({ user: userData });
        } catch {
          // User fetch failed — still authenticated, just no profile yet
        }
        set({ isLoading: false, isHydrated: true });
      } else {
        set({ isLoading: false, isHydrated: true });
      }
    } catch {
      set({ isLoading: false, isHydrated: true });
    }
  },
}));
