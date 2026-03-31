import axios from 'axios';
import apiClient from './client';
import { API_URL } from '../config/api';
import type { ApiResponse } from '../types/api';
import type { LoginRequest, LoginResponse, TokenResponse, User } from '../types/auth';

const rawAxios = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials,
    );
    return response.data.data!;
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await rawAxios.post<ApiResponse<TokenResponse>>('/auth/refresh', {
      refreshToken,
    });
    return response.data.data!;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
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
};
