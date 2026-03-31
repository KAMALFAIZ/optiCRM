import apiClient from './client';
import type { ApiResponse } from '@/types/api';

export interface AiSettings {
  apiKey: string;
  model: string;
  keyConfigured: boolean;
}

export interface SmtpSettings {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  fromName: string;
  starttls: boolean;
  auth: boolean;
}

export const settingsApi = {
  getSmtp: async (): Promise<SmtpSettings> => {
    const res = await apiClient.get<ApiResponse<SmtpSettings>>('/settings/smtp');
    return res.data.data!;
  },

  saveSmtp: async (data: SmtpSettings): Promise<SmtpSettings> => {
    const res = await apiClient.put<ApiResponse<SmtpSettings>>('/settings/smtp', data);
    return res.data.data!;
  },

  testSmtp: async (email: string): Promise<void> => {
    await apiClient.post('/settings/smtp/test', { email });
  },

  getAi: async (): Promise<AiSettings> => {
    const res = await apiClient.get<ApiResponse<AiSettings>>('/settings/ai');
    return res.data.data!;
  },

  saveAi: async (data: Pick<AiSettings, 'apiKey'>): Promise<AiSettings> => {
    const res = await apiClient.put<ApiResponse<AiSettings>>('/settings/ai', data);
    return res.data.data!;
  },

  testAi: async (): Promise<void> => {
    await apiClient.post('/ai/test');
  },
};
