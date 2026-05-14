import apiClient from './client';
import { ApiResponse } from '@/types/api';

export interface TimelineEvent {
  id: string;
  type: 'activity' | 'visit' | 'opportunity' | 'quote' | 'invoice' | 'payment' | 'order' | 'note';
  title: string;
  description?: string;
  date: string;
  status?: string;
  amount?: number;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
}

export interface AccountTimeline {
  accountId: string;
  events: TimelineEvent[];
  totalEvents: number;
}

export const accountTimelineApi = {
  getTimeline: async (accountId: string, limit: number = 50, types?: string[]): Promise<AccountTimeline> => {
    const response = await apiClient.get<ApiResponse<AccountTimeline>>(`/accounts/${accountId}/timeline`, {
      params: { limit, types: types?.join(',') },
    });
    return response.data.data!;
  },
};

export default accountTimelineApi;
