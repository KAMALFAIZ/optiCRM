import apiClient from './client';
import { ApiResponse } from '../types/api';

export interface GoogleCalendarStatus {
  connected: boolean;
  googleEmail: string | null;
  calendarId: string | null;
  syncEnabled: boolean;
}

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  source: 'google';
}

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  frontendBaseUrl: string;
  secretConfigured: boolean;
  configured: boolean;
}

export const googleCalendarApi = {
  getConfig: async (): Promise<GoogleCalendarConfig> => {
    const response = await apiClient.get<ApiResponse<GoogleCalendarConfig>>('/google-calendar/config');
    return response.data.data!;
  },

  saveConfig: async (data: Omit<GoogleCalendarConfig, 'secretConfigured' | 'configured'>): Promise<GoogleCalendarConfig> => {
    const response = await apiClient.put<ApiResponse<GoogleCalendarConfig>>('/google-calendar/config', data);
    return response.data.data!;
  },

  getAuthUrl: async (): Promise<string> => {
    const response = await apiClient.get<ApiResponse<{ url: string }>>('/google-calendar/auth-url');
    return response.data.data!.url;
  },

  getStatus: async (): Promise<GoogleCalendarStatus> => {
    const response = await apiClient.get<ApiResponse<GoogleCalendarStatus>>('/google-calendar/status');
    return response.data.data!;
  },

  disconnect: async (): Promise<void> => {
    await apiClient.delete('/google-calendar/disconnect');
  },

  getEvents: async (from: string, to: string): Promise<GoogleCalendarEvent[]> => {
    const response = await apiClient.get<ApiResponse<GoogleCalendarEvent[]>>('/google-calendar/events', {
      params: { from, to },
    });
    return response.data.data || [];
  },
};

export default googleCalendarApi;
