import axios from 'axios';
import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { LoginRequest, LoginResponse, TokenResponse, User } from '@/types/auth';

// Client brut sans intercepteur pour éviter les boucles infinies lors du refresh
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const rawAxios = axios.create({ baseURL: BASE_URL, timeout: 15000, headers: { 'Content-Type': 'application/json' } });

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return response.data.data!;
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    // Utiliser rawAxios (sans intercepteur) pour éviter la boucle infinie 401 → refresh → 401
    const response = await rawAxios.post<ApiResponse<TokenResponse>>('/auth/refresh', {
      refreshToken,
    });
    return response.data.data!;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  logoutAll: async (): Promise<void> => {
    await apiClient.post('/auth/logout-all');
  },

  getCurrentUser: async (token?: string): Promise<User> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const response = await apiClient.get<ApiResponse<User>>('/auth/me', { headers });
    return response.data.data!;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  setInitialPassword: async (newPassword: string): Promise<void> => {
    await apiClient.post('/auth/set-initial-password', { newPassword });
  },
};
