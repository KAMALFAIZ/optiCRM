import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { authApi } from '@/api/auth';
import type { RootState } from '@/store';
import type { AuthState, LoginRequest, LoginResponse, TokenResponse, User } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'opticrm_access_token';
const REFRESH_TOKEN_KEY = 'opticrm_refresh_token';

const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

const initialState: AuthState = {
  user: null,
  accessToken: storedAccessToken,
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  isAuthenticated: false,
  // Only show loading if we have a token to verify — otherwise the login button would be stuck
  isLoading: !!storedAccessToken,
  error: null,
};

export const login = createAsyncThunk<LoginResponse & { fullUser: User }, LoginRequest>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);

      // Immediately fetch full user profile (with role permissions) from /auth/me
      // Pass the token explicitly because Redux store isn't updated yet at this point
      const fullUser = await authApi.getCurrentUser(response.accessToken);

      return { ...response, fullUser };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      return rejectWithValue(err.response?.data?.error?.message || 'Échec de la connexion');
    }
  }
);

export const checkAuth = createAsyncThunk<User, void>(
  'auth/checkAuth',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;

    // No token → skip the HTTP call entirely (no 401 in console)
    if (!token) {
      return rejectWithValue('NO_TOKEN');
    }

    // Quick JWT expiry check — reject without network call if expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        return rejectWithValue('TOKEN_EXPIRED');
      }
    } catch {
      // Malformed token → clean up
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return rejectWithValue('TOKEN_INVALID');
    }

    try {
      const user = await authApi.getCurrentUser();
      return user;
    } catch (error: unknown) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      return rejectWithValue(err.response?.data?.error?.message || 'Session expired');
    }
  }
);

export const refreshAccessToken = createAsyncThunk<TokenResponse, string>(
  'auth/refreshToken',
  async (refreshToken, { rejectWithValue }) => {
    try {
      const response = await authApi.refresh(refreshToken);
      localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      return response;
    } catch (error: unknown) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      return rejectWithValue(err.response?.data?.error?.message || 'Token refresh failed');
    }
  }
);

export const logoutAsync = createAsyncThunk<void, void>(
  'auth/logoutAsync',
  async (_, { getState }) => {
    const state = getState() as RootState;
    try {
      await authApi.logout(state.auth.refreshToken || undefined);
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        // Use the full user profile from /auth/me which includes role + permissions
        state.user = action.payload.fullUser;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        // Only show loading if not already authenticated
        // Prevents route tree tear-down on Strict Mode double-dispatch
        if (!state.isAuthenticated) {
          state.isLoading = true;
        }
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = null; // Never show checkAuth errors on the login page
      })

      // Refresh Token
      .addCase(refreshAccessToken.fulfilled, (state, action: PayloadAction<TokenResponse>) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })

      // Logout
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;

export default authSlice.reducer;
